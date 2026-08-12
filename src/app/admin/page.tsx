'use client';

import React, { useState, useMemo } from 'react';
import { useMqttTelemetry } from '../../hooks/useMqttTelemetry';
import { useAlertManager } from '../../hooks/useAlertManager';
import { TopBar } from '../../components/TopBar';
import { StatusBar } from '../../components/StatusBar';
import { AlertPanel } from '../../components/AlertPanel';
import {
  Thermometer, Volume2, Activity, Gauge, Power, PowerOff,
  ArrowUpDown, Filter, AlertTriangle, CheckCircle2, Shield, Wrench
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

type SortField = 'name' | 'anomaly' | 'temp';
type FilterStatus = 'all' | 'critical' | 'warning' | 'nominal' | 'offline' | 'service';

// Mini gauge for the cards
const MiniRing: React.FC<{ value: number; max: number; size?: number }> = ({ value, max, size = 44 }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference - pct * circumference;
  const color = value >= 80 ? 'var(--status-critical)' : value >= 55 ? 'var(--status-warning)' : value >= 35 ? 'var(--status-watch)' : 'var(--status-nominal)';

  return (
    <svg width={size} height={size} className="gauge-ring">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-4)" strokeWidth="3.5" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ filter: value >= 80 ? `drop-shadow(0 0 3px ${color})` : 'none' }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="11" fontWeight="700" fontFamily="var(--font-mono)"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {value.toFixed(0)}
      </text>
    </svg>
  );
};

