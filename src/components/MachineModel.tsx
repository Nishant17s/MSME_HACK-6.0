import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Resize, Center } from '@react-three/drei';
import * as THREE from 'three';

interface MachineModelProps {
  anomalyScore: number;
  modelUrl: string;
  isPowered: boolean;
}

export const MachineModel: React.FC<MachineModelProps> = ({ anomalyScore, modelUrl, isPowered }) => {
  const { scene } = useGLTF(modelUrl);
  const isCritical = anomalyScore >= 80 && isPowered;

  const groupRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Grayscale material override for powered-off state
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    if (!isPowered) {
      clone.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = (child.material as THREE.MeshStandardMaterial).clone();
          // Desaturate by averaging the color channels
          const avg = (mat.color.r + mat.color.g + mat.color.b) / 3;
          mat.color.setRGB(avg * 0.5, avg * 0.5, avg * 0.55);
          mat.emissive.setRGB(0, 0, 0);
          mat.emissiveIntensity = 0;
          mat.roughness = Math.min(mat.roughness + 0.3, 1);
          child.material = mat;
        }
      });
    }
    return clone;
  }, [scene, isPowered]);

  useFrame((state) => {
    if (groupRef.current) {
      if (isCritical) {
        // Critical vibration
        const vib = 0.04;
        groupRef.current.position.x = Math.sin(state.clock.elapsedTime * 45) * vib;
        groupRef.current.position.z = Math.cos(state.clock.elapsedTime * 45) * vib;
      } else if (isPowered) {
        // Very subtle idle hum
        const vib = 0.001;
        groupRef.current.position.x = Math.sin(state.clock.elapsedTime * 8) * vib;
        groupRef.current.position.z = Math.cos(state.clock.elapsedTime * 8) * vib;
      } else {
        // Reset position when off
        groupRef.current.position.x = 0;
        groupRef.current.position.z = 0;
      }
    }

    if (isCritical) {
      const flash = Math.sin(state.clock.elapsedTime * 12) * 0.5 + 0.5;
      if (beaconRef.current) {
        beaconRef.current.rotation.y = state.clock.elapsedTime * 8;
        const material = beaconRef.current.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 1.5 + flash * 4;
      }
      if (lightRef.current) {
        lightRef.current.intensity = 15 * flash;
      }
      if (ringRef.current) {
        // Pulsing ring effect
        const scale = 1 + flash * 0.5;
        ringRef.current.scale.set(scale, scale, scale);
        const ringMat = ringRef.current.material as THREE.MeshStandardMaterial;
        ringMat.opacity = 0.3 * (1 - flash * 0.6);
      }
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      <Center>
        <Resize scale={3}>
          <primitive object={clonedScene} />
        </Resize>
      </Center>

      {/* Warning Beacon + Pulsing Ring — only visible in critical powered state */}
      <group position={[0, 1.8, 0]} visible={isCritical}>
        <pointLight ref={lightRef} color="#EF4444" distance={10} intensity={0} />

        {/* Beacon cylinder */}
        <mesh ref={beaconRef}>
          <cylinderGeometry args={[0.18, 0.18, 0.28, 16]} />
          <meshStandardMaterial
            color="#EF4444"
            emissive="#EF4444"
            emissiveIntensity={0}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Pulsing concentric ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <torusGeometry args={[0.5, 0.02, 8, 32]} />
          <meshStandardMaterial
            color="#EF4444"
            emissive="#EF4444"
            emissiveIntensity={2}
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Beacon base */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
          <meshStandardMaterial color="#1A2235" />
        </mesh>
      </group>
    </group>
  );
};
