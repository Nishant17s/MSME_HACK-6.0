import React from 'react';
import { Activity, Clock } from 'lucide-react';

export const TopBar: React.FC = () => {
  return (
    <header className="w-full h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20">
      <div className="flex items-center space-x-3">
        <Activity className="w-6 h-6 text-emerald-400" />
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          IoT Edge Fleet Monitor
        </h1>
      </div>
      <div className="flex items-center space-x-2 text-slate-400 text-sm font-mono">
        <Clock className="w-4 h-4" />
        <span>{new Date().toLocaleTimeString()}</span>
      </div>
    </header>
  );
};
