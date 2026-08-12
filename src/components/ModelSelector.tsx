import React, { useRef, useState } from 'react';
import { Box, Upload } from 'lucide-react';

interface ModelOption {
  id: string;
  name: string;
  url: string;
}

export const availableModels: ModelOption[] = [
  { id: 'lathe', name: 'Industrial Lathe', url: '/models/lathe.glb' },
  { id: 'cnc', name: 'CNC Machine', url: '/models/cnc_machine.glb' },
  { id: 'sensor-pod', name: 'Sensor Pod Base', url: '/models/sensor_pod.glb' },
  { id: 'gearbox', name: 'Gearbox Assembly', url: '/models/lathe.glb' }, // Currently sharing lathe as placeholder
  { id: 'robotic-arm', name: 'Robotic Arm', url: '/models/lathe.glb' } 
];

interface ModelSelectorProps {
  activeModelId: string;
  onSelectModel: (id: string, url?: string, name?: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ activeModelId, onSelectModel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(activeModelId === 'custom-upload');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const suggestedName = file.name.replace(/\.(glb|gltf)$/i, '');
      const machineName = window.prompt("Enter a name for this custom machine:", suggestedName);
      
      const objectUrl = URL.createObjectURL(file);
      onSelectModel('custom-upload', objectUrl, machineName || suggestedName);
      setIsCollapsed(true);
    }
  };

  return (
    <div className="w-full p-4 rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-md flex flex-col space-y-3">
      <div 
        className="flex items-center justify-between text-slate-300 cursor-pointer hover:text-slate-100 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center space-x-2">
          <Box className="w-5 h-5" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">3D Asset Selection</h3>
        </div>
        <span className="text-xs font-mono bg-slate-900/50 px-2 py-1 rounded text-slate-400">
          {isCollapsed ? 'EXPAND' : 'COLLAPSE'}
        </span>
      </div>
      
      {!isCollapsed && (
        <div className="flex flex-col space-y-2 mt-2 border-t border-slate-700/50 pt-3">
          {availableModels.map((model) => (
          <button
            key={model.id}
            onClick={() => onSelectModel(model.id, model.url)}
            className={`px-4 py-2 text-left rounded-lg transition-colors border ${
              activeModelId === model.id
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {model.name}
          </button>
        ))}
        
        {/* Custom Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`px-4 py-2 text-left rounded-lg transition-colors border flex items-center justify-between ${
            activeModelId === 'custom-upload'
              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
              : 'bg-slate-900/50 border-slate-700 text-emerald-400 hover:bg-slate-700'
          }`}
        >
          <span>Upload Custom GLB</span>
          <Upload className="w-4 h-4" />
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
    </div>
  );
};
