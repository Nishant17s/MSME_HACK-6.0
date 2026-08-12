'use client';

import React, { useState } from 'react';
import { Server, AlertCircle, CheckCircle2, ChevronRight, Edit2, Check, Search, ChevronLeft, Wifi, Wrench } from 'lucide-react';
import { DeviceTelemetryMap } from '../hooks/useMqttTelemetry';

interface DeviceSidebarProps {
  deviceData: DeviceTelemetryMap;
  deviceNames: Record<string, string>;
  setDeviceName: (id: string, name: string) => void;
  powerStates: Record<string, boolean>;
  activeDeviceId: string;
  onSelectDevice: (id: string) => void;
  onAddDevice: () => void;
}

// Mini health ring SVG
const HealthRing: React.FC<{ score: number; size?: number }> = ({ score, size = 32 }) => {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = score >= 80 ? 'var(--status-critical)' : score >= 55 ? 'var(--status-warning)' : score >= 35 ? 'var(--status-watch)' : 'var(--status-nominal)';

  return (
    <svg width={size} height={size} className="gauge-ring flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-4)" strokeWidth="3" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circumference} strokeDashoffset={circumference - filled} strokeLinecap="round"
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="9" fontWeight="700" fontFamily="var(--font-mono)"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {score.toFixed(0)}
      </text>
    </svg>
  );
};

