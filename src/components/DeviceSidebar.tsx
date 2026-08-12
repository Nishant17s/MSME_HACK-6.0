'use client';

import React from 'react';
import { Server, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { DeviceTelemetryMap } from '../hooks/useMqttTelemetry';

interface DeviceSidebarProps {
  deviceData: DeviceTelemetryMap;
  activeDeviceId: string;
  onSelectDevice: (id: string) => void;
}

export const DeviceSidebar: React.FC<DeviceSidebarProps> = ({ deviceData, activeDeviceId, onSelectDevice }) => {
  return (
    <aside className="w-[280px] h-full bg-slate-900/95 backdrop-blur-md border-r border-slate-800/80 flex flex-col shadow-2xl relative z-10">
      <div className="p-5 border-b border-slate-800/50 bg-slate-900/40">
        <h2 className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase">Connected Nodes</h2>
        <p className="text-xs text-slate-500 mt-1">Select a device to monitor telemetry</p>
      </div>
      
      <div className="flex flex-col p-3 space-y-2 overflow-y-auto custom-scrollbar">
        {Object.keys(deviceData).map((deviceId) => {
          const isCritical = deviceData[deviceId].anomaly_score >= 80;
          const isActive = activeDeviceId === deviceId;
          
          return (
            <button
              key={deviceId}
              onClick={() => onSelectDevice(deviceId)}
              className={`p-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between group ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600/20 to-emerald-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                  : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500/20' : 'bg-slate-800'} transition-colors`}>
                  <Server className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                </div>
                <div className="flex flex-col">
                  <span className={`font-semibold text-sm ${isActive ? 'text-blue-100' : 'text-slate-300 group-hover:text-white'}`}>
                    {deviceId.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {isCritical ? 'CRITICAL STATE' : 'ONLINE'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isCritical ? (
                  <AlertCircle className="w-5 h-5 text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500/50" />
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-blue-500/50" />}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
