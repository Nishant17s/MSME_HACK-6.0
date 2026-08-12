import React from 'react';
import { Wifi, WifiOff, Server } from 'lucide-react';

interface StatusBarProps {
  status: 'Connecting' | 'Connected' | 'Disconnected';
  lastUpdated: Date;
}

export const StatusBar: React.FC<StatusBarProps> = ({ status, lastUpdated }) => {
  return (
    <footer className="w-full h-8 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 text-xs font-mono text-slate-400 z-20">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {status === 'Connected' ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-red-500" />}
          <span className={status === 'Connected' ? 'text-emerald-400' : 'text-red-400'}>
            MQTT: {status}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Server className="w-3 h-3 text-blue-400" />
          <span>Broker: wss://broker.hivemq.com:8884/mqtt</span>
        </div>
      </div>
      <div>
        Last Packet: {lastUpdated.toISOString()}
      </div>
    </footer>
  );
};
