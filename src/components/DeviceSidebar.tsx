import React from 'react';
import { Server, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DeviceTelemetryMap } from '../hooks/useMqttTelemetry';

interface DeviceSidebarProps {
  deviceData: DeviceTelemetryMap;
  activeDeviceId: string;
  onSelectDevice: (id: string) => void;
}

export const DeviceSidebar: React.FC<DeviceSidebarProps> = ({ deviceData, activeDeviceId, onSelectDevice }) => {
  return (
    <div className="w-[250px] h-full bg-slate-900/80 border-r border-slate-800 flex flex-col p-4 overflow-y-auto">
      <h2 className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-4">Connected Nodes</h2>
      
      <div className="flex flex-col space-y-2">
        {Object.keys(deviceData).map((deviceId) => {
          const isCritical = deviceData[deviceId].anomaly_score >= 80;
          const isActive = activeDeviceId === deviceId;
          
          return (
            <button
              key={deviceId}
              onClick={() => onSelectDevice(deviceId)}
              className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                isActive 
                  ? 'bg-blue-600/20 border-blue-500' 
                  : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Server className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className={`font-medium ${isActive ? 'text-blue-100' : 'text-slate-300'}`}>
                  {deviceId}
                </span>
              </div>
              
              {isCritical ? (
                <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
