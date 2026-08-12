'use client';

import React from 'react';
import { ComponentPrediction, MaintenanceRecommendation, MaintenanceUrgency } from '../hooks/usePredictiveEngine';
import { AlertTriangle, Clock, TrendingDown, TrendingUp, Minus, Wrench, CheckCircle2, ShieldAlert } from 'lucide-react';

interface MaintenancePanelProps {
  predictions: ComponentPrediction[];
  recommendations: MaintenanceRecommendation[];
  isPowered: boolean;
}

const urgencyConfig: Record<MaintenanceUrgency, { label: string; color: string; bg: string; border: string }> = {
  replace_now: { label: 'REPLACE NOW', color: 'var(--status-critical)', bg: 'var(--critical-bg)', border: 'var(--critical-border)' },
  schedule_soon: { label: 'SCHEDULE', color: 'var(--status-warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)' },
  monitor: { label: 'MONITOR', color: 'var(--status-watch)', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
  healthy: { label: 'HEALTHY', color: 'var(--status-nominal)', bg: 'var(--nominal-bg)', border: 'var(--nominal-border)' },
};

function getHealthColor(health: number): string {
  if (health <= 20) return 'var(--status-critical)';
  if (health <= 45) return 'var(--status-warning)';
  if (health <= 70) return 'var(--status-watch)';
  return 'var(--status-nominal)';
}

const TrendIcon: React.FC<{ trend: 'improving' | 'stable' | 'degrading' }> = ({ trend }) => {
  if (trend === 'degrading') return <TrendingDown className="w-3 h-3" style={{ color: 'var(--status-critical)' }} />;
  if (trend === 'improving') return <TrendingUp className="w-3 h-3" style={{ color: 'var(--status-nominal)' }} />;
  return <Minus className="w-3 h-3" style={{ color: 'var(--text-dim)' }} />;
};

export const MaintenancePanel: React.FC<MaintenancePanelProps> = ({
  predictions, recommendations, isPowered
}) => {
  if (!isPowered) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <ShieldAlert className="w-10 h-10" style={{ color: 'var(--text-dim)', opacity: 0.3 }} />
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Machine offline — predictions paused</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Component Health Bars */}
      <div
        className="p-4 rounded-lg space-y-3"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)' }}
      >
        <h3 className="text-[10px] font-semibold uppercase mb-3" style={{ color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
          Component Health
        </h3>

        {predictions.map(pred => {
          const color = getHealthColor(pred.health);
          const config = urgencyConfig[pred.urgency];

          return (
            <div key={pred.component} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {pred.label}
                  </span>
                  <TrendIcon trend={pred.trend} />
                </div>
                <div className="flex items-center gap-2">
                  {pred.remainingHours !== null && (
                    <span className="text-[9px] font-mono flex items-center gap-0.5" style={{ color: 'var(--text-dim)' }}>
                      <Clock className="w-2.5 h-2.5" />
                      ~{pred.remainingHours}h
                    </span>
                  )}
                  <span className="text-[10px] font-bold font-mono" style={{ color }}>{pred.health.toFixed(0)}%</span>
                </div>
              </div>

              {/* Health bar */}
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-4)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pred.health}%`,
                    background: color,
                    boxShadow: pred.health <= 30 ? `0 0 6px ${color}` : 'none',
                  }}
                />
              </div>

              {/* Urgency badge */}
              {pred.urgency !== 'healthy' && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
                  >
                    {config.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      <div
        className="p-4 rounded-lg space-y-3"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <h3 className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
            Maintenance Recommendations
          </h3>
        </div>

        {recommendations.length === 0 ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--status-nominal)', opacity: 0.5 }} />
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>All components healthy — no action needed</p>
          </div>
        ) : (
          recommendations.map(rec => {
            const config = urgencyConfig[rec.urgency];
            return (
              <div
                key={rec.id}
                className="p-3 rounded-lg animate-slide-in-up"
                style={{
                  background: 'var(--surface-3)',
                  borderLeft: `3px solid ${config.color}`,
                  border: '1px solid var(--surface-border)',
                  borderLeftWidth: '3px',
                  borderLeftColor: config.color,
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" style={{ color: config.color }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {rec.componentLabel}
                    </span>
                  </div>
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: config.bg, color: config.color }}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Action */}
                <p className="text-[11px] leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {rec.action}
                </p>

                {/* Footer: reason + confidence */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono" style={{ color: 'var(--text-dim)' }}>
                    {rec.reason.split('.')[0]}.
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: 'var(--text-dim)' }}>
                    {rec.confidence}% conf.
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
