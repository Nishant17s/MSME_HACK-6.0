'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Bell, Check, CheckCircle2, Flag, Trash2, Filter } from 'lucide-react';
import { Alert, AlertSeverity, AlertStatus } from '../hooks/useAlertManager';

interface AlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
  onMarkFalsePositive: (id: string) => void;
  onAcknowledgeAll: () => void;
  onClearResolved: () => void;
}

const severityColors: Record<AlertSeverity, string> = {
  watch: 'var(--status-watch)',
  warning: 'var(--status-warning)',
  critical: 'var(--status-critical)',
};

const statusLabels: Record<AlertStatus, string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
  false_positive: 'False Positive',
};

type FilterOption = 'all' | 'active' | 'acknowledged' | 'resolved';

export const AlertPanel: React.FC<AlertPanelProps> = ({
  isOpen, onClose, alerts,
  onAcknowledge, onResolve, onDismiss, onMarkFalsePositive,
  onAcknowledgeAll, onClearResolved
}) => {
  const [filter, setFilter] = useState<FilterOption>('all');

  if (!isOpen) return null;

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(a => a.status === filter);

  const activeCount = alerts.filter(a => a.status === 'active').length;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      className="fixed top-0 right-0 h-full w-[380px] z-40 flex flex-col animate-slide-in-right"
      style={{
        background: 'var(--surface-1)',
        borderLeft: '1px solid var(--surface-border)',
        boxShadow: '-8px 0 30px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--surface-border)' }}>
        <div className="flex items-center gap-2.5">
          <Bell className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Alert Center</h2>
          {activeCount > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[10px] font-bold text-white px-1"
              style={{ background: 'var(--status-critical)' }}
            >
              {activeCount}
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--surface-border)' }}>
        <button
          onClick={onAcknowledgeAll}
          disabled={activeCount === 0}
          className="flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-30"
          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--surface-border)' }}
        >
          Ack All
        </button>
        <button
          onClick={onClearResolved}
          className="flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--surface-border)' }}
        >
          Clear Resolved
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 flex gap-1 flex-shrink-0" style={{ borderBottom: '1px solid var(--surface-border)' }}>
        {(['all', 'active', 'acknowledged', 'resolved'] as FilterOption[]).map(opt => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors"
            style={{
              background: filter === opt ? 'var(--accent-soft)' : 'transparent',
              color: filter === opt ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {filteredAlerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--status-nominal)', opacity: 0.4 }} />
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {filter === 'all' ? 'No alerts recorded' : `No ${filter} alerts`}
            </p>
          </div>
        )}

        {filteredAlerts.map(alert => (
          <div
            key={alert.id}
            className="rounded-lg p-3 animate-slide-in-up transition-all duration-200"
            style={{
              background: 'var(--surface-2)',
              borderLeft: `3px solid ${severityColors[alert.severity]}`,
              border: `1px solid var(--surface-border)`,
              borderLeftWidth: '3px',
              borderLeftColor: severityColors[alert.severity],
              opacity: alert.status === 'dismissed' || alert.status === 'false_positive' ? 0.5 : 1,
            }}
          >
            {/* Alert Header */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: severityColors[alert.severity] }} />
                <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {alert.title}
                </span>
              </div>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                style={{
                  background: alert.status === 'active' ? severityColors[alert.severity] : 'var(--surface-3)',
                  color: alert.status === 'active' ? '#fff' : 'var(--text-muted)',
                  opacity: alert.status === 'active' ? 0.9 : 1,
                }}
              >
                {statusLabels[alert.status]}
              </span>
            </div>

            {/* Alert Details */}
            <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
              {alert.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>
                {alert.deviceName} · {formatTime(alert.createdAt)}
              </span>

              {/* Action Buttons */}
              {(alert.status === 'active' || alert.status === 'acknowledged') && (
                <div className="flex items-center gap-1">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      title="Acknowledge"
                      className="p-1 rounded hover:bg-white/5 transition-colors"
                      style={{ color: 'var(--status-watch)' }}
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => onResolve(alert.id)}
                    title="Resolve"
                    className="p-1 rounded hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--status-nominal)' }}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onMarkFalsePositive(alert.id)}
                    title="Mark as False Positive"
                    className="p-1 rounded hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--status-warning)' }}
                  >
                    <Flag className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDismiss(alert.id)}
                    title="Dismiss"
                    className="p-1 rounded hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
