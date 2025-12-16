import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, MeshTransmissionMaterial } from '@react-three/drei';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import { X, Grip } from 'lucide-react';
import { AITerminalContent } from './AITerminal';

interface PhysicsWindowProps {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  title: string;
  type: string;
  children: React.ReactNode;
}

export function PhysicsWindow({ id, position, rotation, title, type, children }: PhysicsWindowProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { focusWindow, updateWindowPosition, removeWindow, activeWindowId, broadcastWindowMove } = useStore();
  const isActive = activeWindowId === id;
  const { gl } = useThree();

  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHover] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastVelocity = useRef({ x: 0, y: 0 });

  useFrame(() => {
    if (rigidBodyRef.current) {
      const pos = rigidBodyRef.current.translation();

      // Clamp position to bounds (create "walls")
      const bounds = { x: 6, y: 4, z: 3 };
      let clamped = false;

      if (Math.abs(pos.x) > bounds.x) {
        pos.x = Math.sign(pos.x) * bounds.x;
        clamped = true;
        const vel = rigidBodyRef.current.linvel();
        rigidBodyRef.current.setLinvel({ x: -vel.x * 0.7, y: vel.y, z: vel.z }, true);
      }
      if (Math.abs(pos.y) > bounds.y) {
        pos.y = Math.sign(pos.y) * bounds.y;
        clamped = true;
        const vel = rigidBodyRef.current.linvel();
        rigidBodyRef.current.setLinvel({ x: vel.x, y: -vel.y * 0.7, z: vel.z }, true);
      }
      if (Math.abs(pos.z) > bounds.z) {
        pos.z = Math.sign(pos.z) * bounds.z;
        clamped = true;
        const vel = rigidBodyRef.current.linvel();
        rigidBodyRef.current.setLinvel({ x: vel.x, y: vel.y, z: -vel.z * 0.7 }, true);
      }

      if (clamped) {
        rigidBodyRef.current.setTranslation(pos, true);
      }

      updateWindowPosition(id, [pos.x, pos.y, pos.z]);
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    focusWindow(id);

    dragStart.current = { x: e.clientX, y: e.clientY };
    lastVelocity.current = { x: 0, y: 0 };

    if (rigidBodyRef.current) {
      rigidBodyRef.current.setBodyType(2, true); // kinematic
    }

    gl.domElement.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging || !rigidBodyRef.current) return;

    const dx = (e.clientX - dragStart.current.x) * 0.01;
    const dy = -(e.clientY - dragStart.current.y) * 0.01;

    lastVelocity.current = { x: dx * 2, y: dy * 2 };

    const currentPos = rigidBodyRef.current.translation();
    rigidBodyRef.current.setTranslation(
      {
        x: currentPos.x + dx,
        y: currentPos.y + dy,
        z: currentPos.z,
      },
      true
    );

    dragStart.current = { x: e.clientX, y: e.clientY };

    broadcastWindowMove(id, [currentPos.x + dx, currentPos.y + dy, currentPos.z]);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    gl.domElement.style.cursor = 'default';

    if (rigidBodyRef.current) {
      rigidBodyRef.current.setBodyType(0, true); // dynamic

      rigidBodyRef.current.applyImpulse(
        {
          x: lastVelocity.current.x * 0.3,
          y: lastVelocity.current.y * 0.3,
          z: 0,
        },
        true
      );
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const renderContent = () => {
    if (type === 'terminal') {
      return <AITerminalContent windowId={id} />;
    }

    return (
      <div className="w-full h-full">
        {typeof children === 'string' ? (
          <p className="leading-relaxed text-sm">{children}</p>
        ) : (
          children
        )}

        {type === 'notes' && (
          <textarea
            className="w-full h-20 mt-2 bg-white/5 border border-white/10 rounded p-2 text-white/80 text-xs font-mono resize-none focus:outline-none focus:border-purple-500"
            placeholder="Write your notes here..."
            data-testid={`textarea-notes-${id}`}
          />
        )}
      </div>
    );
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      rotation={rotation}
      type="dynamic"
      linearDamping={2}
      angularDamping={4}
      gravityScale={0}
      colliders="cuboid"
    >
      <group
        onClick={(e) => {
          e.stopPropagation();
          focusWindow(id);
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        {/* Glass Pane */}
        <mesh ref={meshRef}>
          <boxGeometry args={[3, 2, 0.08]} />
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={0.15}
            chromaticAberration={0.03}
            anisotropy={0.1}
            distortion={0.08}
            distortionScale={0.1}
            temporalDistortion={0.05}
            iridescence={0.3}
            iridescenceIOR={1}
            iridescenceThicknessRange={[0, 1400]}
            roughness={0.05}
            metalness={0}
            color={isActive ? '#a78bfa' : '#ffffff'}
            toneMapped={true}
          />
        </mesh>

        {/* Glow border when active */}
        {isActive && (
          <mesh>
            <boxGeometry args={[3.05, 2.05, 0.02]} />
            <meshBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
          </mesh>
        )}

        {/* Header / Drag Handle */}
        <mesh position={[0, 0.85, 0.05]} onPointerDown={handlePointerDown}>
          <planeGeometry args={[2.8, 0.2]} />
          <meshBasicMaterial color="#1a1a2e" transparent opacity={0.8} />
        </mesh>

        <Html
          transform
          occlude
          position={[0, 0.85, 0.06]}
          style={{
            width: '280px',
            height: '20px',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="flex items-center justify-between w-full px-3 text-[11px] font-mono text-white/80 uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Grip size={12} className="opacity-50" />
              <div
                className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-gray-500'
                }`}
              />
              {title}
            </span>
            <div className="flex gap-2 pointer-events-auto">
              <button
                className="hover:text-red-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  removeWindow(id);
                }}
                data-testid={`button-close-window-${id}`}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        </Html>

        {/* Content */}
        <Html
          transform
          occlude
          position={[0, -0.1, 0.06]}
          style={{
            width: '280px',
            height: '160px',
          }}
          className="select-none"
        >
          <div
            className="w-full h-full overflow-hidden p-3 text-white/90 font-sans"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {renderContent()}
          </div>
        </Html>
      </group>
    </RigidBody>
  );
}
