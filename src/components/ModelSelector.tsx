import React from 'react';
import { Box } from 'lucide-react';

interface ModelOption {
  id: string;
  name: string;
  url: string;
}

export const availableModels: ModelOption[] = [
  { id: 'lathe', name: 'Industrial Lathe', url: '/models/lathe.glb' },
  { id: 'cnc', name: 'CNC Machine', url: '/models/cnc_machine.glb' },
  { id: 'sensor-pod', name: 'Sensor Pod Base', url: '/models/sensor_pod.glb' },
];

interface ModelSelectorProps {
  activeModelId: string;
  onSelectModel: (id: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ activeModelId, onSelectModel }) => {
  return (
    <div className="w-full p-4 rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-md flex flex-col space-y-3">
      <div className="flex items-center space-x-2 text-slate-300">
        <Box className="w-5 h-5" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">3D Asset Selection</h3>
      </div>
      
      <div className="flex flex-col space-y-2">
        {availableModels.map((model) => (
          <button
            key={model.id}
            onClick={() => onSelectModel(model.id)}
            className={`px-4 py-2 text-left rounded-lg transition-colors border ${
              activeModelId === model.id
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {model.name}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Drop custom GLB files into <code>public/models/</code> and update this list to view them!
      </p>
    </div>
  );
};
