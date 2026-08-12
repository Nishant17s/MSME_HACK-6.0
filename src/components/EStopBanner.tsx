import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface EStopBannerProps {
  anomalyScore: number;
}

export const EStopBanner: React.FC<EStopBannerProps> = ({ anomalyScore }) => {
  const isCritical = anomalyScore >= 80;

  return (
    <div
      className={twMerge(
        'w-full p-4 rounded-xl flex items-center justify-center space-x-3 transition-colors duration-500 shadow-lg',
        isCritical ? 'bg-red-600 animate-pulse text-white' : 'bg-emerald-600 text-white'
      )}
    >
      {isCritical ? (
        <>
          <AlertTriangle className="w-8 h-8 flex-shrink-0" />
          <h2 className="text-xl font-bold tracking-wider">CRITICAL FAULT: E-STOP TRIPPED</h2>
          <AlertTriangle className="w-8 h-8 flex-shrink-0" />
        </>
      ) : (
        <>
          <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
          <h2 className="text-xl font-bold tracking-wider">NORMAL OPERATION</h2>
        </>
      )}
    </div>
  );
};