export default function AdminDashboard() {
  const {
    deviceData, deviceNames, powerStates, status, lastUpdated,
    simulated, setSimulated, reconnectAttempts
  } = useMqttTelemetry();

  const {
    alerts, activeAlertCount, criticalAlertCount, processTelemetry,
    acknowledgeAlert, resolveAlert, dismissAlert, markFalsePositive,
    acknowledgeAll, clearResolved,
  } = useAlertManager();

  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('anomaly');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Process telemetry through alert manager
  useEffect(() => {
    processTelemetry(deviceData, deviceNames, powerStates);
  }, [deviceData, deviceNames, powerStates, processTelemetry]);

  const deviceIds = Object.keys(deviceData);
  const onlineCount = deviceIds.filter(id => powerStates[id] ?? true).length;
  const offlineCount = deviceIds.length - onlineCount;
  const criticalDevices = deviceIds.filter(id => deviceData[id].anomaly_score >= 80 && (powerStates[id] ?? true)).length;
  
  // Count pods needing maintenance
  const serviceCount = deviceIds.filter(id => {
    const d = deviceData[id];
    if (!d.component_health || !(powerStates[id] ?? true)) return false;
    return Object.values(d.component_health).some(v => v <= 45); // replace_now or schedule_soon
  }).length;

  // Average fleet health (inverse of anomaly — higher is better)
  const avgHealth = deviceIds.length > 0
    ? deviceIds.reduce((sum, id) => {
        const isPowered = powerStates[id] ?? true;
        return sum + (isPowered ? Math.max(0, 100 - deviceData[id].anomaly_score) : 0);
      }, 0) / Math.max(onlineCount, 1)
    : 100;

  // Filter + Sort
  const filteredSortedIds = useMemo(() => {
    let ids = [...deviceIds];

    // Filter
    if (filterStatus !== 'all') {
      ids = ids.filter(id => {
        const isPowered = powerStates[id] ?? true;
        const score = deviceData[id].anomaly_score;
        switch (filterStatus) {
          case 'offline': return !isPowered;
          case 'critical': return isPowered && score >= 80;
          case 'warning': return isPowered && score >= 55 && score < 80;
          case 'nominal': return isPowered && score < 55;
          case 'service': return isPowered && deviceData[id].component_health && Object.values(deviceData[id].component_health).some(v => v <= 45);
        }
      });
    }

    // Sort
    ids.sort((a, b) => {
      switch (sortField) {
        case 'name': return (deviceNames[a] || a).localeCompare(deviceNames[b] || b);
        case 'anomaly': return deviceData[b].anomaly_score - deviceData[a].anomaly_score;
        case 'temp': return deviceData[b].temp - deviceData[a].temp;
      }
    });

    return ids;
  }, [deviceIds, filterStatus, sortField, deviceData, deviceNames, powerStates]);

  const healthColor = avgHealth >= 80 ? 'var(--status-nominal)' : avgHealth >= 50 ? 'var(--status-warning)' : 'var(--status-critical)';

  return (
    <main className="flex flex-col w-screen h-screen overflow-hidden" style={{ background: 'var(--surface-0)', color: 'var(--text-primary)' }}>
      <TopBar
        activeAlertCount={activeAlertCount}
        criticalAlertCount={criticalAlertCount}
        onToggleAlerts={() => setAlertPanelOpen(!alertPanelOpen)}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Fleet Summary Header */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--surface-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Pod Fleet Overview</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Real-time status of all connected edge pods
              </p>
            </div>
            {/* Enable Simulation Toggle for admin too */}
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className="relative w-9 h-5 rounded-full transition-colors duration-200"
                style={{ background: simulated ? 'var(--accent)' : 'var(--surface-4)' }}
                onClick={() => setSimulated(!simulated)}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                  style={{
                    background: '#fff',
                    transform: simulated ? 'translateX(18px)' : 'translateX(2px)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                />
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Simulation</span>
            </label>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-6 gap-3">
            <SummaryCard label="Total Pods" value={deviceIds.length} icon={<Shield className="w-4 h-4" />} color="var(--accent)" />
            <SummaryCard label="Online" value={onlineCount} icon={<Power className="w-4 h-4" />} color="var(--status-nominal)" />
            <SummaryCard label="Offline" value={offlineCount} icon={<PowerOff className="w-4 h-4" />} color="var(--status-offline)" />
            <SummaryCard label="Critical" value={criticalDevices} icon={<AlertTriangle className="w-4 h-4" />} color="var(--status-critical)" highlight={criticalDevices > 0} />
            <SummaryCard label="Service Due" value={serviceCount} icon={<Wrench className="w-4 h-4" />} color="var(--status-warning)" />
            <div
              className="p-3 rounded-lg flex flex-col items-center justify-center"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-border)' }}
            >
              <span className="text-[10px] font-semibold uppercase mb-1" style={{ color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                Fleet Health
              </span>
              <span className="text-2xl font-bold font-mono" style={{ color: healthColor }}>
                {avgHealth.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="px-6 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--surface-border)' }}>
          {/* Filters */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 mr-1" style={{ color: 'var(--text-dim)' }} />
            {(['all', 'critical', 'warning', 'nominal', 'service', 'offline'] as FilterStatus[]).map(opt => (
              <button
                key={opt}
                onClick={() => setFilterStatus(opt)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors"
                style={{
                  background: filterStatus === opt ? 'var(--accent-soft)' : 'transparent',
                  color: filterStatus === opt ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1" style={{ color: 'var(--text-dim)' }} />
            {([['anomaly', 'Anomaly ↓'], ['temp', 'Temp ↓'], ['name', 'Name A-Z']] as [SortField, string][]).map(([field, label]) => (
              <button
                key={field}
                onClick={() => setSortField(field)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
                style={{
                  background: sortField === field ? 'var(--accent-soft)' : 'transparent',
                  color: sortField === field ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Machine Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSortedIds.map(deviceId => {
            const data = deviceData[deviceId];
            const isPowered = powerStates[deviceId] ?? true;
            const isCritical = data.anomaly_score >= 80 && isPowered;
            const isWarning = data.anomaly_score >= 55 && isPowered;
            const name = deviceNames[deviceId] || deviceId;
            
            // Check component health
            const worstComponentHealth = isPowered && data.component_health
              ? Math.min(...Object.values(data.component_health))
              : 100;
              
            const needsImmediate = worstComponentHealth <= 20;
            const needsSoon = worstComponentHealth <= 45 && worstComponentHealth > 20;

            return (
              <Link
                key={deviceId}
                href={`/?device=${deviceId}`}
                className="block rounded-xl p-4 transition-all duration-200 hover:scale-[1.01] animate-slide-in-up"
                style={{
                  background: 'var(--surface-2)',
                  border: `1px solid ${isCritical ? 'var(--critical-border)' : isWarning ? 'var(--warning-border)' : 'var(--surface-border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: isCritical ? 'var(--shadow-glow-critical)' : 'none',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background: !isPowered ? 'var(--status-offline)' : isCritical ? 'var(--status-critical)' : isWarning ? 'var(--status-warning)' : 'var(--status-nominal)',
                          boxShadow: isCritical ? '0 0 6px var(--status-critical)' : 'none',
                        }}
                      />
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted pl-4" style={{ color: 'var(--text-dim)' }}>ID: {deviceId}</span>
                  </div>
                  <MiniRing value={isPowered ? data.anomaly_score : 0} max={100} size={40} />
                </div>

                {/* Status Labels */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <span
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded"
                    style={{
                      background: !isPowered ? 'rgba(107,114,128,0.1)' : isCritical ? 'var(--critical-bg)' : isWarning ? 'var(--warning-bg)' : 'var(--nominal-bg)',
                      color: !isPowered ? 'var(--status-offline)' : isCritical ? 'var(--status-critical)' : isWarning ? 'var(--status-warning)' : 'var(--status-nominal)',
                    }}
                  >
                    {!isPowered ? 'OFFLINE' : isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'NOMINAL'}
                  </span>
                  
                  {isPowered && (needsImmediate || needsSoon) && (
                    <span
                      className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1"
                      style={{
                        background: needsImmediate ? 'var(--critical-bg)' : 'var(--warning-bg)',
                        color: needsImmediate ? 'var(--status-critical)' : 'var(--status-warning)',
                        border: `1px solid ${needsImmediate ? 'var(--critical-border)' : 'var(--warning-border)'}`
                      }}
                    >
                      <Wrench className="w-2.5 h-2.5" />
                      {needsImmediate ? 'SERVICE NOW' : 'SERVICE SOON'}
                    </span>
                  )}
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-2">
                  <MetricMini label="Temp" value={`${data.temp.toFixed(1)}°`} icon={<Thermometer className="w-3 h-3" />} critical={data.temp >= 75 && isPowered} />
                  <MetricMini label="Sound" value={`${data.sound.toFixed(0)}dB`} icon={<Volume2 className="w-3 h-3" />} critical={data.sound >= 85 && isPowered} />
                  <MetricMini label="Vib" value={`${data.vibration.toFixed(1)}`} icon={<Activity className="w-3 h-3" />} critical={data.vibration >= 5 && isPowered} />
                </div>
              </Link>
            );
          })}

          {filteredSortedIds.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle2 className="w-10 h-10" style={{ color: 'var(--text-dim)', opacity: 0.3 }} />
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>No pods match the current filter</p>
            </div>
          )}
        </div>
      </div>

      <StatusBar
        status={status}
        lastUpdated={lastUpdated}
        deviceCount={deviceIds.length}
        onlineCount={onlineCount}
        reconnectAttempts={reconnectAttempts}
      />

      <AlertPanel
        isOpen={alertPanelOpen}
        onClose={() => setAlertPanelOpen(false)}
        alerts={alerts}
        onAcknowledge={acknowledgeAlert}
        onResolve={resolveAlert}
        onDismiss={dismissAlert}
        onMarkFalsePositive={markFalsePositive}
        onAcknowledgeAll={acknowledgeAll}
        onClearResolved={clearResolved}
      />
    </main>
  );
}

// ── Sub-components ──

function SummaryCard({ label, value, icon, color, highlight = false }: {
  label: string; value: number; icon: React.ReactNode; color: string; highlight?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${highlight ? 'animate-pulse-glow' : ''}`}
      style={{
        background: highlight ? 'var(--critical-bg)' : 'var(--surface-2)',
        border: `1px solid ${highlight ? 'var(--critical-border)' : 'var(--surface-border)'}`,
      }}
    >
      <div className="mb-1" style={{ color }}>{icon}</div>
      <span className="text-2xl font-bold font-mono" style={{ color }}>{value}</span>
      <span className="text-[10px] font-semibold uppercase mt-0.5" style={{ color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
        {label}
      </span>
    </div>
  );
}

function MetricMini({ label, value, icon, critical }: { label: string; value: string; icon: React.ReactNode; critical?: boolean }) {
  return (
    <div
      className="flex flex-col items-center py-1.5 rounded-md"
      style={{
        background: critical ? 'var(--critical-bg)' : 'var(--surface-3)',
        border: `1px solid ${critical ? 'var(--critical-border)' : 'var(--surface-border)'}`,
      }}
    >
      <div style={{ color: critical ? 'var(--status-critical)' : 'var(--text-dim)' }}>{icon}</div>
      <span className="text-[11px] font-bold font-mono mt-0.5" style={{ color: critical ? 'var(--status-critical)' : 'var(--text-primary)' }}>
        {value}
      </span>
      <span className="text-[8px] font-semibold uppercase" style={{ color: 'var(--text-dim)' }}>{label}</span>
    </div>
  );
}
