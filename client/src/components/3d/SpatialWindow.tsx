import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, MeshTransmissionMaterial } from '@react-three/drei';
import { useDrag } from '@use-gesture/react';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import { X } from 'lucide-react';

interface SpatialWindowProps {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  title: string;
  type: string;
  children: React.ReactNode;
}

export function SpatialWindow({ id, position, rotation, title, type, children }: SpatialWindowProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { focusWindow, updateWindowPosition, removeWindow, activeWindowId } = useStore();
  const isActive = activeWindowId === id;

  const [hovered, setHover] = useState(false);

  // We'll use local state for smooth animation and sync to store on drag end
  const [pos, setPos] = useState(position);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Smooth lerp to target position
      groupRef.current.position.lerp(new THREE.Vector3(...pos), 0.1);
      
      // Floating animation
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y += Math.sin(t + id.charCodeAt(0)) * 0.001;
    }
  });

  const handleDrag = useDrag(({ offset: [x, y], delta: [dx, dy] }) => {
    // Scale the movement down
    const sensitivity = 0.005;
    const newPos: [number, number, number] = [
      pos[0] + dx * sensitivity,
      pos[1] - dy * sensitivity,
      pos[2]
    ];
    setPos(newPos);
    focusWindow(id);
    updateWindowPosition(id, newPos);
  });

  return (
    <group 
      ref={groupRef} 
      position={position} 
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        focusWindow(id);
      }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      {/* Glass Pane */}
      <mesh ref={meshRef}>
        <boxGeometry args={[3, 2, 0.1]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.2}
          chromaticAberration={0.05}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.1}
          temporalDistortion={0.1}
          iridescence={0.5}
          iridescenceIOR={1}
          iridescenceThicknessRange={[0, 1400]}
          roughness={0.1}
          metalness={0.1}
          color={isActive ? "#a78bfa" : "#ffffff"} // Tint purple when active
          toneMapped={true}
        />
      </mesh>

      {/* Header / Drag Handle */}
      <mesh position={[0, 0.9, 0.06]} {...handleDrag()} onClick={(e) => e.stopPropagation()}>
        <planeGeometry args={[2.8, 0.15]} />
        <meshBasicMaterial color="white" opacity={0} transparent />
        <Html
          transform
          occlude
          position={[0, 0, 0]}
          style={{ 
            width: '280px', 
            height: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            pointerEvents: 'none', // Allow drag to pass through to mesh
            userSelect: 'none'
          }}
        >
          <div className="flex items-center justify-between w-full px-2 text-[10px] font-mono text-white/70 uppercase tracking-widest">
            <span className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-500'}`} />
               {title}
            </span>
            <div className="flex gap-1 pointer-events-auto">
              {/* Actual buttons need pointer events */}
              <div 
                className="hover:text-white cursor-pointer"
                onClick={(e) => {
                  // e.stopPropagation(); // React synthetic event
                  // We need to handle this carefully in 3D HTML
                  removeWindow(id);
                }}
              >
                <X size={10} />
              </div>
            </div>
          </div>
        </Html>
      </mesh>

      {/* Content */}
      <Html
        transform
        occlude
        position={[0, -0.1, 0.06]}
        style={{
          width: '280px', // Scaled by factor of 10 usually in R3F HTML default
          height: '180px',
        }}
        className="select-none"
      >
        <div 
          className="w-full h-full overflow-hidden p-4 text-white/90 font-sans"
          onPointerDown={(e) => e.stopPropagation()} // Enable interaction with HTML
        >
          {typeof children === 'string' ? (
             <div className="prose prose-invert prose-sm">
                <p>{children}</p>
             </div>
          ) : (
             children
          )}
          
          {/* Example Input if it's a terminal or notes */}
          {type === 'terminal' && (
            <div className="mt-4 font-mono text-xs text-green-400">
              <div className="flex gap-2">
                <span>$</span>
                <input 
                  type="text" 
                  className="bg-transparent border-none outline-none text-green-400 w-full placeholder-green-800"
                  placeholder="enter command..."
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
