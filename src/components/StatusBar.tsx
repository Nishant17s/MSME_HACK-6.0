'use client';

import React from 'react';
import { Wifi, WifiOff, Server, Terminal } from 'lucide-react';

interface StatusBarProps {
  status: 'Connecting' | 'Connected' | 'Disconnected';
  lastUpdated: Date | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({ status, lastUpdated }) => {
  return (
    <footer className="w-full h-10 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-6 text-xs font-mono text-slate-400 z-20">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
          {status === 'Connected' ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-red-500" />}
          <span className={status === 'Connected' ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
            MQTT: {status.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center space-x-2 opacity-80">
          <Server className="w-3 h-3 text-blue-400" />
          <span>broker.hivemq.com:8884</span>
        </div>
      </div>
      <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
        <Terminal className="w-3 h-3 text-slate-500" />
        <span>LAST PACKET: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'AWAITING DATA...'}</span>
      </div>
    </footer>
  );
};
