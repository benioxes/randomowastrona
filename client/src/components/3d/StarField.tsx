import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface StarFieldProps {
  count?: number;
}

const StarField = ({ count = 3000 }: StarFieldProps) => {
  const mesh = useRef<THREE.Points>(null);
  const mouseRef = useRef({ x: 0, y: 0, smoothX: 0, smoothY: 0 });
  const { viewport } = useThree();

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      mousePos: { value: new THREE.Vector2(0, 0) },
      baseColor: { value: new THREE.Color("#8b5cf6") },
      accentColor: { value: new THREE.Color("#22d3ee") },
      repulsionRadius: { value: 8.0 },
      repulsionStrength: { value: 3.0 },
    },
    vertexShader: `
      uniform float time;
      uniform vec2 mousePos;
      uniform float repulsionRadius;
      uniform float repulsionStrength;
      
      attribute float size;
      attribute float seed;
      
      varying float vDistance;
      varying float vAlpha;
      varying vec3 vColor;
      
      // Simplex noise function for organic movement
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      
      void main() {
        vec3 pos = position;
        
        // Organic base movement with noise
        float noiseScale = 0.1;
        float noiseSpeed = 0.15;
        pos.x += snoise(vec3(position.x * noiseScale, position.y * noiseScale, time * noiseSpeed + seed)) * 0.5;
        pos.y += snoise(vec3(position.y * noiseScale, position.z * noiseScale, time * noiseSpeed + seed * 2.0)) * 0.5;
        pos.z += snoise(vec3(position.z * noiseScale, position.x * noiseScale, time * noiseSpeed + seed * 3.0)) * 0.3;
        
        // Convert mouse to 3D world space (approximate)
        vec3 mouseWorld = vec3(mousePos.x * 15.0, mousePos.y * 10.0, 0.0);
        
        // Calculate distance to mouse in XY plane
        vec2 toMouse = pos.xy - mouseWorld.xy;
        float dist = length(toMouse);
        
        // Repulsion effect - particles flee from cursor
        if (dist < repulsionRadius) {
          float strength = (1.0 - dist / repulsionRadius) * repulsionStrength;
          vec2 repulsion = normalize(toMouse) * strength;
          pos.xy += repulsion;
          
          // Add spiral/vortex effect
          float angle = atan(toMouse.y, toMouse.x);
          float vortexStrength = strength * 0.5;
          pos.x += cos(angle + 1.5708) * vortexStrength; // 90 degrees offset for spiral
          pos.y += sin(angle + 1.5708) * vortexStrength;
          pos.z += sin(time * 2.0 + dist) * strength * 0.3; // Z wobble
        }
        
        vDistance = dist;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Size attenuation with distance and mouse proximity
        float baseSize = size * (150.0 / -mvPosition.z);
        if (dist < repulsionRadius) {
          baseSize *= 1.0 + (1.0 - dist / repulsionRadius) * 0.8; // Grow near cursor
        }
        gl_PointSize = baseSize;
        
        // Alpha based on distance
        vAlpha = 0.6 + (dist < repulsionRadius ? (1.0 - dist / repulsionRadius) * 0.4 : 0.0);
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 baseColor;
      uniform vec3 accentColor;
      uniform float repulsionRadius;
      
      varying float vDistance;
      varying float vAlpha;
      
      void main() {
        // Circular particle with soft edges
        float r = distance(gl_PointCoord, vec2(0.5));
        if (r > 0.5) discard;
        
        // Soft glow
        float glow = 1.0 - (r * 2.0);
        glow = pow(glow, 1.5);
        
        // Color blend based on mouse proximity
        float colorMix = smoothstep(repulsionRadius, 0.0, vDistance);
        vec3 finalColor = mix(baseColor, accentColor, colorMix);
        
        gl_FragColor = vec4(finalColor, glow * vAlpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame((state, delta) => {
    if (mesh.current) {
      // Smooth mouse interpolation for fluid feel
      mouseRef.current.smoothX += (mouseRef.current.x - mouseRef.current.smoothX) * 0.08;
      mouseRef.current.smoothY += (mouseRef.current.y - mouseRef.current.smoothY) * 0.08;

      material.uniforms.time.value = state.clock.getElapsedTime();
      material.uniforms.mousePos.value.set(
        mouseRef.current.smoothX,
        mouseRef.current.smoothY
      );

      // Slow global rotation
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      mesh.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.01) * 0.1;
    }
  });

  // Create geometry with positions, sizes, and seeds
  const [positions, sizes, seeds] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spherical distribution for more interesting 3D effect
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 15 + Math.random() * 35;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      sizes[i] = 0.5 + Math.random() * 1.5;
      seeds[i] = Math.random() * 100;
    }

    return [positions, sizes, seeds];
  }, [count]);

  return (
    <points ref={mesh} material={material}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-seed"
          args={[seeds, 1]}
        />
      </bufferGeometry>
    </points>
  );
};

export default StarField;
