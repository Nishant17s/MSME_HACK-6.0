'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, ShieldCheck, ShieldAlert } from 'lucide-react';

interface EStopBannerProps {
  anomalyScore: number;
  isPowered: boolean;
}

type Tier = 'nominal' | 'watch' | 'warning' | 'critical' | 'offline';

function getTier(score: number, isPowered: boolean): Tier {
  if (!isPowered) return 'offline';
  if (score >= 80) return 'critical';
  if (score >= 55) return 'warning';
  if (score >= 35) return 'watch';
  return 'nominal';
}

const tierConfig: Record<Tier, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  nominal: {
    label: 'All Systems Nominal',
    color: 'var(--status-nominal)',
    bg: 'var(--nominal-bg)',
    border: 'var(--nominal-border)',
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  watch: {
    label: 'Monitoring — Minor Irregularity',
    color: 'var(--status-watch)',
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.25)',
    icon: <Eye className="w-5 h-5" />,
  },
  warning: {
    label: 'Warning — Anomaly Detected',
    color: 'var(--status-warning)',
    bg: 'var(--warning-bg)',
    border: 'var(--warning-border)',
    icon: <ShieldAlert className="w-5 h-5" />,
  },
  critical: {
    label: 'CRITICAL FAULT — E-STOP ACTIVE',
    color: 'var(--status-critical)',
    bg: 'var(--critical-bg)',
    border: 'var(--critical-border)',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  offline: {
    label: 'System Offline — Power Disconnected',
    color: 'var(--status-offline)',
    bg: 'rgba(107, 114, 128, 0.08)',
    border: 'rgba(107, 114, 128, 0.25)',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
};

export const EStopBanner: React.FC<EStopBannerProps> = ({ anomalyScore, isPowered }) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const tier = getTier(anomalyScore, isPowered);
  const config = tierConfig[tier];

  // Reset acknowledged state when tier changes
  React.useEffect(() => {
    setAcknowledged(false);
  }, [tier]);

  const showPulse = (tier === 'critical' || tier === 'warning') && !acknowledged;

  return (
    <div
      className={`w-full px-4 py-3 flex items-center justify-between transition-all duration-500 ${showPulse && tier === 'critical' ? 'animate-pulse-glow' : ''} ${showPulse && tier === 'warning' ? 'animate-pulse-glow-amber' : ''}`}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 'var(--radius-lg)',
        color: config.color,
      }}
    >
      <div className="flex items-center gap-3">
        {config.icon}
        <div>
          <h3 className="text-sm font-semibold tracking-wide">{config.label}</h3>
          <p className="text-[10px] font-mono opacity-70 mt-0.5">
            Score: {anomalyScore.toFixed(0)}% · Tier: {tier.toUpperCase()}
          </p>
        </div>
      </div>

      {(tier === 'critical' || tier === 'warning') && !acknowledged && (
        <button
          onClick={() => setAcknowledged(true)}
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 hover:opacity-80"
          style={{
            background: config.color,
            color: '#fff',
          }}
        >
          ACKNOWLEDGE
        </button>
      )}

      {acknowledged && (
        <span className="text-[10px] font-mono opacity-60">ACKNOWLEDGED</span>
      )}
    </div>
  );
};
