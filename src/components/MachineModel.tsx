import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface MachineModelProps {
  anomalyScore: number;
}

export const MachineModel: React.FC<MachineModelProps> = ({ anomalyScore }) => {
  const { scene } = useGLTF('/machine.glb');
  const isCritical = anomalyScore >= 80;
  
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);

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
      {/* We center and scale the sample glTF Box model */}
      <primitive object={scene} scale={2} position={[0, -1, 0]} />
      
      {/* Additional procedurally generated machine parts attached to the box to look like a pod */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
        <meshStandardMaterial color={isCritical ? "#442222" : "#334455"} metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Visual Trigger overlay for E-STOP */}
      {isCritical && (
        <mesh ref={sphereRef} position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.6, 32, 32]} />
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
    </group>
  );
};

useGLTF.preload('/machine.glb');
