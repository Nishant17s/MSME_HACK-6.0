import React from 'react';
import { EStopBanner } from './EStopBanner';
import { TelemetryData } from '../hooks/useMqttTelemetry';
import { Activity, Thermometer, Volume2, Wifi, WifiOff } from 'lucide-react';

interface TelemetryPanelProps {
  data: TelemetryData;
  status: 'Connecting' | 'Connected' | 'Disconnected';
  simulated: boolean;
  setSimulated: (val: boolean) => void;
  forceFault: boolean;
  setForceFault: (val: boolean) => void;
}

const MetricCard = ({ title, value, unit, icon, critical }: { title: string, value: string | number, unit: string, icon: React.ReactNode, critical?: boolean }) => (
  <div className={`p-4 rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-md flex flex-col space-y-2 ${critical ? 'ring-2 ring-red-500 bg-red-900/20' : ''}`}>
    <div className="flex justify-between items-center text-slate-400">
      <span className="text-sm font-semibold uppercase tracking-wider">{title}</span>
      {icon}
    </div>
    <div className="flex items-baseline space-x-1">
      <span className={`text-3xl font-bold ${critical ? 'text-red-400' : 'text-slate-100'}`}>{value}</span>
      <span className="text-slate-500 font-medium">{unit}</span>
    </div>
  </div>
);

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  data,
  status,
  simulated,
  setSimulated,
  forceFault,
  setForceFault
}) => {
  return (
    <div className="h-full w-full p-6 flex flex-col space-y-6 overflow-y-auto custom-scrollbar border-l border-slate-800">
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          IoT Edge Pod
        </h1>
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
          {status === 'Connected' ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
          <span className="text-xs font-medium text-slate-300">{status}</span>
        </div>
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

      <div className="mt-8 pt-6 border-t border-slate-800">
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Dev Controls</h3>
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
