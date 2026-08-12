import { useState, useCallback, useRef, useEffect } from 'react';
import { DeviceTelemetryMap } from './useMqttTelemetry';

export type AlertSeverity = 'watch' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed' | 'false_positive';

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  metric: string;
  value: number;
  threshold: number;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

interface AlertCooldown {
  deviceId: string;
  metric: string;
  until: number; // timestamp
}

const MAX_ALERTS = 100;
const DEFAULT_COOLDOWN_MS = 30_000; // 30 seconds
const FALSE_POSITIVE_COOLDOWN_MS = 120_000; // 2 minutes for devices flagged false-positive
const AUTO_RESOLVE_HOLD_MS = 10_000; // Must stay below threshold for 10s to auto-resolve

// Threshold definitions
const THRESHOLDS = {
  temp: { watch: 55, warning: 65, critical: 75 },
  sound: { watch: 65, warning: 75, critical: 85 },
  vibration: { watch: 2.5, warning: 4, critical: 5 },
  anomaly_score: { watch: 35, warning: 55, critical: 80 },
} as const;

type MetricKey = keyof typeof THRESHOLDS;

function getSeverity(metric: MetricKey, value: number): AlertSeverity | null {
  const t = THRESHOLDS[metric];
  if (value >= t.critical) return 'critical';
  if (value >= t.warning) return 'warning';
  if (value >= t.watch) return 'watch';
  return null;
}

function getAlertTitle(metric: MetricKey, severity: AlertSeverity): string {
  const titles: Record<MetricKey, Record<AlertSeverity, string>> = {
    temp: { watch: 'Temperature Elevated', warning: 'High Temperature', critical: 'Motor Overheating' },
    sound: { watch: 'Noise Level Elevated', warning: 'High Noise Output', critical: 'Gear Wear Detected' },
    vibration: { watch: 'Vibration Detected', warning: 'Excessive Vibration', critical: 'Bearing Imbalance' },
    anomaly_score: { watch: 'Minor Irregularity', warning: 'Anomaly Detected', critical: 'Critical Anomaly' },
  };
  return titles[metric][severity];
}

function getAlertDescription(metric: MetricKey, severity: AlertSeverity, value: number): string {
  const unit: Record<MetricKey, string> = { temp: '°C', sound: 'dB', vibration: 'mm/s', anomaly_score: '%' };
  return `${metric === 'anomaly_score' ? 'Anomaly score' : metric.charAt(0).toUpperCase() + metric.slice(1)} reading of ${value.toFixed(1)}${unit[metric]} exceeds ${severity} threshold.`;
}

