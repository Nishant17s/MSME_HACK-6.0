'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DigitalTwinCanvas } from '../components/DigitalTwinCanvas';
import { TelemetryPanel } from '../components/TelemetryPanel';
import { useMqttTelemetry } from '../hooks/useMqttTelemetry';
import { useAlertManager } from '../hooks/useAlertManager';
import { usePredictiveEngine } from '../hooks/usePredictiveEngine';
import { availableModels } from '../components/ModelSelector';
import { TopBar } from '../components/TopBar';
import { StatusBar } from '../components/StatusBar';
import { DeviceSidebar } from '../components/DeviceSidebar';
import { Modal } from '../components/Modal';
import { AlertPanel } from '../components/AlertPanel';
import { Upload } from 'lucide-react';

export default function Dashboard() {
  const {
    deviceData,
    deviceNames,
    setDeviceName,
    powerStates,
    toggleDevicePower,
    addDevice,
    removeDevice,
    status,
    simulated,
    setSimulated,
    forceFault,
    setForceFault,
    lastUpdated,
    telemetryHistory,
    reconnectAttempts,
    calibrationStates,
    discoveredComponents,
    verifyCalibration,
    calibrationProgress,
    variableRpm,
    setVariableRpm,
    tamperedPod,
    setTamperedPod,
    multiPodMesh,
    setMultiPodMesh,
  } = useMqttTelemetry();

  const {
    alerts,
    activeAlertCount,
    criticalAlertCount,
    processTelemetry,
    acknowledgeAlert,
    resolveAlert,
    dismissAlert,
    markFalsePositive,
    acknowledgeAll,
    clearResolved,
  } = useAlertManager();

  // Process telemetry through alert manager
  useEffect(() => {
    processTelemetry(deviceData, deviceNames, powerStates);
  }, [deviceData, deviceNames, powerStates, processTelemetry]);

  // State for which device is selected in the sidebar
  const [activeDeviceId, setActiveDeviceId] = useState<string>('pod-SE001');

  // State for which 3D model is active for each device
  const [deviceModels, setDeviceModels] = useState<Record<string, { id: string, url?: string }>>({});

  // Persist device models to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sentinel_deviceModels');
    if (saved) {
      try { setDeviceModels(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (Object.keys(deviceModels).length > 0) {
      localStorage.setItem('sentinel_deviceModels', JSON.stringify(deviceModels));
    }
  }, [deviceModels]);

  // Alert panel toggle
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);

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
  const activeDeviceTelemetry = deviceData[activeDeviceId];
  const activeDeviceHistory = telemetryHistory[activeDeviceId] || [];
  const isPowered = powerStates[activeDeviceId] ?? true;

  // Predictive Engine for the active device
  const { predictions, recommendations } = usePredictiveEngine(
    activeDeviceTelemetry,
    activeDeviceHistory,
    isPowered,
    discoveredComponents[activeDeviceId]
  );

  // Fleet stats for status bar
  const deviceIds = Object.keys(deviceData);
  const onlineCount = deviceIds.filter(id => powerStates[id] ?? true).length;

  return (
    <main className="flex flex-col w-screen h-screen overflow-hidden" style={{ background: 'var(--surface-0)', color: 'var(--text-primary)' }}>

      {/* 1. Top Navigation Bar */}
      <TopBar
        activeAlertCount={activeAlertCount}
        criticalAlertCount={criticalAlertCount}
        onToggleAlerts={() => setAlertPanelOpen(!alertPanelOpen)}
      />

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
            anomalyScore={activeDeviceTelemetry?.anomaly_score || 0}
            modelUrl={activeModelUrl}
            isPowered={isPowered}
            machineName={deviceNames[activeDeviceId]}
            predictions={predictions}
          />
        </section>

        {/* 4. Telemetry Dashboard (Right Sidebar) */}
        <section className="w-[340px] min-w-[340px] h-full z-10 flex-shrink-0 shadow-xl">
          {activeDeviceTelemetry && (
            <TelemetryPanel
              data={activeDeviceTelemetry}
              status={status}
              simulated={simulated}
              setSimulated={setSimulated}
              forceFault={forceFault === activeDeviceId}
              setForceFault={(val) => setForceFault(val ? activeDeviceId : null)}
              activeModelId={activeModelId}
              onSelectModel={handleModelSelect}
              isPowered={isPowered}
              onTogglePower={() => toggleDevicePower(activeDeviceId)}
              onRemoveDevice={() => setShowDeleteModal(true)}
              history={activeDeviceHistory}
              predictions={predictions}
              recommendations={recommendations}
              calibrationState={calibrationStates[activeDeviceId]}
              discoveredComponents={discoveredComponents[activeDeviceId] || []}
              onVerifyCalibration={(comps) => verifyCalibration(activeDeviceId, comps)}
              calibrationProgress={calibrationProgress[activeDeviceId] || 0}
              variableRpm={variableRpm}
              setVariableRpm={setVariableRpm}
              tamperedPod={tamperedPod === activeDeviceId}
              setTamperedPod={(val) => setTamperedPod(val ? activeDeviceId : null)}
              multiPodMesh={multiPodMesh}
              setMultiPodMesh={setMultiPodMesh}
            />
          )}
        </section>

      </div>

      {/* 5. Bottom Status Bar */}
      <StatusBar
        status={status}
        lastUpdated={lastUpdated}
        deviceCount={deviceIds.length}
        onlineCount={onlineCount}
        reconnectAttempts={reconnectAttempts}
      />

      {/* Alert Panel (Slide-out) */}
      <AlertPanel
        isOpen={alertPanelOpen}
        onClose={() => setAlertPanelOpen(false)}
        alerts={alerts}
        onAcknowledge={acknowledgeAlert}
        onResolve={resolveAlert}
        onDismiss={dismissAlert}
        onMarkFalsePositive={markFalsePositive}
        onAcknowledgeAll={acknowledgeAll}
        onClearResolved={clearResolved}
      />

      {/* --- Modals --- */}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Remove Pod">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to remove pod <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{deviceNames[activeDeviceId] || activeDeviceId}</span> from the fleet? This will permanently delete its telemetry and maintenance history.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--surface-border)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveConfirm}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ background: 'var(--status-critical)' }}
            >
              Remove
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Device Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Provision New Pod">
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Machine Name
            </label>
            <input
              type="text"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--surface-border-light)', color: 'var(--text-primary)' }}
              placeholder="e.g. CNC Router Alpha"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              3D Digital Twin Model
            </label>
            <select
              value={newDeviceModelId}
              onChange={(e) => setNewDeviceModelId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none appearance-none"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--surface-border-light)', color: 'var(--text-primary)' }}
            >
              {availableModels.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
              <option value="custom-upload">Upload Custom GLB / GLTF...</option>
            </select>
          </div>

          {newDeviceModelId === 'custom-upload' && (
            <div>
              <label className="block text-[10px] font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Upload Asset
              </label>
              <button
                onClick={() => newDeviceFileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-80"
                style={{
                  border: '1px dashed var(--surface-border-light)',
                  color: 'var(--accent)',
                  background: 'var(--accent-soft)',
                }}
              >
                <Upload className="w-4 h-4" />
                <span>{newDeviceFileName ? newDeviceFileName : 'Click to Upload .GLB File'}</span>
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
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors hover:opacity-90 text-white mt-2"
            style={{ background: 'var(--accent)' }}
          >
            Provision Pod
          </button>
        </div>
      </Modal>

    </main>
  );
}
