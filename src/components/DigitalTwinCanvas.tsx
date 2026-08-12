'use client';

import React, { Suspense, Component, ErrorInfo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text } from '@react-three/drei';
import { MachineModel } from './MachineModel';

interface DigitalTwinCanvasProps {
  anomalyScore: number;
  modelUrl: string;
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

  componentDidUpdate(prevProps: any) {
    // If the child props change (e.g. they uploaded a new model), reset error state
    if (this.props.children !== prevProps.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#ff3333" wireframe />
          <Text position={[0, 1.5, 0]} color="white" fontSize={0.2}>
            Invalid Model Format
          </Text>
        </mesh>
      );
    }
    return this.props.children;
  }
}

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({ anomalyScore, modelUrl }) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black relative">
      <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
        <color attach="background" args={['#0a0a0f']} />
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color={anomalyScore >= 80 ? "#ff8888" : "#ffffff"} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Suspense fallback={<Loader />}>
          <ModelErrorBoundary>
            {/* The MachineModel is wrapped in the error boundary so if useGLTF fails, we catch it */}
            <MachineModel key={modelUrl} anomalyScore={anomalyScore} modelUrl={modelUrl} />
          </ModelErrorBoundary>
          <Environment preset="city" />
          <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={anomalyScore < 80}
          autoRotateSpeed={1}
          maxPolarAngle={Math.PI / 2 + 0.1}
        />
      </Canvas>
      
      {/* Decorative HUD overlay */}
      <div className="absolute top-6 left-6 pointer-events-none">
        <h2 className="text-slate-400 text-sm font-mono tracking-widest">DIGITAL TWIN RENDER</h2>
        <div className="w-12 h-[1px] bg-emerald-500 mt-2"></div>
      </div>
    </div>
  );
};

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#445566" wireframe />
      <Text position={[0, 1, 0]} color="white" fontSize={0.2}>
        Loading Asset...
      </Text>
    </mesh>
  );
}
