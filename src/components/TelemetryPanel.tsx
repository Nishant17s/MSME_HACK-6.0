'use client';

import React, { useState } from 'react';
import { EStopBanner } from './EStopBanner';
import { TelemetryData, TelemetryHistory, CalibrationState } from '../hooks/useMqttTelemetry';
import { ComponentPrediction, MaintenanceRecommendation } from '../hooks/usePredictiveEngine';
import { MaintenancePanel } from './MaintenancePanel';
import { SpectralPanel } from './SpectralPanel';
import { Activity, Thermometer, Volume2, Gauge, ChevronDown, ChevronUp, Power, Trash2, Cpu, Wifi, Clock, BrainCircuit, CheckCircle2, Network } from 'lucide-react';
import { ModelSelector } from './ModelSelector';

interface TelemetryPanelProps {
  data: TelemetryData;
  status: 'Connecting' | 'Connected' | 'Disconnected';
  simulated: boolean;
  setSimulated: (val: boolean) => void;
  forceFault: boolean;
  setForceFault: (val: boolean) => void;
  activeModelId: string;
  onSelectModel: (id: string, url?: string, name?: string) => void;
  isPowered: boolean;
  onTogglePower: () => void;
  onRemoveDevice: () => void;
  history?: TelemetryData[];
  predictions: ComponentPrediction[];
  recommendations: MaintenanceRecommendation[];
  calibrationState: CalibrationState;
  discoveredComponents: string[];
  onVerifyCalibration: (components: string[]) => void;
  calibrationProgress: number;
  variableRpm: boolean;
  setVariableRpm: (val: boolean) => void;
  tamperedPod: boolean;
  setTamperedPod: (val: boolean) => void;
  multiPodMesh: boolean;
  setMultiPodMesh: (val: boolean) => void;
}

type TabId = 'telemetry' | 'maintenance' | 'spectral';

// ── Circular Gauge ──
const CircularGauge: React.FC<{
  value: number;
  max: number;
  label: string;
  unit: string;
  icon: React.ReactNode;
  thresholds: { warning: number; critical: number };
}> = ({ value, max, label, unit, icon, thresholds }) => {
  const size = 100;
  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference - pct * circumference;

  const isCritical = value >= thresholds.critical;
  const isWarning = value >= thresholds.warning;
  const color = isCritical ? 'var(--status-critical)' : isWarning ? 'var(--status-warning)' : 'var(--accent)';

  return (
    <div
      className="flex flex-col items-center p-3 transition-all duration-300"
      style={{
        borderRadius: 'var(--radius-lg)',
        background: isCritical ? 'var(--critical-bg)' : 'var(--surface-2)',
        border: `1px solid ${isCritical ? 'var(--critical-border)' : 'var(--surface-border)'}`,
      }}
    >
      <svg width={size} height={size} className="gauge-ring">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-4)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ filter: isCritical ? `drop-shadow(0 0 4px ${color})` : 'none' }}
        />
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="18" fontWeight="700" fontFamily="var(--font-mono)"
          transform={`rotate(90, ${size / 2}, ${size / 2})`}
        >
          {typeof value === 'number' ? value.toFixed(value >= 100 ? 0 : 1) : value}
        </text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" dominantBaseline="central"
          fill="var(--text-dim)" fontSize="9" fontFamily="var(--font-mono)"
          transform={`rotate(90, ${size / 2}, ${size / 2})`}
        >
          {unit}
        </text>
      </svg>
      <div className="flex items-center gap-1.5 mt-1.5">
        <span style={{ color: 'var(--text-dim)' }}>{icon}</span>
        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)', letterSpacing: '0.03em' }}>
          {label}
        </span>
      </div>
    </div>
  );
};

