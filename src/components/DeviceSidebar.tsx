'use client';

import React, { useState } from 'react';
import { Server, AlertCircle, CheckCircle2, ChevronRight, Edit2, Check } from 'lucide-react';
import { DeviceTelemetryMap } from '../hooks/useMqttTelemetry';

interface DeviceSidebarProps {
  deviceData: DeviceTelemetryMap;
  deviceNames: Record<string, string>;
  setDeviceName: (id: string, name: string) => void;
  powerStates: Record<string, boolean>;
  activeDeviceId: string;
  onSelectDevice: (id: string) => void;
}

export const DeviceSidebar: React.FC<DeviceSidebarProps> = ({ deviceData, deviceNames, setDeviceName, powerStates, activeDeviceId, onSelectDevice }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(deviceNames[id] || id.toUpperCase());
  };

  const handleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (editValue.trim()) {
      setDeviceName(id, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className="w-[280px] min-w-[280px] h-full bg-slate-900/95 backdrop-blur-md border-r border-slate-800/80 flex flex-col shadow-2xl relative z-10 flex-shrink-0">
      <div className="p-5 border-b border-slate-800/50 bg-slate-900/40">
        <h2 className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase">Connected Nodes</h2>
        <p className="text-xs text-slate-500 mt-1">Select a device to monitor telemetry</p>
      </div>
      
      <div className="flex flex-col p-3 space-y-2 overflow-y-auto custom-scrollbar">
        {Object.keys(deviceData).map((deviceId) => {
          const isCritical = deviceData[deviceId].anomaly_score >= 80;
          const isActive = activeDeviceId === deviceId;
          const isPowered = powerStates[deviceId] ?? true;
          
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
                  {editingId === deviceId ? (
                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="text" 
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave(deviceId)}
                        onBlur={() => handleSave(deviceId)}
                        className="bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-sm font-semibold text-white w-24 outline-none focus:border-blue-500"
                      />
                      <button onClick={(e) => handleSave(deviceId, e)} className="p-1 hover:bg-slate-700 rounded text-emerald-400">
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className={`font-semibold text-sm ${isActive ? 'text-blue-100' : 'text-slate-300 group-hover:text-white'}`}>
                        {deviceNames[deviceId] || deviceId.toUpperCase()}
                      </span>
                      {/* Power Status Dot */}
                      <span className={`w-2 h-2 rounded-full ${isPowered ? 'bg-emerald-500' : 'bg-slate-500'}`} title={isPowered ? 'Powered ON' : 'Powered OFF'}></span>
                      
                      <button onClick={(e) => handleEdit(deviceId, e)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-blue-400 transition-opacity">
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {!isPowered ? 'SYSTEM OFF' : (isCritical ? 'CRITICAL STATE' : 'ONLINE')}
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
