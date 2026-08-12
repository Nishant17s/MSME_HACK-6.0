'use client';

import React, { Suspense, Component, ErrorInfo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text, Grid } from '@react-three/drei';
import { MachineModel } from './MachineModel';
import { ComponentPrediction } from '../hooks/usePredictiveEngine';
import { Wrench } from 'lucide-react';

interface DigitalTwinCanvasProps {
  anomalyScore: number;
  modelUrl: string;
  isPowered: boolean;
  machineName?: string;
  predictions: ComponentPrediction[];
}

class ModelErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Failed to load 3D Model:", error, errorInfo);
  }

  componentDidUpdate(prevProps: { children: React.ReactNode }) {
    if (this.props.children !== prevProps.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#EF4444" wireframe />
          <Text position={[0, 1.8, 0]} color="#EF4444" fontSize={0.18} anchorX="center" anchorY="bottom">
            Model Load Error
          </Text>
          <Text position={[0, 1.55, 0]} color="#94A3B8" fontSize={0.12} anchorX="center" anchorY="bottom">
            Invalid or corrupted asset file
          </Text>
        </mesh>
      );
    }
    return this.props.children;
  }
}

// Loading spinner component
function Loader() {
  return (
    <group>
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[0.5, 0.06, 16, 32]} />
        <meshStandardMaterial color="#14B8A6" emissive="#14B8A6" emissiveIntensity={0.5} transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[0.7, 0.04, 16, 32]} />
        <meshStandardMaterial color="#334155" transparent opacity={0.4} />
      </mesh>
      <Text position={[0, -1.2, 0]} color="#94A3B8" fontSize={0.15} anchorX="center">
        Loading Asset...
      </Text>
    </group>
  );
}

// Floor grid component
function FloorGrid() {
  return (
    <Grid
      position={[0, -1.5, 0]}
      args={[20, 20]}
      cellSize={0.5}
      cellThickness={0.5}
      cellColor="#1A2235"
      sectionSize={2}
      sectionThickness={1}
      sectionColor="#243044"
      fadeDistance={15}
      fadeStrength={1.5}
      infiniteGrid
    />
  );
}

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({ anomalyScore, modelUrl, isPowered, machineName, predictions }) => {
  const isCritical = anomalyScore >= 80;
  const criticalComponents = predictions.filter(p => p.urgency === 'replace_now').length;
  const needsService = predictions.some(p => p.urgency === 'replace_now' || p.urgency === 'schedule_soon');

  return (
    <div className="w-full h-full relative" style={{ background: 'var(--surface-0)' }}>
      <Canvas
        camera={{ position: [5, 4, 5], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#060A13']} />

        {/* Lighting — shifts red during critical */}
        <ambientLight intensity={isPowered ? 0.4 : 0.15} />
        <directionalLight
          position={[8, 10, 5]}
          intensity={isPowered ? 1.2 : 0.4}
          color={isCritical && isPowered ? "#ffaa88" : "#e8edf5"}
          castShadow
        />
        <pointLight position={[-8, -6, -8]} intensity={0.3} color="#3B82F6" />

        {/* Critical red ambient fill */}
        {isCritical && isPowered && (
          <pointLight position={[0, 3, 0]} intensity={8} color="#EF4444" distance={8} />
        )}

        <Suspense fallback={<Loader />}>
          <ModelErrorBoundary>
            <MachineModel key={modelUrl} anomalyScore={anomalyScore} modelUrl={modelUrl} isPowered={isPowered} />
          </ModelErrorBoundary>
          <Environment preset="city" environmentIntensity={isPowered ? 0.3 : 0.1} />
          <ContactShadows position={[0, -1.5, 0]} opacity={isPowered ? 0.35 : 0.15} scale={12} blur={2.5} far={4} />
        </Suspense>

        <FloorGrid />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={isPowered && anomalyScore < 80}
          autoRotateSpeed={0.8}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minDistance={3}
          maxDistance={15}
        />
      </Canvas>

      {/* HUD Overlay — top left */}
      <div className="absolute top-5 left-5 pointer-events-none">
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: !isPowered ? 'var(--status-offline)' : isCritical ? 'var(--status-critical)' : 'var(--status-nominal)',
              boxShadow: isCritical ? '0 0 6px var(--status-critical)' : isPowered ? '0 0 4px var(--status-nominal)' : 'none',
            }}
          />
          <span className="text-[10px] font-mono font-medium" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            {!isPowered ? 'OFFLINE' : isCritical ? 'CRITICAL' : 'LIVE'}
          </span>
        </div>
        <h2 className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {machineName || 'Digital Twin'}
        </h2>
        <div className="w-8 h-[1px] mt-1.5" style={{ background: 'var(--accent)', opacity: 0.5 }} />
      </div>

      {/* Component Health HUD — bottom left */}
      {isPowered && (
        <div className="absolute bottom-5 left-5 pointer-events-none p-3 rounded-lg"
          style={{ background: 'rgba(6, 10, 19, 0.7)', backdropFilter: 'blur(8px)', border: '1px solid var(--surface-border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-[9px] font-semibold uppercase" style={{ color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
              Component Health
            </h3>
            {needsService && (
              <Wrench className="w-3 h-3" style={{ color: 'var(--status-warning)' }} />
            )}
          </div>
          
          <div className="grid grid-cols-5 gap-3">
            {predictions.map(pred => {
              const val = pred.health;
              const color = val <= 20 ? 'var(--status-critical)' : val <= 45 ? 'var(--status-warning)' : val <= 70 ? 'var(--status-watch)' : 'var(--status-nominal)';
              return (
                <div key={pred.component} className="flex flex-col items-center gap-1">
                  <div className="w-1.5 h-8 rounded-full flex flex-col justify-end" style={{ background: 'var(--surface-4)' }}>
                    <div className="w-full rounded-full transition-all duration-500" style={{ height: `${val}%`, background: color }} />
                  </div>
                  <span className="text-[8px] font-mono uppercase" style={{ color: 'var(--text-muted)' }}>{pred.component.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(6, 10, 19, 0.4) 100%)',
        }}
      />
    </div>
  );
};
