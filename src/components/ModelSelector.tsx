'use client';

import React, { useRef, useState } from 'react';
import { Box, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from './Modal';

interface ModelOption {
  id: string;
  name: string;
  url: string;
}

export const availableModels: ModelOption[] = [
  { id: 'lathe', name: 'Industrial Lathe', url: '/models/lathe.glb' },
  { id: 'cnc', name: 'CNC Machine', url: '/models/cnc_machine.glb' },
  { id: 'sensor-pod', name: 'Sensor Pod Base', url: '/models/sensor_pod.glb' },
  { id: 'gearbox', name: 'Gearbox Assembly', url: '/models/lathe.glb' },
  { id: 'robotic-arm', name: 'Robotic Arm', url: '/models/lathe.glb' }
];

interface ModelSelectorProps {
  activeModelId: string;
  onSelectModel: (id: string, url?: string, name?: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ activeModelId, onSelectModel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Custom upload state
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [customMachineName, setCustomMachineName] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setCustomMachineName(file.name.replace(/\.(glb|gltf)$/i, ''));
      setShowNameModal(true);
    }
  };

  const confirmCustomUpload = () => {
    if (pendingFile) {
      const objectUrl = URL.createObjectURL(pendingFile);
      onSelectModel('custom-upload', objectUrl, customMachineName);
      setIsCollapsed(true);
      setShowNameModal(false);
      setPendingFile(null);
    }
  };

  const activeModel = availableModels.find(m => m.id === activeModelId);

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-2)',
        border: '1px solid var(--surface-border)',
      }}
    >
      {/* Toggle Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', letterSpacing: '0.03em' }}>
            3D Asset
          </span>
          {activeModel && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {activeModel.name}
            </span>
          )}
          {activeModelId === 'custom-upload' && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              Custom Upload
            </span>
          )}
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
        ) : (
          <ChevronUp className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
        )}
      </button>

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className="px-3 pb-3 space-y-1.5" style={{ borderTop: '1px solid var(--surface-border)' }}>
          <div className="pt-2" />
          {availableModels.map(model => (
            <button
              key={model.id}
              onClick={() => { onSelectModel(model.id, model.url); setIsCollapsed(true); }}
              className="w-full px-3 py-2 text-left text-xs font-medium transition-all duration-150"
              style={{
                borderRadius: 'var(--radius-sm)',
                background: activeModelId === model.id ? 'var(--accent-soft)' : 'transparent',
                color: activeModelId === model.id ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${activeModelId === model.id ? 'rgba(20, 184, 166, 0.2)' : 'transparent'}`,
              }}
            >
              {model.name}
            </button>
          ))}

          {/* Upload Custom */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-all duration-150"
            style={{
              borderRadius: 'var(--radius-sm)',
              background: activeModelId === 'custom-upload' ? 'var(--accent-soft)' : 'transparent',
              color: 'var(--accent)',
              border: `1px dashed ${activeModelId === 'custom-upload' ? 'var(--accent)' : 'var(--surface-border-light)'}`,
            }}
          >
            <span>Upload Custom GLB</span>
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".glb,.gltf"
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Name Custom Upload Modal */}
      <Modal isOpen={showNameModal} onClose={() => setShowNameModal(false)} title="Name Custom Machine">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Machine Name
            </label>
            <input
              type="text"
              value={customMachineName}
              onChange={(e) => setCustomMachineName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--surface-3)',
                border: '1px solid var(--surface-border-light)',
                color: 'var(--text-primary)',
              }}
              placeholder="e.g. Injection Molder"
              autoFocus
            />
          </div>
          <button
            onClick={confirmCustomUpload}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Confirm Upload
          </button>
        </div>
      </Modal>
    </div>
  );
};
