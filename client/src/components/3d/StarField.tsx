import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const StarField = ({ count = 2000 }) => {
  const mesh = useRef<THREE.Points>(null);
  
  // Custom shader material
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color("#8b5cf6") },
    },
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        // Simple wave movement
        pos.y += sin(time * 0.5 + position.x * 0.5) * 0.2;
        pos.x += cos(time * 0.3 + position.y * 0.5) * 0.2;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (100.0 / -mvPosition.z); // Size attenuation
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      void main() {
        // Circular particle
        float r = distance(gl_PointCoord, vec2(0.5));
        if (r > 0.5) discard;
        
        // Soft edge glow
        float glow = 1.0 - (r * 2.0);
        glow = pow(glow, 1.5);
        
        gl_FragColor = vec4(color, glow);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame((state) => {
    if (mesh.current) {
        // Update shader time
        material.uniforms.time.value = state.clock.getElapsedTime();
        
        // Rotate the whole field slowly
        mesh.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });
  
  // Create geometry positions
  const positions = useMemo(() => {
      const positions = new Float32Array(count * 3);
      for(let i = 0; i < count; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 50; // x
          positions[i * 3 + 1] = (Math.random() - 0.5) * 50; // y
          positions[i * 3 + 2] = (Math.random() - 0.5) * 50; // z
      }
      return positions;
  }, [count]);

  return (
    <points ref={mesh} material={material}>
      <bufferGeometry>
        <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
        />
      </bufferGeometry>
    </points>
  );
};

export default StarField;
