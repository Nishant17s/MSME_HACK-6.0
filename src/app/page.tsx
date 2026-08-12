'use client';

import React, { useState } from 'react';
import { DigitalTwinCanvas } from '../components/DigitalTwinCanvas';
import { TelemetryPanel } from '../components/TelemetryPanel';
import { useMqttTelemetry } from '../hooks/useMqttTelemetry';
import { availableModels } from '../components/ModelSelector';

export default function Dashboard() {
  const { data, status, simulated, setSimulated, forceFault, setForceFault } = useMqttTelemetry();
  const [activeModelId, setActiveModelId] = useState<string>(availableModels[0].id);
  
  const activeModelUrl = availableModels.find(m => m.id === activeModelId)?.url || availableModels[0].url;

  return (
    <main className="flex flex-col md:flex-row w-screen h-screen bg-gray-950 text-slate-100 overflow-hidden">
      {/* 3D Canvas Section (Left 2/3) */}
      <section className="w-full md:w-2/3 h-[50vh] md:h-full relative">
        <DigitalTwinCanvas anomalyScore={data.anomaly_score} modelUrl={activeModelUrl} />
      </section>

      {/* Telemetry Dashboard (Right 1/3) */}
      <section className="w-full md:w-1/3 h-[50vh] md:h-full z-10 shadow-2xl">
        <TelemetryPanel 
          data={data} 
          status={status} 
          simulated={simulated}
          setSimulated={setSimulated}
          forceFault={forceFault}
          setForceFault={setForceFault}
          activeModelId={activeModelId}
          onSelectModel={setActiveModelId}
        />
      </section>
    </main>
  );
}
