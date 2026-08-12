'use client';

import React from 'react';
import { Wifi, WifiOff, Server, Terminal, Radio, RefreshCw } from 'lucide-react';

interface StatusBarProps {
  status: 'Connecting' | 'Connected' | 'Disconnected';
  lastUpdated: Date | null;
  deviceCount?: number;
  onlineCount?: number;
  reconnectAttempts?: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ status, lastUpdated, deviceCount = 0, onlineCount = 0, reconnectAttempts = 0 }) => {
  const statusColor = status === 'Connected' ? 'var(--status-nominal)' : status === 'Connecting' ? 'var(--status-warning)' : 'var(--status-critical)';
  const statusBg = status === 'Connected' ? 'var(--nominal-bg)' : status === 'Connecting' ? 'var(--warning-bg)' : 'var(--critical-bg)';

  return (
    <footer
      className="w-full h-9 flex-shrink-0 flex items-center justify-between px-4 text-[11px] font-mono z-20 select-none"
      style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}
    >
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded"
          style={{ background: statusBg }}
        >
          {status === 'Connected' ? (
            <Wifi className="w-3 h-3" style={{ color: statusColor }} />
          ) : status === 'Connecting' ? (
            <RefreshCw className="w-3 h-3 animate-spin-slow" style={{ color: statusColor }} />
          ) : (
            <WifiOff className="w-3 h-3" style={{ color: statusColor }} />
          )}
          <span className="font-semibold" style={{ color: statusColor }}>
            {status === 'Connected' ? 'CONNECTED' : status === 'Connecting' ? 'CONNECTING…' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Broker */}
        <div className="flex items-center gap-1.5 opacity-70">
          <Server className="w-3 h-3" style={{ color: 'var(--text-dim)' }} />
          <span>broker.hivemq.com:8884</span>
        </div>

        {/* Fleet Status */}
        <div className="flex items-center gap-1.5 opacity-70">
          <Radio className="w-3 h-3" style={{ color: 'var(--accent)' }} />
          <span>{onlineCount}/{deviceCount} nodes online</span>
        </div>

        {/* Reconnect Attempts */}
        {reconnectAttempts > 0 && status !== 'Connected' && (
          <div className="flex items-center gap-1.5" style={{ color: 'var(--status-warning)' }}>
            <RefreshCw className="w-3 h-3" />
            <span>Retry #{reconnectAttempts}</span>
          </div>
        )}
      </div>

      {/* Last Packet */}
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded"
        style={{ background: 'var(--surface-2)' }}
      >
        <Terminal className="w-3 h-3" style={{ color: 'var(--text-dim)' }} />
        <span>LAST PACKET: {lastUpdated ? lastUpdated.toLocaleTimeString('en-US', { hour12: false }) : 'AWAITING…'}</span>
      </div>
    </footer>
  );
};
