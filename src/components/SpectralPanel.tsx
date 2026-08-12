'use client';

import React from 'react';
import { TelemetryData } from '../hooks/useMqttTelemetry';
import { Radio, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SpectralPanelProps {
  data: TelemetryData | undefined;
  history: TelemetryData[];
  isPowered: boolean;
}

// Known fault frequency labels (simplified for demo)
const FAULT_SIGNATURES: { binRange: [number, number]; label: string; type: 'normal' | 'fault' }[] = [
  { binRange: [0, 2], label: '1× Shaft RPM (Normal)', type: 'normal' },
  { binRange: [3, 5], label: 'Bearing Defect Frequency', type: 'fault' },
  { binRange: [6, 8], label: '2× RPM (Misalignment)', type: 'fault' },
  { binRange: [9, 11], label: 'Gear Mesh Frequency', type: 'fault' },
  { binRange: [12, 15], label: 'High-Freq Noise Floor', type: 'normal' },
];

function getFrequencyLabel(binIndex: number): string {
  return `${((binIndex + 1) * 62.5).toFixed(0)} Hz`;
}

function detectFaultSignature(bins: number[]): { label: string; type: 'normal' | 'fault' } | null {
  if (bins.length < 16) return null;
  const maxBin = bins.indexOf(Math.max(...bins));
  for (const sig of FAULT_SIGNATURES) {
    if (maxBin >= sig.binRange[0] && maxBin <= sig.binRange[1]) {
      return sig;
    }
  }
  return null;
}

export const SpectralPanel: React.FC<SpectralPanelProps> = ({ data, history, isPowered }) => {
  if (!data || !isPowered) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Radio className="w-10 h-10" style={{ color: 'var(--text-dim)', opacity: 0.3 }} />
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {!isPowered ? 'Machine offline — no spectral data' : 'Awaiting FFT data from pod…'}
        </p>
      </div>
    );
  }

  const bins = data.fft_bins || [];
  const maxBin = Math.max(...bins, 1);
  const signature = detectFaultSignature(bins);
  const isFaultDetected = signature?.type === 'fault';

  // Get previous FFT for comparison overlay
  const prevBins = history.length >= 2 ? history[history.length - 2]?.fft_bins : null;

  const chartHeight = 140;
  const chartWidth = 280;
  const barWidth = chartWidth / 16 - 2;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* FFT Bar Chart */}
      <div
        className="p-4 rounded-lg"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <h3 className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
              FFT Spectral Analysis
            </h3>
          </div>
          <span className="text-[9px] font-mono" style={{ color: 'var(--text-dim)' }}>
            16 bins · 62.5 Hz/bin
          </span>
        </div>

        {/* Bar chart */}
        <div className="flex items-end justify-between gap-[2px]" style={{ height: chartHeight }}>
          {bins.map((amplitude, i) => {
            const height = (amplitude / maxBin) * (chartHeight - 20);
            const prevHeight = prevBins ? (prevBins[i] / maxBin) * (chartHeight - 20) : 0;
            const isDominant = amplitude === Math.max(...bins);

            // Color: highlight fault frequency bands
            let barColor = 'var(--accent)';
            for (const sig of FAULT_SIGNATURES) {
              if (i >= sig.binRange[0] && i <= sig.binRange[1]) {
                barColor = sig.type === 'fault' && amplitude > maxBin * 0.4
                  ? 'var(--status-critical)'
                  : sig.type === 'fault'
                    ? 'var(--status-warning)'
                    : 'var(--accent)';
              }
            }

            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1" style={{ height: '100%', justifyContent: 'flex-end' }}>
                <div className="relative w-full flex items-end justify-center" style={{ height: chartHeight - 20 }}>
                  {/* Previous reading ghost bar */}
                  {prevBins && prevHeight > 0 && (
                    <div
                      className="absolute bottom-0 w-full rounded-t opacity-20"
                      style={{ height: Math.max(prevHeight, 1), background: barColor }}
                    />
                  )}
                  {/* Current bar */}
                  <div
                    className="relative w-full rounded-t transition-all duration-500 ease-out"
                    style={{
                      height: Math.max(height, 2),
                      background: barColor,
                      opacity: isDominant ? 1 : 0.7,
                      boxShadow: isDominant ? `0 0 8px ${barColor}` : 'none',
                    }}
                  >
                    {isDominant && (
                      <div
                        className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] font-bold font-mono whitespace-nowrap"
                        style={{ color: barColor }}
                      >
                        ▼ {amplitude.toFixed(0)}
                      </div>
                    )}
                  </div>
                </div>
                {/* Bin label (show every 4th) */}
                {i % 4 === 0 && (
                  <span className="text-[7px] font-mono" style={{ color: 'var(--text-dim)' }}>
                    {getFrequencyLabel(i)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dominant Frequency Card */}
      <div
        className="p-3 rounded-lg flex items-center justify-between"
        style={{
          background: isFaultDetected ? 'var(--critical-bg)' : 'var(--nominal-bg)',
          border: `1px solid ${isFaultDetected ? 'var(--critical-border)' : 'var(--nominal-border)'}`,
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div className="flex items-center gap-2">
          {isFaultDetected ? (
            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--status-critical)' }} />
          ) : (
            <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--status-nominal)' }} />
          )}
          <div>
            <p className="text-xs font-semibold" style={{ color: isFaultDetected ? 'var(--status-critical)' : 'var(--status-nominal)' }}>
              {signature?.label || 'Normal Spectral Pattern'}
            </p>
            <p className="text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>
              Dominant: {data.fft_dominant_freq.toFixed(0)} Hz · Peak: {data.fft_peak_amplitude.toFixed(1)}
            </p>
          </div>
        </div>
        <span
          className="text-[8px] font-bold px-2 py-1 rounded"
          style={{
            background: isFaultDetected ? 'var(--status-critical)' : 'var(--status-nominal)',
            color: '#fff',
          }}
        >
          {isFaultDetected ? 'FAULT' : 'NORMAL'}
        </span>
      </div>

      {/* Frequency Band Legend */}
      <div
        className="p-3 rounded-lg"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)' }}
      >
        <h4 className="text-[9px] font-semibold uppercase mb-2" style={{ color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
          Frequency Band Reference
        </h4>
        <div className="space-y-1.5">
          {FAULT_SIGNATURES.map((sig, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ background: sig.type === 'fault' ? 'var(--status-warning)' : 'var(--accent)' }}
              />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Bins {sig.binRange[0]}–{sig.binRange[1]}: {sig.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
