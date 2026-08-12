'use client';

import React, { useState } from 'react';
import { DigitalTwinCanvas } from '../components/DigitalTwinCanvas';
import { TelemetryPanel } from '../components/TelemetryPanel';
import { useMqttTelemetry } from '../hooks/useMqttTelemetry';
import { availableModels } from '../components/ModelSelector';
import { TopBar } from '../components/TopBar';
import { StatusBar } from '../components/StatusBar';
import { DeviceSidebar } from '../components/DeviceSidebar';

export default function Dashboard() {
  const { deviceData, status, simulated, setSimulated, forceFault, setForceFault, lastUpdated } = useMqttTelemetry();
  
  // State for which device is selected in the sidebar
  const [activeDeviceId, setActiveDeviceId] = useState<string>('device-1');
  
  // State for which 3D model is active for the current device view
  const [activeModelId, setActiveModelId] = useState<string>(availableModels[0].id);
  const [activeCustomUrl, setActiveCustomUrl] = useState<string>('');
  
  const handleModelSelect = (id: string, url?: string) => {
    setActiveModelId(id);
    if (url) {
      setActiveCustomUrl(url);
    }
  };

  const activeModelUrl = activeModelId === 'custom-upload' 
    ? activeCustomUrl 
    : (availableModels.find(m => m.id === activeModelId)?.url || availableModels[0].url);

  // Get the telemetry data for the currently selected device
  const activeDeviceTelemetry = deviceData[activeDeviceId] || {
    temp: 0, sound: 0, vibration: 0, anomaly_score: 0
  };

  return (
    <main className="flex flex-col w-screen h-screen bg-gray-950 text-slate-100 overflow-hidden">
      
      {/* 1. Top Navigation Bar */}
      <TopBar />

      <div className="flex flex-1 w-full h-full overflow-hidden relative">
        
        {/* 2. Left Sidebar (Device List) */}
        <DeviceSidebar 
          deviceData={deviceData} 
          activeDeviceId={activeDeviceId} 
          onSelectDevice={setActiveDeviceId} 
        />

        {/* 3. Main 3D Canvas (Center) */}
        <section className="flex-1 w-full h-full relative z-0">
          <DigitalTwinCanvas anomalyScore={activeDeviceTelemetry.anomaly_score} modelUrl={activeModelUrl} />
        </section>

        {/* 4. Telemetry Dashboard (Right Sidebar) */}
        <section className="w-[350px] min-w-[350px] h-full z-10 shadow-2xl bg-slate-900/50 flex-shrink-0">
          <TelemetryPanel 
            data={activeDeviceTelemetry} 
            status={status} 
            simulated={simulated}
            setSimulated={setSimulated}
            forceFault={forceFault === activeDeviceId}
            setForceFault={(val) => setForceFault(val ? activeDeviceId : null)}
            activeModelId={activeModelId}
            onSelectModel={handleModelSelect}
          />
        </section>
        
      </div>

      {/* 5. Bottom Status Bar */}
      <StatusBar status={status} lastUpdated={lastUpdated} />

    </main>
  );
}
