import { useMemo } from 'react';
import { TelemetryData, TelemetryHistory, ComponentHealth } from './useMqttTelemetry';

// ── Types ──

export type MaintenanceUrgency = 'replace_now' | 'schedule_soon' | 'monitor' | 'healthy';

export interface ComponentPrediction {
  component: keyof ComponentHealth;
  label: string;
  health: number;
  trend: 'improving' | 'stable' | 'degrading';
  wearRatePerHour: number;
  remainingHours: number | null;    // null = healthy, no concern
  urgency: MaintenanceUrgency;
}

export interface MaintenanceRecommendation {
  id: string;
  component: keyof ComponentHealth;
  componentLabel: string;
  urgency: MaintenanceUrgency;
  health: number;
  remainingHours: number | null;
  action: string;
  reason: string;
  confidence: number;   // 0-100%
}

// ── Constants ──

const COMPONENT_LABELS: Record<keyof ComponentHealth, string> = {
  bearing: 'Bearing Assembly',
  gear: 'Gear Train',
  motor: 'Drive Motor',
  belt: 'Drive Belt',
  spindle: 'Spindle Unit',
};

const REPLACEMENT_THRESHOLD = 20;  // Below 20% → replace now
const SCHEDULE_THRESHOLD = 45;     // Below 45% → schedule soon
const MONITOR_THRESHOLD = 70;      // Below 70% → monitor

const COMPONENT_ACTIONS: Record<keyof ComponentHealth, Record<MaintenanceUrgency, string>> = {
  bearing: {
    replace_now: 'Replace bearing assembly immediately. Continued operation risks seizure and catastrophic failure.',
    schedule_soon: 'Schedule bearing replacement within the next maintenance window. Lubrication may extend life temporarily.',
    monitor: 'Monitor bearing closely. Check for unusual noise or temperature spikes during operation.',
    healthy: 'Bearing operating within normal parameters. Next inspection at scheduled interval.',
  },
  gear: {
    replace_now: 'Replace gear set immediately. Tooth wear has reached critical levels — high risk of gear mesh failure.',
    schedule_soon: 'Plan gear inspection and replacement. Check for pitting, scoring, and backlash.',
    monitor: 'Monitor gear noise signature. Early wear patterns detected in spectral analysis.',
    healthy: 'Gear train operating normally. Lubrication levels adequate.',
  },
  motor: {
    replace_now: 'Motor winding degradation critical. Replace motor or rewind stator immediately.',
    schedule_soon: 'Motor efficiency declining. Schedule thermal inspection and winding resistance test.',
    monitor: 'Motor temperature trending upward. Ensure cooling vents are unobstructed.',
    healthy: 'Motor running within rated parameters. Current draw normal.',
  },
  belt: {
    replace_now: 'Drive belt critically worn. Replace immediately to prevent snapping during operation.',
    schedule_soon: 'Belt shows tension loss and surface cracking. Order replacement and schedule swap.',
    monitor: 'Belt tension slightly below optimal. Adjust tensioner and monitor for slippage.',
    healthy: 'Belt tension and condition normal. No replacement needed.',
  },
  spindle: {
    replace_now: 'Spindle runout exceeds tolerance. Replace spindle bearings or entire spindle assembly.',
    schedule_soon: 'Spindle vibration increasing. Schedule precision alignment check and bearing inspection.',
    monitor: 'Minor spindle vibration detected. Check chuck condition and workpiece clamping.',
    healthy: 'Spindle running true. Runout within specification.',
  },
};

// ── Hook ──

