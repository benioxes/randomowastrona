import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import StarField from './StarField';
import { useStore } from '@/lib/store';
import { SpatialWindow } from './SpatialWindow';

const Scene = () => {
  const windows = useStore((state) => state.windows);

  return (
    <div className="w-full h-full absolute inset-0 bg-black">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        
        <StarField count={3000} />
        
        {/* Environment for reflections on glass */}
        <Environment preset="city" /> 

        <group>
          {windows.map((win) => (
            <SpatialWindow 
              key={win.id}
              id={win.id}
              position={win.position}
              rotation={win.rotation}
              title={win.title}
              type={win.type}
            >
              {win.content}
            </SpatialWindow>
          ))}
        </group>

        {/* Controls to look around, but maybe limit them so we don't get lost */}
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={4} 
          maxDistance={15}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
          enableDamping
        />
      </Canvas>
      
      {/* 2D Overlay UI (HUD) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-6 py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 z-10 pointer-events-auto">
        <DockItem icon="T" label="Terminal" onClick={() => useStore.getState().addWindow('terminal', 'Terminal', 'System Ready...')} />
        <DockItem icon="N" label="Notes" onClick={() => useStore.getState().addWindow('notes', 'Notes', 'New note created.')} />
        <DockItem icon="S" label="Settings" onClick={() => useStore.getState().addWindow('settings', 'System', 'Adjust parameters.')} />
      </div>

      <div className="absolute top-8 left-8 text-white/50 font-mono text-sm pointer-events-none">
        AETHER OS v0.1 <br/>
        <span className="text-[10px] opacity-50">SPATIAL COMPUTING ENV</span>
      </div>
    </div>
  );
};

const DockItem = ({ icon, label, onClick }: { icon: string, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 hover:scale-110 transition-all flex items-center justify-center text-white font-mono font-bold border border-white/5 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
    title={label}
  >
    {icon}
  </button>
);

export default Scene;