// ── Sparkline ──
const Sparkline: React.FC<{ data: number[]; color: string; height?: number; width?: number }> = ({
  data, color, height = 28, width = 120
}) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const lastIdx = data.length - 1;
  const areaPoints = `0,${height} ${points} ${lastIdx * step},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-grad-${color.replace(/[^a-z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-grad-${color.replace(/[^a-z0-9]/g, '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastIdx * step} cy={height - ((data[lastIdx] - min) / range) * (height - 4) - 2} r="2.5" fill={color} />
    </svg>
  );
};

// ── Toggle ──
const Toggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void; label: string; accent?: string }> = ({
  checked, onChange, label, accent = 'var(--accent)'
}) => (
  <label className="flex items-center gap-3 cursor-pointer py-1">
    <div
      className="relative w-9 h-5 rounded-full transition-colors duration-200"
      style={{ background: checked ? accent : 'var(--surface-4)' }}
      onClick={() => onChange(!checked)}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
        style={{
          background: '#fff',
          transform: checked ? 'translateX(18px)' : 'translateX(2px)',
          boxShadow: 'var(--shadow-sm)',
        }}
      />
    </div>
    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
  </label>
);

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  data, status, simulated, setSimulated, forceFault, setForceFault,
  activeModelId, onSelectModel, isPowered, onTogglePower, onRemoveDevice,
  history = [], predictions, recommendations,
  calibrationState, discoveredComponents, onVerifyCalibration,
  calibrationProgress, variableRpm, setVariableRpm, tamperedPod, setTamperedPod,
  multiPodMesh, setMultiPodMesh
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('telemetry');
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [pendingComponents, setPendingComponents] = useState<string[]>(discoveredComponents);

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: 'telemetry', label: 'Telemetry' },
    { id: 'maintenance', label: 'Maintenance', badge: recommendations.length || undefined },
    { id: 'spectral', label: 'Spectral' },
  ];

  const getDiagnostics = () => {
    if (!isPowered) return { text: 'System Offline — Power Disconnected', tier: 'offline' };
    if (data.pod_status === 'tampered') return { text: 'Pod Misalignment / Tamper Detected', tier: 'critical' };
    if (data.anomaly_score < 35) return { text: 'All Systems Nominal', tier: 'nominal' };
    if (data.anomaly_score < 55) return { text: 'Minor Irregularity — Monitoring', tier: 'watch' };
    const faults = [];
    if (data.temp >= 75) faults.push('Motor Overheating');
    if (data.sound >= 85) faults.push('Gear Wear Detected');
    if (data.vibration >= 5) faults.push('Bearing Imbalance');
    if (faults.length === 0 && data.anomaly_score >= 80) return { text: 'Unknown Critical Anomaly', tier: 'critical' };
    if (faults.length > 0) return { text: faults.join(' · '), tier: data.anomaly_score >= 80 ? 'critical' : 'warning' };
    return { text: 'Minor Irregularities', tier: 'warning' };
  };

  const diag = getDiagnostics();
  const diagColor = diag.tier === 'critical' ? 'var(--status-critical)' : diag.tier === 'warning' ? 'var(--status-warning)' : diag.tier === 'watch' ? 'var(--status-watch)' : diag.tier === 'offline' ? 'var(--status-offline)' : 'var(--status-nominal)';
  const diagBg = diag.tier === 'critical' ? 'var(--critical-bg)' : diag.tier === 'warning' ? 'var(--warning-bg)' : diag.tier === 'watch' ? 'rgba(59,130,246,0.08)' : 'var(--nominal-bg)';

  const tempHistory = history.map(h => h.temp);
  const soundHistory = history.map(h => h.sound);
  const vibHistory = history.map(h => h.vibration);
  const anomalyHistory = history.map(h => h.anomaly_score);

  // Auto-Calibration View
  if (calibrationState === 'calibrating') {
    let calibPhase = 'Environment Noise Profiling...';
    let calibDesc = 'Learning ambient factory noise to establish a baseline.';
    const pct = Math.min((calibrationProgress / 15) * 100, 100);
    
    if (calibrationProgress >= 10) {
      calibPhase = 'Component Inference...';
      calibDesc = 'Applying Blind Source Separation to discover mechanical components.';
    } else if (calibrationProgress >= 5) {
      calibPhase = 'RPM Order Tracking...';
      calibDesc = 'Locking onto fundamental operating frequency to track harmonics.';
    }

    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 relative z-10" style={{ background: 'var(--surface-1)', borderLeft: '1px solid var(--surface-border)' }}>
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ background: 'var(--nominal-bg)', border: '1px solid var(--nominal-border)', color: 'var(--status-nominal)' }}>
          <Power className="w-3.5 h-3.5" />
          POWER ON
        </div>
        
        <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-dashed animate-[spin_8s_linear_infinite]" style={{ borderColor: 'var(--surface-4)' }} />
          <div className="absolute inset-0 rounded-full border-4 border-dashed animate-[spin_4s_linear_infinite_reverse]" style={{ borderColor: 'var(--accent)', opacity: 0.3 }} />
          <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse-glow" style={{ background: 'var(--accent-soft)', border: '2px solid var(--accent)' }}>
            <BrainCircuit className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
        </div>
        
        <h2 className="text-sm font-semibold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>{calibPhase}</h2>
        <p className="text-[11px] text-center px-4 leading-relaxed h-8" style={{ color: 'var(--text-muted)' }}>
          {calibDesc}
        </p>
        
        <div className="w-full max-w-[200px] h-1.5 rounded-full mt-6 overflow-hidden" style={{ background: 'var(--surface-3)' }}>
          <div className="h-full rounded-full transition-all duration-1000 ease-linear" style={{ background: 'var(--accent)', width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  // Human-in-the-loop Verification View
  if (calibrationState === 'completed') {
    const COMP_LABELS: Record<string, string> = {
      bearing: 'Rotational Bearing (BPFO)',
      gear: 'Gear Mesh Matrix',
      motor: 'Drive Motor (50Hz hum)',
      belt: 'Drive Belt / Pulley',
      spindle: 'High-speed Spindle',
    };

    return (
      <div className="h-full w-full flex flex-col p-6 relative z-10" style={{ background: 'var(--surface-1)', borderLeft: '1px solid var(--surface-border)' }}>
        <div className="flex flex-col items-center justify-center mb-6 pt-8 animate-fade-in">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--nominal-bg)' }}>
            <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--status-nominal)' }} />
          </div>
          <h2 className="text-sm font-semibold text-center" style={{ color: 'var(--text-primary)' }}>Calibration Complete</h2>
          <p className="text-[11px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>
            The AI engine has inferred the following components based on FFT spectral signatures. Please verify before tracking.
          </p>
        </div>

        <div className="space-y-2 mb-8 flex-1">
          {Object.entries(COMP_LABELS).map(([key, label]) => {
            const isSelected = pendingComponents.includes(key);
            return (
              <div 
                key={key} 
                onClick={() => {
                  setPendingComponents(prev => 
                    isSelected ? prev.filter(k => k !== key) : [...prev, key]
                  );
                }}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                style={{ 
                  background: isSelected ? 'var(--accent-soft)' : 'var(--surface-2)',
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--surface-border)' 
                }}
              >
                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" 
                  style={{ background: isSelected ? 'var(--accent)' : 'transparent', border: isSelected ? 'none' : '1px solid var(--surface-border-light)' }}
                >
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold" style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
                  {isSelected && <span className="text-[9px] font-mono" style={{ color: 'var(--accent)' }}>Signature Locked</span>}
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => onVerifyCalibration(pendingComponents)}
          className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 mt-auto"
          style={{ background: 'var(--accent)' }}
        >
          Verify & Track Components
        </button>
      </div>
    );
  }

  // Normal Dashboard View
  return (
    <div
      className="h-full w-full flex flex-col overflow-hidden relative z-10"
      style={{ background: 'var(--surface-1)', borderLeft: '1px solid var(--surface-border)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--surface-border)' }}>
        <div>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Pod Dashboard</h1>
          <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {status === 'Connected' ? 'LIVE' : status.toUpperCase()} · FW {data.pod_firmware}
          </p>
        </div>
        <button
          onClick={onTogglePower}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200"
          style={{
            background: isPowered ? 'var(--critical-bg)' : 'var(--nominal-bg)',
            border: `1px solid ${isPowered ? 'var(--critical-border)' : 'var(--nominal-border)'}`,
            color: isPowered ? 'var(--status-critical)' : 'var(--status-nominal)',
          }}
        >
          <Power className="w-3.5 h-3.5" />
          {isPowered ? 'E-STOP' : 'POWER ON'}
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--surface-border)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150"
            style={{
              background: activeTab === tab.id ? 'var(--accent-soft)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold text-white px-1"
                style={{ background: 'var(--status-warning)' }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

        {activeTab === 'telemetry' && (
          <>
            <ModelSelector activeModelId={activeModelId} onSelectModel={onSelectModel} />

            {/* Phase 5: Sentinel Mesh Visualization */}
            {multiPodMesh && (
              <div className="p-4 rounded-lg flex flex-col gap-3 relative overflow-hidden" style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-border)' }}>
                {/* Background Network Graphic */}
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Network className="w-32 h-32" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5" />
                      Sentinel Mesh Active
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">3 ESP-NOW nodes grouped to this machine</p>
                  </div>
                  <div className="px-2 py-1 rounded bg-[var(--nominal-bg)] border border-[var(--nominal-border)] text-[9px] font-bold text-[var(--status-nominal)]">
                    SYNCED
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { id: 'master', label: 'Drive (Master)', lat: '<1ms' },
                    { id: 'node1', label: 'Gearbox (Slave)', lat: '2.4ms' },
                    { id: 'node2', label: 'Spindle (Slave)', lat: '3.1ms' }
                  ].map(node => (
                    <div key={node.id} className="flex flex-col items-center justify-center p-2 rounded bg-[var(--surface-3)] border border-[var(--surface-4)] text-center relative">
                      <div className="w-2 h-2 rounded-full absolute top-1.5 right-1.5 animate-pulse" style={{ background: 'var(--status-nominal)' }} />
                      <Wifi className="w-4 h-4 mb-1" style={{ color: 'var(--text-dim)' }} />
                      <span className="text-[9px] font-semibold text-[var(--text-primary)]">{node.label}</span>
                      <span className="text-[8px] font-mono text-[var(--status-watch)] mt-0.5">{node.lat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostics */}
            <div
              className="px-3 py-2.5 rounded-lg"
              style={{ background: diagBg, border: `1px solid ${diag.tier === 'critical' ? 'var(--critical-border)' : diag.tier === 'warning' ? 'var(--warning-border)' : 'var(--nominal-border)'}` }}
            >
              <h3 className="text-[10px] font-semibold uppercase mb-0.5" style={{ color: diagColor, letterSpacing: '0.05em', opacity: 0.8 }}>
                Diagnostics
              </h3>
              <p className="text-xs font-medium" style={{ color: diagColor }}>{diag.text}</p>
            </div>

            <EStopBanner anomalyScore={data.anomaly_score} isPowered={isPowered} />

            {/* Gauges */}
            <div className="grid grid-cols-2 gap-3">
              <CircularGauge value={data.temp} max={120} label="Temperature" unit="°C" icon={<Thermometer className="w-3 h-3" />} thresholds={{ warning: 65, critical: 75 }} />
              <CircularGauge value={data.sound} max={130} label="Sound Level" unit="dB" icon={<Volume2 className="w-3 h-3" />} thresholds={{ warning: 75, critical: 85 }} />
              <CircularGauge value={data.vibration} max={12} label="Vibration" unit="mm/s" icon={<Activity className="w-3 h-3" />} thresholds={{ warning: 4, critical: 5 }} />
              <CircularGauge value={data.anomaly_score} max={100} label="Anomaly" unit="%" icon={<Gauge className="w-3 h-3" />} thresholds={{ warning: 55, critical: 80 }} />
            </div>

            {/* Sparklines */}
            {history.length >= 2 && (
              <div
                className="p-3 rounded-lg space-y-2.5"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)' }}
              >
                <h3 className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                  Trend ({history.length} readings)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono" style={{ color: 'var(--text-dim)' }}>TEMP</span>
                    <Sparkline data={tempHistory} color="var(--status-warning)" width={130} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono" style={{ color: 'var(--text-dim)' }}>SOUND</span>
                    <Sparkline data={soundHistory} color="var(--status-watch)" width={130} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono" style={{ color: 'var(--text-dim)' }}>VIBRATION</span>
                    <Sparkline data={vibHistory} color="var(--accent)" width={130} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono" style={{ color: 'var(--text-dim)' }}>ANOMALY</span>
                    <Sparkline data={anomalyHistory} color="var(--status-critical)" width={130} />
                  </div>
                </div>
              </div>
            )}

            {/* Pod Metadata */}
            <div
              className="p-3 rounded-lg grid grid-cols-3 gap-2"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)' }}
            >
              <div className="flex flex-col items-center py-1">
                <Cpu className="w-3 h-3 mb-1" style={{ color: 'var(--text-dim)' }} />
                <span className="text-[9px] font-mono" style={{ color: 'var(--text-primary)' }}>{data.pod_firmware}</span>
                <span className="text-[7px] uppercase" style={{ color: 'var(--text-dim)' }}>Firmware</span>
              </div>
              <div className="flex flex-col items-center py-1">
                <Clock className="w-3 h-3 mb-1" style={{ color: 'var(--text-dim)' }} />
                <span className="text-[9px] font-mono" style={{ color: 'var(--text-primary)' }}>{data.pod_uptime_hours.toFixed(1)}h</span>
                <span className="text-[7px] uppercase" style={{ color: 'var(--text-dim)' }}>Uptime</span>
              </div>
              <div className="flex flex-col items-center py-1">
                <Wifi className="w-3 h-3 mb-1" style={{ color: data.signal_quality > 70 ? 'var(--status-nominal)' : 'var(--status-warning)' }} />
                <span className="text-[9px] font-mono" style={{ color: 'var(--text-primary)' }}>{data.signal_quality.toFixed(0)}%</span>
                <span className="text-[7px] uppercase" style={{ color: 'var(--text-dim)' }}>Signal</span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'maintenance' && (
          <MaintenancePanel predictions={predictions} recommendations={recommendations} isPowered={isPowered} />
        )}

        {activeTab === 'spectral' && (
          <SpectralPanel data={data} history={history} isPowered={isPowered} />
        )}

        {/* Dev Tools (always visible at bottom) */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)' }}
        >
          <button
            onClick={() => setDevToolsOpen(!devToolsOpen)}
            className="w-full px-4 py-2 flex items-center justify-between text-left"
          >
            <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
              Dev Tools
            </span>
            {devToolsOpen ? <ChevronUp className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />}
          </button>
          {devToolsOpen && (
            <div className="px-4 pb-3 space-y-2 pt-2" style={{ borderTop: '1px solid var(--surface-border)' }}>
              <Toggle checked={simulated} onChange={setSimulated} label="Local Simulation" />
              {simulated && (
                <>
                  <Toggle checked={forceFault} onChange={setForceFault} label="Trigger Critical Fault" accent="var(--status-critical)" />
                  <Toggle checked={variableRpm} onChange={setVariableRpm} label="Variable Machine RPM" accent="var(--status-warning)" />
                  <Toggle checked={tamperedPod} onChange={setTamperedPod} label="Trigger Tamper Event" accent="var(--status-critical)" />
                  <Toggle checked={multiPodMesh} onChange={setMultiPodMesh} label="Simulate Multi-Pod Mesh" accent="var(--status-watch)" />
                </>
              )}
            </div>
          )}
        </div>

        {/* Remove */}
        <button
          onClick={onRemoveDevice}
          className="w-full py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 hover:opacity-80"
          style={{ background: 'var(--critical-bg)', border: '1px solid var(--critical-border)', color: 'var(--status-critical)', borderRadius: 'var(--radius-md)' }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove Pod
        </button>
      </div>
    </div>
  );
};
