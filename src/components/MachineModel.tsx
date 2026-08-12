import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, MeshWobbleMaterial, Bounds } from '@react-three/drei';
import * as THREE from 'three';

interface MachineModelProps {
  anomalyScore: number;
  modelUrl: string;
}

export const MachineModel: React.FC<MachineModelProps> = ({ anomalyScore, modelUrl }) => {
  const { scene } = useGLTF(modelUrl);
  const isCritical = anomalyScore >= 80;
  
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);

  // Clone the scene so we can reuse the same GLTF across unmounts/remounts easily without messing up the cache
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  useFrame((state) => {
    if (groupRef.current) {
      // Add slight idle vibration to the whole machine based on score
      const baseVib = 0.001;
      const criticalVib = 0.05;
      const vib = isCritical ? criticalVib : baseVib;
      
      groupRef.current.position.x = Math.sin(state.clock.elapsedTime * 50) * vib;
      groupRef.current.position.z = Math.cos(state.clock.elapsedTime * 50) * vib;
    }
    
    if (sphereRef.current) {
      const scale = 1.2 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
      sphereRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      <Bounds fit clip observe margin={1.2}>
        <primitive object={clonedScene} />
        
        {/* Visual Trigger overlay for E-STOP positioned dynamically inside the bounds */}
        {isCritical && (
          <mesh ref={sphereRef} position={[0, 0, 0]}>
            <sphereGeometry args={[1, 32, 32]} />
            <MeshWobbleMaterial 
              color="#ff0000" 
              emissive="#ff0000" 
              emissiveIntensity={4} 
              transparent 
              opacity={0.6} 
              factor={1} 
              speed={10} 
            />
          </mesh>
        )}
      </Bounds>
    </group>
  );
};
