import React, { useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import StarField from './StarField';
import { useStore } from '@/lib/store';
import { PhysicsWindow } from './PhysicsWindow';
import { CursorDrone } from './CursorDrone';
import { wsManager } from '@/lib/websocket';
import { WorkspaceManager } from '../ui/WorkspaceManager';
import * as THREE from 'three';

function CursorTracker() {
  const { camera, raycaster, pointer } = useThree();
  const updateLocalCursor = useStore((state) => state.updateLocalCursor);
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const intersectPoint = useRef(new THREE.Vector3());

  useFrame(() => {
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(planeRef.current, intersectPoint.current);
    
    // Throttle cursor updates
    if (Math.random() > 0.7) {
      updateLocalCursor([
        intersectPoint.current.x,
        intersectPoint.current.y,
        intersectPoint.current.z,
      ]);
    }
  });

  return null;
}

function RemoteCursors() {
  const remoteCursors = useStore((state) => state.remoteCursors);
  const cursorsArray = Array.from(remoteCursors.values());

  // Clean up stale cursors (older than 5 seconds)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      useStore.setState((state) => {
        const newCursors = new Map(state.remoteCursors);
        for (const [id, cursor] of newCursors) {
          if (now - cursor.lastUpdate > 5000) {
            newCursors.delete(id);
          }
        }
        return { remoteCursors: newCursors };
      });
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  return (
    <>
      {cursorsArray.map((cursor) => (
        <CursorDrone
          key={cursor.id}
          position={cursor.position}
          color={cursor.color}
          username={cursor.username}
        />
      ))}
    </>
  );
}

const Scene = () => {
  const windows = useStore((state) => state.windows);
  const username = useStore((state) => state.username);

  useEffect(() => {
    wsManager.connect();
    useStore.getState().loadWorkspaces();

    return () => {
      wsManager.disconnect();
    };
  }, []);

  return (
    <div className="w-full h-full absolute inset-0 bg-black">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />

        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <pointLight position={[-10, -5, -10]} intensity={0.5} color="#8b5cf6" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.5}
          penumbra={0.5}
          intensity={1}
          color="#22d3ee"
        />

        <StarField count={4000} />

        <Environment preset="city" />

        <Physics gravity={[0, 0, 0]} debug={false}>
          {windows.map((win) => (
            <PhysicsWindow
              key={win.id}
              id={win.id}
              position={win.position}
              rotation={win.rotation}
              title={win.title}
              type={win.type}
            >
              {win.content}
            </PhysicsWindow>
          ))}
        </Physics>

        <CursorTracker />
        <RemoteCursors />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={20}
          maxPolarAngle={Math.PI / 1.3}
          minPolarAngle={Math.PI / 4}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Dock */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 px-6 py-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 z-10 shadow-[0_0_40px_rgba(139,92,246,0.2)]">
        <DockItem
          icon="T"
          label="Terminal"
          color="cyan"
          onClick={() =>
            useStore.getState().addWindow('terminal', 'Terminal', 'System initialized. Ready for commands.')
          }
        />
        <DockItem
          icon="N"
          label="Notes"
          color="purple"
          onClick={() =>
            useStore.getState().addWindow('notes', 'Notes', 'New note created.')
          }
        />
        <DockItem
          icon="S"
          label="Settings"
          color="pink"
          onClick={() =>
            useStore.getState().addWindow('settings', 'System', 'Adjust environment parameters.')
          }
        />
      </div>

      {/* HUD */}
      <div className="absolute top-8 left-8 text-white/60 font-mono text-sm pointer-events-none select-none">
        <div className="text-lg font-bold text-white/90 tracking-wider">AETHER OS</div>
        <div className="text-[10px] opacity-50 mt-1">SPATIAL COMPUTING ENVIRONMENT v0.2</div>
        <div className="text-[10px] opacity-40 mt-3">
          Connected as: <span className="text-purple-400">{username}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 right-8 text-white/30 font-mono text-[10px] pointer-events-none select-none text-right max-w-[200px]">
        <div>Drag windows to move</div>
        <div>Throw to apply physics</div>
        <div>Orbit: Right-click + drag</div>
        <div>Zoom: Scroll</div>
      </div>

      <WorkspaceManager />
    </div>
  );
};

interface DockItemProps {
  icon: string;
  label: string;
  color: 'cyan' | 'purple' | 'pink';
  onClick: () => void;
}

const DockItem = ({ icon, label, color, onClick }: DockItemProps) => {
  const colors = {
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    pink: 'from-pink-500 to-pink-600 shadow-pink-500/30',
  };

  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-white font-mono font-bold text-lg shadow-lg hover:shadow-xl`}
      title={label}
      data-testid={`button-dock-${label.toLowerCase()}`}
    >
      {icon}
    </button>
  );
};

export default Scene;
