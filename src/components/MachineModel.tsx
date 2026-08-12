import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Resize, Center } from '@react-three/drei';
import * as THREE from 'three';

interface MachineModelProps {
  anomalyScore: number;
  modelUrl: string;
}

export const MachineModel: React.FC<MachineModelProps> = ({ anomalyScore, modelUrl }) => {
  const { scene } = useGLTF(modelUrl);
  const isCritical = anomalyScore >= 80;
  
  const groupRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Add slight idle vibration to the whole machine based on score
      const baseVib = 0.001;
      const criticalVib = 0.05;
      const vib = isCritical ? criticalVib : baseVib;
      
      groupRef.current.position.x = Math.sin(state.clock.elapsedTime * 50) * vib;
      groupRef.current.position.z = Math.cos(state.clock.elapsedTime * 50) * vib;
    }
    
    if (isCritical) {
      const flash = Math.sin(state.clock.elapsedTime * 15) * 0.5 + 0.5; // 0 to 1 pulsing
      if (beaconRef.current) {
        // Beacon rotation and pulsing emissive
        beaconRef.current.rotation.y = state.clock.elapsedTime * 10;
        const material = beaconRef.current.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 2 + flash * 5;
      }
      if (lightRef.current) {
        lightRef.current.intensity = 20 * flash;
      }
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      {/* 
        Resize guarantees the model is exactly 3 units wide/tall/deep.
        Center guarantees the model is perfectly centered at [0,0,0].
        This replaces Bounds and prevents camera snapping or scale bugs with custom uploads. 
      */}
      <Center>
        <Resize scale={3}>
          <primitive object={scene} />
        </Resize>
      </Center>
      
      {/* Cool Siren Beacon for E-STOP positioned safely above the guaranteed 3-unit model */}
      <group position={[0, 1.8, 0]} visible={isCritical}>
        <pointLight ref={lightRef} color="#ff0000" distance={10} intensity={0} />
        <mesh ref={beaconRef} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} />
          <meshStandardMaterial 
            color="#ff0000" 
            emissive="#ff0000" 
            emissiveIntensity={0} 
            transparent 
            opacity={0.9} 
          />
        </mesh>
        {/* Base for the beacon */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.1, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </group>
    </group>
  );
};