export function usePredictiveEngine(
  currentData: TelemetryData | undefined,
  history: TelemetryData[],
  isPowered: boolean,
  discoveredComponents?: string[]
) {
  const predictions = useMemo((): ComponentPrediction[] => {
    if (!currentData || !isPowered) {
      return (Object.keys(COMPONENT_LABELS) as (keyof ComponentHealth)[]).map(comp => ({
        component: comp,
        label: COMPONENT_LABELS[comp],
        health: currentData?.component_health?.[comp] ?? 100,
        trend: 'stable' as const,
        wearRatePerHour: 0,
        remainingHours: null,
        urgency: 'healthy' as MaintenanceUrgency,
      }));
    }

    const components = Object.keys(COMPONENT_LABELS) as (keyof ComponentHealth)[];
    const activeComponents = discoveredComponents 
      ? components.filter(c => discoveredComponents.includes(c))
      : components;

    return activeComponents.map(comp => {
      const health = currentData.component_health[comp];

      // Calculate wear trend from history
      let trend: 'improving' | 'stable' | 'degrading' = 'stable';
      let wearRatePerHour = 0;

      if (history.length >= 5) {
        const recent = history.slice(-5).map(h => h.component_health[comp]);
        const older = history.slice(0, Math.min(5, history.length)).map(h => h.component_health[comp]);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        const diff = recentAvg - olderAvg;

        if (diff < -0.5) {
          trend = 'degrading';
          // Estimate hourly wear rate: diff per reading × readings per hour (3600 readings at 1/sec)
          wearRatePerHour = Math.abs(diff / history.length) * 3600;
        } else if (diff > 0.5) {
          trend = 'improving';
        }
      }

      // Estimate remaining useful life
      let remainingHours: number | null = null;
      if (trend === 'degrading' && wearRatePerHour > 0) {
        const remainingHealth = health - REPLACEMENT_THRESHOLD;
        if (remainingHealth > 0) {
          remainingHours = Math.round(remainingHealth / wearRatePerHour);
        } else {
          remainingHours = 0;
        }
      }

      // Determine urgency
      let urgency: MaintenanceUrgency = 'healthy';
      if (health <= REPLACEMENT_THRESHOLD) {
        urgency = 'replace_now';
      } else if (health <= SCHEDULE_THRESHOLD) {
        urgency = 'schedule_soon';
      } else if (health <= MONITOR_THRESHOLD) {
        urgency = 'monitor';
      }

      return { component: comp, label: COMPONENT_LABELS[comp], health, trend, wearRatePerHour, remainingHours, urgency };
    });
  }, [currentData, history, isPowered, discoveredComponents]);

  // Generate recommendations sorted by urgency
  const recommendations = useMemo((): MaintenanceRecommendation[] => {
    const urgencyOrder: Record<MaintenanceUrgency, number> = {
      replace_now: 0, schedule_soon: 1, monitor: 2, healthy: 3,
    };

    return predictions
      .filter(p => p.urgency !== 'healthy')
      .sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
      .map(p => ({
        id: `rec-${p.component}`,
        component: p.component,
        componentLabel: p.label,
        urgency: p.urgency,
        health: p.health,
        remainingHours: p.remainingHours,
        action: COMPONENT_ACTIONS[p.component][p.urgency],
        reason: p.trend === 'degrading'
          ? `Health declining at ~${p.wearRatePerHour.toFixed(1)}%/hr. ${p.remainingHours !== null ? `Estimated ${p.remainingHours}h until replacement threshold.` : ''}`
          : `Component health at ${p.health.toFixed(0)}% — below ${p.urgency === 'replace_now' ? 'critical' : p.urgency === 'schedule_soon' ? 'service' : 'monitoring'} threshold.`,
        confidence: p.trend === 'degrading' ? Math.min(85 + (30 - Math.min(history.length, 30)), 95) : 70,
      }));
  }, [predictions, history.length]);

  // Overall machine health score (worst component)
  const worstComponent = predictions.reduce((worst, p) =>
    p.health < worst.health ? p : worst
  , predictions[0] || { health: 100, urgency: 'healthy' as MaintenanceUrgency });

  const maintenanceNeeded = recommendations.length;
  const criticalComponents = predictions.filter(p => p.urgency === 'replace_now').length;

  return {
    predictions,
    recommendations,
    worstComponent,
    maintenanceNeeded,
    criticalComponents,
    componentLabels: COMPONENT_LABELS,
  };
}
