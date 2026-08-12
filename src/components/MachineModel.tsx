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
  const beaconRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

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
      <Bounds fit margin={1.5}>
        <primitive object={clonedScene} />
        
        {/* Cool Siren Beacon for E-STOP */}
        {isCritical && (
          <group position={[0, 2, 0]}>
            <pointLight ref={lightRef} color="#ff0000" distance={10} intensity={20} />
            <mesh ref={beaconRef} position={[0, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} />
              <meshStandardMaterial 
                color="#ff0000" 
                emissive="#ff0000" 
                emissiveIntensity={5} 
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
        )}
      </Bounds>
    </group>
  );
};