export function useAlertManager() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const cooldowns = useRef<AlertCooldown[]>([]);
  const falsePositiveDevices = useRef<Set<string>>(new Set());
  const belowThresholdTimers = useRef<Record<string, number>>({}); // key: `${deviceId}-${metric}`

  // Count active alerts
  const activeAlertCount = alerts.filter(a => a.status === 'active').length;
  const criticalAlertCount = alerts.filter(a => a.status === 'active' && a.severity === 'critical').length;

  // Check if a cooldown is active
  const isOnCooldown = useCallback((deviceId: string, metric: string): boolean => {
    const now = Date.now();
    cooldowns.current = cooldowns.current.filter(c => c.until > now);
    return cooldowns.current.some(c => c.deviceId === deviceId && c.metric === metric);
  }, []);

  // Set cooldown
  const setCooldown = useCallback((deviceId: string, metric: string) => {
    const duration = falsePositiveDevices.current.has(deviceId)
      ? FALSE_POSITIVE_COOLDOWN_MS
      : DEFAULT_COOLDOWN_MS;
    cooldowns.current.push({ deviceId, metric, until: Date.now() + duration });
  }, []);

  // Process telemetry and generate alerts
  const processTelemetry = useCallback((
    deviceData: DeviceTelemetryMap,
    deviceNames: Record<string, string>,
    powerStates: Record<string, boolean>
  ) => {
    const now = Date.now();

    setAlerts(prevAlerts => {
      let updated = [...prevAlerts];

      Object.entries(deviceData).forEach(([deviceId, data]) => {
        const isPowered = powerStates[deviceId] ?? true;
        if (!isPowered) return;

        const metrics: MetricKey[] = ['temp', 'sound', 'vibration', 'anomaly_score'];

        metrics.forEach(metric => {
          const value = data[metric];
          const severity = getSeverity(metric, value);
          const alertKey = `${deviceId}-${metric}`;

          if (severity) {
            // Check for existing active alert on this device+metric
            const existingIdx = updated.findIndex(
              a => a.deviceId === deviceId && a.metric === metric && (a.status === 'active' || a.status === 'acknowledged')
            );

            if (existingIdx >= 0) {
              // Update severity if it changed
              const existing = updated[existingIdx];
              if (existing.severity !== severity) {
                updated[existingIdx] = {
                  ...existing,
                  severity,
                  title: getAlertTitle(metric, severity),
                  description: getAlertDescription(metric, severity, value),
                  value,
                  updatedAt: new Date(),
                };
              } else {
                // Just update the value
                updated[existingIdx] = { ...existing, value, updatedAt: new Date() };
              }
              // Clear auto-resolve timer
              delete belowThresholdTimers.current[alertKey];
            } else if (!isOnCooldown(deviceId, metric)) {
              // Create new alert
              const newAlert: Alert = {
                id: `alert-${now}-${Math.random().toString(36).slice(2, 6)}`,
                deviceId,
                deviceName: deviceNames[deviceId] || deviceId,
                severity,
                status: 'active',
                title: getAlertTitle(metric, severity),
                description: getAlertDescription(metric, severity, value),
                metric,
                value,
                threshold: THRESHOLDS[metric][severity],
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              updated = [newAlert, ...updated];
              setCooldown(deviceId, metric);
            }
          } else {
            // Value is below all thresholds — start auto-resolve timer
            const existingIdx = updated.findIndex(
              a => a.deviceId === deviceId && a.metric === metric && (a.status === 'active' || a.status === 'acknowledged')
            );

            if (existingIdx >= 0) {
              if (!belowThresholdTimers.current[alertKey]) {
                belowThresholdTimers.current[alertKey] = now;
              } else if (now - belowThresholdTimers.current[alertKey] >= AUTO_RESOLVE_HOLD_MS) {
                updated[existingIdx] = {
                  ...updated[existingIdx],
                  status: 'resolved',
                  resolvedAt: new Date(),
                  updatedAt: new Date(),
                };
                delete belowThresholdTimers.current[alertKey];
              }
            }
          }
        });
      });

      // Trim to max alerts
      return updated.slice(0, MAX_ALERTS);
    });
  }, [isOnCooldown, setCooldown]);

  // User actions
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, status: 'acknowledged' as AlertStatus, acknowledgedAt: new Date(), updatedAt: new Date() } : a
    ));
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, status: 'resolved' as AlertStatus, resolvedAt: new Date(), updatedAt: new Date() } : a
    ));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, status: 'dismissed' as AlertStatus, updatedAt: new Date() } : a
    ));
  }, []);

  const markFalsePositive = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        // Add device to false-positive set for extended cooldown
        falsePositiveDevices.current.add(a.deviceId);
        // Set extended cooldown for this device+metric
        setCooldown(a.deviceId, a.metric);
        return { ...a, status: 'false_positive' as AlertStatus, updatedAt: new Date() };
      }
      return a;
    }));
  }, [setCooldown]);

  const acknowledgeAll = useCallback(() => {
    setAlerts(prev => prev.map(a =>
      a.status === 'active' ? { ...a, status: 'acknowledged' as AlertStatus, acknowledgedAt: new Date(), updatedAt: new Date() } : a
    ));
  }, []);

  const clearResolved = useCallback(() => {
    setAlerts(prev => prev.filter(a => a.status === 'active' || a.status === 'acknowledged'));
  }, []);

  return {
    alerts,
    activeAlertCount,
    criticalAlertCount,
    processTelemetry,
    acknowledgeAlert,
    resolveAlert,
    dismissAlert,
    markFalsePositive,
    acknowledgeAll,
    clearResolved,
  };
}
