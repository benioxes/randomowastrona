import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CursorDroneProps {
  position: [number, number, number];
  color: string;
  username: string;
}

export function CursorDrone({ position, color, username }: CursorDroneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const targetPos = useRef(new THREE.Vector3(...position));

  useFrame((state) => {
    if (groupRef.current) {
      // Smooth interpolation to target position
      targetPos.current.set(...position);
      groupRef.current.position.lerp(targetPos.current, 0.15);

      // Floating animation
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y += Math.sin(t * 3) * 0.003;

      // Subtle rotation
      groupRef.current.rotation.y = Math.sin(t * 2) * 0.3;
      groupRef.current.rotation.z = Math.cos(t * 1.5) * 0.1;
    }

    if (glowRef.current) {
      // Pulsing glow
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 4) * 0.2;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Core */}
      <mesh>
        <octahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Inner glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.18, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Trail particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              -0.1, 0, 0.1,
              0.1, 0, 0.1,
              0, 0.05, 0.15,
              0, -0.05, 0.15,
            ]), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color={color}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Point light for local illumination */}
      <pointLight color={color} intensity={0.5} distance={2} />
    </group>
  );
}
