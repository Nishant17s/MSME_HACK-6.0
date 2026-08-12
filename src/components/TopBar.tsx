'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';

export const TopBar: React.FC = () => {
  const [time, setTime] = useState<string>('--:--:--');

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full h-16 bg-slate-900/60 backdrop-blur-lg border-b border-slate-800/80 flex items-center justify-between px-8 z-20 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <Activity className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-wide">
            IoT Edge Fleet Monitor
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Central Command Station</p>
        </div>
      </div>
      <div className="flex items-center space-x-3 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50 text-slate-300 text-sm font-mono shadow-inner">
        <Clock className="w-4 h-4 text-blue-400" />
        <span>{time}</span>
      </div>
    </header>
  );
};