// Mini component health bars
const MiniHealthBars: React.FC<{ health: { bearing: number; gear: number; motor: number; belt: number; spindle: number } }> = ({ health }) => {
  const comps = [
    { key: 'bearing', label: 'B' },
    { key: 'gear', label: 'G' },
    { key: 'motor', label: 'M' },
    { key: 'belt', label: 'Bl' },
    { key: 'spindle', label: 'S' },
  ] as const;

  return (
    <div className="flex gap-[2px] mt-1">
      {comps.map(c => {
        const val = health[c.key];
        const color = val <= 20 ? 'var(--status-critical)' : val <= 45 ? 'var(--status-warning)' : val <= 70 ? 'var(--status-watch)' : 'var(--status-nominal)';
        return (
          <div key={c.key} className="flex flex-col items-center" title={`${c.key}: ${val.toFixed(0)}%`}>
            <div className="w-[14px] h-[3px] rounded-full" style={{ background: 'var(--surface-4)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${val}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const DeviceSidebar: React.FC<DeviceSidebarProps> = ({
  deviceData, deviceNames, setDeviceName, powerStates,
  activeDeviceId, onSelectDevice, onAddDevice
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(deviceNames[id] || id);
  };

  const handleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (editValue.trim()) setDeviceName(id, editValue.trim());
    setEditingId(null);
  };

  const deviceIds = Object.keys(deviceData);
  const filteredIds = searchQuery
    ? deviceIds.filter(id => {
        const name = deviceNames[id] || id;
        return name.toLowerCase().includes(searchQuery.toLowerCase()) || id.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : deviceIds;

  const onlineCount = deviceIds.filter(id => powerStates[id] ?? true).length;
  const criticalCount = deviceIds.filter(id => deviceData[id].anomaly_score >= 80 && (powerStates[id] ?? true)).length;

  // Count pods needing maintenance
  const maintenanceCount = deviceIds.filter(id => {
    const d = deviceData[id];
    if (!d.component_health) return false;
    return Object.values(d.component_health).some(v => v <= 45);
  }).length;

  if (collapsed) {
    return (
      <aside
        className="w-14 min-w-14 h-full flex flex-col items-center py-3 gap-2 flex-shrink-0 relative z-10"
        style={{ background: 'var(--surface-1)', borderRight: '1px solid var(--surface-border)' }}
      >
        <button onClick={() => setCollapsed(false)} className="p-2 rounded-lg transition-colors hover:bg-white/5 mb-2" style={{ color: 'var(--text-muted)' }} title="Expand sidebar">
          <ChevronRight className="w-4 h-4" />
        </button>
        {deviceIds.map(deviceId => {
          const isCritical = deviceData[deviceId].anomaly_score >= 80;
          const isActive = activeDeviceId === deviceId;
          const isPowered = powerStates[deviceId] ?? true;
          return (
            <button key={deviceId} onClick={() => onSelectDevice(deviceId)} title={deviceNames[deviceId] || deviceId}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{ background: isActive ? 'var(--accent-soft)' : 'transparent', border: isActive ? '1px solid var(--accent)' : '1px solid transparent' }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: !isPowered ? 'var(--status-offline)' : isCritical ? 'var(--status-critical)' : 'var(--status-nominal)', boxShadow: isCritical ? '0 0 6px var(--status-critical)' : 'none' }} />
            </button>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="w-[260px] min-w-[260px] h-full flex flex-col flex-shrink-0 relative z-10" style={{ background: 'var(--surface-1)', borderRight: '1px solid var(--surface-border)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--surface-border)' }}>
        <div>
          <h2 className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>Connected Pods</h2>
          <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--text-dim)' }}>
            {onlineCount} online{criticalCount > 0 ? ` · ${criticalCount} critical` : ''}{maintenanceCount > 0 ? ` · ${maintenanceCount} service` : ''}
          </p>
        </div>
        <button onClick={() => setCollapsed(true)} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--text-muted)' }} title="Collapse">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--surface-border)' }}>
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-border)' }}>
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-dim)' }} />
          <input type="text" placeholder="Search pods…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs outline-none w-full placeholder:text-[var(--text-dim)]" style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Pod List */}
      <div className="flex flex-col p-2 gap-1 overflow-y-auto custom-scrollbar flex-1">
        {filteredIds.length === 0 && (
          <p className="text-center py-8 text-xs" style={{ color: 'var(--text-dim)' }}>No pods found</p>
        )}

        {filteredIds.map(deviceId => {
          const d = deviceData[deviceId];
          const isCritical = d.anomaly_score >= 80;
          const isWarning = d.anomaly_score >= 55;
          const isActive = activeDeviceId === deviceId;
          const isPowered = powerStates[deviceId] ?? true;
          const needsService = d.component_health && Object.values(d.component_health).some(v => v <= 45);

          return (
            <button key={deviceId} onClick={() => onSelectDevice(deviceId)}
              className="p-3 text-left transition-all duration-200 flex items-center justify-between group animate-slide-in-up"
              style={{
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--accent-soft)' : 'transparent',
                border: isActive ? '1px solid rgba(20, 184, 166, 0.2)' : '1px solid transparent',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <HealthRing score={isPowered ? d.anomaly_score : 0} size={34} />
                <div className="flex flex-col min-w-0">
                  {editingId === deviceId ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input type="text" autoFocus value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSave(deviceId)}
                        onBlur={() => handleSave(deviceId)}
                        className="text-xs font-medium px-1.5 py-0.5 rounded outline-none w-[110px]"
                        style={{ background: 'var(--surface-3)', border: '1px solid var(--accent)', color: 'var(--text-primary)' }}
                      />
                      <div onClick={e => handleSave(deviceId, e)} className="p-0.5 rounded cursor-pointer hover:bg-white/5" style={{ color: 'var(--accent)' }} role="button">
                        <Check className="w-3 h-3" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium truncate max-w-[100px]" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {deviceNames[deviceId] || deviceId}
                      </span>
                      <div onClick={e => handleEdit(deviceId, e)} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" style={{ color: 'var(--text-dim)' }} role="button">
                        <Edit2 className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-mono" style={{
                      color: !isPowered ? 'var(--status-offline)' : isCritical ? 'var(--status-critical)' : isWarning ? 'var(--status-warning)' : 'var(--text-dim)'
                    }}>
                      {!isPowered ? 'OFFLINE' : isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'NOMINAL'}
                    </span>
                    {needsService && isPowered && (
                      <Wrench className="w-2.5 h-2.5" style={{ color: 'var(--status-warning)' }} />
                    )}
                    {isPowered && d.signal_quality !== undefined && (
                      <Wifi className="w-2.5 h-2.5" style={{ color: d.signal_quality > 70 ? 'var(--text-dim)' : 'var(--status-warning)', opacity: 0.6 }} />
                    )}
                  </div>
                  {/* Component mini-bars */}
                  {isPowered && d.component_health && <MiniHealthBars health={d.component_health} />}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isCritical && isPowered && (
                  <AlertCircle className="w-4 h-4 animate-pulse" style={{ color: 'var(--status-critical)', filter: 'drop-shadow(0 0 4px var(--status-critical))' }} />
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--accent)', opacity: 0.5 }} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--surface-border)' }}>
        <p className="text-[9px] text-center" style={{ color: 'var(--text-dim)' }}>
          Pods auto-register via MQTT when powered on
        </p>
        <button onClick={onAddDevice}
          className="w-full py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-200 hover:opacity-80"
          style={{ borderRadius: 'var(--radius-md)', border: '1px dashed var(--surface-border-light)', color: 'var(--text-muted)', background: 'transparent' }}
        >
          <span className="text-sm leading-none">+</span>
          <span>Register Pod Manually</span>
        </button>
      </div>
    </aside>
  );
};
