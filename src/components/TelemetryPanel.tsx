import React from 'react';
import { EStopBanner } from './EStopBanner';
import { TelemetryData } from '../hooks/useMqttTelemetry';
import { Activity, Thermometer, Volume2, Wifi, WifiOff } from 'lucide-react';
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
}

const MetricCard = ({ title, value, unit, icon, critical }: { title: string, value: string | number, unit: string, icon: React.ReactNode, critical?: boolean }) => (
  <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
    critical 
      ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
      : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
  }`}>
    {critical && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-400" />}
    <div className="flex items-center justify-between mb-3 text-slate-400">
      <span className="text-xs font-bold tracking-widest uppercase">{title}</span>
      <div className={critical ? 'text-red-400 animate-pulse' : 'text-slate-500'}>
        {icon}
      </div>
    </div>
    <div className="flex items-baseline space-x-1.5">
      <span className={`text-4xl font-black tracking-tight ${critical ? 'text-red-400' : 'text-slate-100'}`}>{value}</span>
      <span className="text-slate-500 font-medium text-sm">{unit}</span>
    </div>
  </div>
);

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  data,
  status,
  simulated,
  setSimulated,
  forceFault,
  setForceFault,
  activeModelId,
  onSelectModel,
  isPowered,
  onTogglePower
}) => {
  const getDiagnostics = () => {
    if (!isPowered) return "System Offline - Power Cut";
    if (data.anomaly_score < 50) return "All Systems Nominal";
    const faults = [];
    if (data.temp >= 75) faults.push("Motor Overheating");
    if (data.sound >= 85) faults.push("Gear Wear Detected");
    if (data.vibration >= 5) faults.push("Bearing Imbalance");
    if (faults.length === 0 && data.anomaly_score >= 80) return "Unknown Critical Anomaly";
    return faults.length > 0 ? faults.join(" • ") : "Minor Irregularities Detected";
  };

  const diagnosticsMsg = getDiagnostics();
  const isCritical = data.anomaly_score >= 80;

  return (
    <div className="h-full w-full p-6 flex flex-col space-y-6 overflow-y-auto custom-scrollbar border-l border-slate-800/80 bg-slate-900/90 backdrop-blur-xl relative z-10">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Telemetry Data</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Live Feed</p>
        </div>
        <button 
          onClick={onTogglePower}
          className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
            isPowered 
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30' 
              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
          }`}
        >
          {isPowered ? 'CUT POWER' : 'POWER ON'}
        </button>
      </div>

      <ModelSelector activeModelId={activeModelId} onSelectModel={onSelectModel} />

      {/* Diagnostics Panel */}
      <div className={`p-4 rounded-xl border ${
        !isPowered ? 'bg-slate-800/50 border-slate-700 text-slate-400' :
        isCritical ? 'bg-red-950/40 border-red-500/50 text-red-400' : 
        data.anomaly_score >= 50 ? 'bg-yellow-950/40 border-yellow-500/50 text-yellow-400' : 
        'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
      }`}>
        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">System Diagnostics</h3>
        <p className="text-sm font-medium">{diagnosticsMsg}</p>
      </div>

      <EStopBanner anomalyScore={data.anomaly_score} />

      <div className="grid grid-cols-2 gap-4">
        <MetricCard 
          title="Temp" 
          value={data.temp.toFixed(1)} 
          unit="°C" 
          icon={<Thermometer className="w-5 h-5" />} 
          critical={data.temp >= 75} 
        />
        <MetricCard 
          title="Sound" 
          value={data.sound.toFixed(1)} 
          unit="dB" 
          icon={<Volume2 className="w-5 h-5" />} 
          critical={data.sound >= 85} 
        />
        <MetricCard 
          title="Vibration" 
          value={data.vibration.toFixed(2)} 
          unit="mm/s" 
          icon={<Activity className="w-5 h-5" />} 
          critical={data.vibration >= 5} 
        />
        <MetricCard 
          title="Anomaly" 
          value={data.anomaly_score.toFixed(0)} 
          unit="%" 
          icon={<Activity className="w-5 h-5" />} 
          critical={data.anomaly_score >= 80} 
        />
      </div>

      {/* Dev Controls */}
      <div className="mt-auto pt-4 pb-12 border-t border-slate-800">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Dev Controls</h3>
        <div className="flex flex-col space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={simulated} 
              onChange={e => setSimulated(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900" 
            />
            <span className="text-slate-300">Enable Local Simulation</span>
          </label>
          
          {simulated && (
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={forceFault} 
                onChange={e => setForceFault(e.target.checked)}
                className="w-5 h-5 rounded border-red-600 bg-slate-700 text-red-500 focus:ring-red-500 focus:ring-offset-slate-900" 
              />
              <span className="text-slate-300">Trigger Critical Fault</span>
            </label>
          )}
        </div>
      </div>
      
    </div>
  );
};
