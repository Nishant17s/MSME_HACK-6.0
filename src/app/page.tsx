'use client';

import React, { useState, useRef } from 'react';
import { DigitalTwinCanvas } from '../components/DigitalTwinCanvas';
import { TelemetryPanel } from '../components/TelemetryPanel';
import { useMqttTelemetry } from '../hooks/useMqttTelemetry';
import { availableModels } from '../components/ModelSelector';
import { TopBar } from '../components/TopBar';
import { StatusBar } from '../components/StatusBar';
import { DeviceSidebar } from '../components/DeviceSidebar';
import { Modal } from '../components/Modal';
import { Upload } from 'lucide-react';

export default function Dashboard() {
  const { 
    deviceData, 
    deviceNames, 
    setDeviceName, 
    powerStates,
    toggleDevicePower,
    addDevice,
    status, 
    simulated, 
    setSimulated, 
    forceFault, 
    setForceFault, 
    lastUpdated 
  } = useMqttTelemetry();
  
  // State for which device is selected in the sidebar
  const [activeDeviceId, setActiveDeviceId] = useState<string>('device-1');
  
  // State for which 3D model is active for each device
  const [deviceModels, setDeviceModels] = useState<Record<string, { id: string, url?: string }>>({});
  
  const handleModelSelect = (id: string, url?: string, name?: string) => {
    setDeviceModels(prev => ({
      ...prev,
      [activeDeviceId]: { id, url }
    }));
    if (name) {
      setDeviceName(activeDeviceId, name);
    }
  };

  // --- Modals State ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Add Device Form State
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceModelId, setNewDeviceModelId] = useState(availableModels[0].id);
  const newDeviceFileInputRef = useRef<HTMLInputElement>(null);
  const [newDeviceFileName, setNewDeviceFileName] = useState('');

  const handleAddDeviceSubmit = () => {
    const newId = addDevice(newDeviceName || 'New Machine');
    const file = newDeviceFileInputRef.current?.files?.[0];
    
    if (newDeviceModelId === 'custom-upload' && file) {
      const url = URL.createObjectURL(file);
      setDeviceModels(prev => ({ ...prev, [newId]: { id: 'custom-upload', url } }));
    } else {
      setDeviceModels(prev => ({ ...prev, [newId]: { id: newDeviceModelId } }));
    }
    
    setActiveDeviceId(newId);
    setShowAddModal(false);
    
    // reset form
    setNewDeviceName('');
    setNewDeviceModelId(availableModels[0].id);
    setNewDeviceFileName('');
  };

  const handleRemoveConfirm = () => {
    removeDevice(activeDeviceId);
    const remainingIds = Object.keys(deviceData).filter(id => id !== activeDeviceId);
    setActiveDeviceId(remainingIds[0] || '');
    setShowDeleteModal(false);
  };

  const currentModelSetting = deviceModels[activeDeviceId] || { id: availableModels[0].id };
  const activeModelId = currentModelSetting.id;

  const activeModelUrl = activeModelId === 'custom-upload' 
    ? currentModelSetting.url || ''
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
          deviceNames={deviceNames}
          setDeviceName={setDeviceName}
          powerStates={powerStates}
          activeDeviceId={activeDeviceId} 
          onSelectDevice={setActiveDeviceId} 
          onAddDevice={() => setShowAddModal(true)}
        />

        {/* 3. Main 3D Canvas (Center) */}
        <section className="flex-1 w-full h-full relative z-0">
          <DigitalTwinCanvas 
            anomalyScore={activeDeviceTelemetry.anomaly_score} 
            modelUrl={activeModelUrl} 
            isPowered={powerStates[activeDeviceId] ?? true} 
          />
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
            isPowered={powerStates[activeDeviceId] ?? true}
            onTogglePower={() => toggleDevicePower(activeDeviceId)}
            onRemoveDevice={() => setShowDeleteModal(true)}
          />
        </section>
        
      </div>

      {/* 5. Bottom Status Bar */}
      <StatusBar status={status} lastUpdated={lastUpdated} />

      {/* --- Modals --- */}
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Remove Device">
        <div className="space-y-4">
          <p className="text-slate-300 text-sm">
            Are you sure you want to completely remove <span className="font-bold text-white">{deviceNames[activeDeviceId] || activeDeviceId}</span> from the fleet? This will permanently delete its telemetry history and monitoring configuration.
          </p>
          <div className="flex space-x-3 pt-2">
            <button 
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg py-2.5 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleRemoveConfirm}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg py-2.5 transition-colors"
            >
              Confirm Remove
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Device Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Provision New Device">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Machine Name</label>
            <input 
              type="text" 
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. CNC Router Alpha"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">3D Digital Twin Model</label>
            <select
              value={newDeviceModelId}
              onChange={(e) => setNewDeviceModelId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 appearance-none"
            >
              {availableModels.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
              <option value="custom-upload">Upload Custom GLB / GLTF...</option>
            </select>
          </div>

          {newDeviceModelId === 'custom-upload' && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Upload Asset</label>
              <button 
                onClick={() => newDeviceFileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-2 bg-slate-900 border border-dashed border-slate-600 rounded-lg px-4 py-4 hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors text-emerald-400"
              >
                <Upload className="w-5 h-5" />
                <span className="font-semibold text-sm">
                  {newDeviceFileName ? newDeviceFileName : 'Click to Upload .GLB File'}
                </span>
              </button>
              <input 
                type="file" 
                ref={newDeviceFileInputRef}
                accept=".glb,.gltf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setNewDeviceFileName(file.name);
                }}
              />
            </div>
          )}

          <button 
            onClick={handleAddDeviceSubmit}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg py-3 mt-4 transition-colors"
          >
            Provision Device
          </button>
        </div>
      </Modal>

    </main>
  );
}
