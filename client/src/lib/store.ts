import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface WindowState {
  id: string;
  title: string;
  content: React.ReactNode;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  type: 'terminal' | 'notes' | 'browser' | 'settings';
}

interface StoreState {
  windows: WindowState[];
  activeWindowId: string | null;
  addWindow: (type: WindowState['type'], title: string, content: React.ReactNode) => void;
  removeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, position: [number, number, number]) => void;
}

export const useStore = create<StoreState>((set) => ({
  windows: [
    {
      id: '1',
      title: 'Welcome to Aether',
      content: 'Welcome to the spatial operating system.',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      type: 'notes',
    }
  ],
  activeWindowId: '1',
  
  addWindow: (type, title, content) => set((state) => {
    const id = uuidv4();
    // Random offset for new windows so they don't stack perfectly
    const offset = (state.windows.length * 0.5) % 3;
    
    return {
      windows: [
        ...state.windows,
        {
          id,
          title,
          content,
          position: [-2 + offset, 0 + (Math.random() * 0.5), 0 + (Math.random() * 0.5)],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          type,
        }
      ],
      activeWindowId: id,
    };
  }),

  removeWindow: (id) => set((state) => ({
    windows: state.windows.filter((w) => w.id !== id),
    activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
  })),

  focusWindow: (id) => set({ activeWindowId: id }),

  updateWindowPosition: (id, position) => set((state) => ({
    windows: state.windows.map((w) => 
      w.id === id ? { ...w, position } : w
    ),
  })),
}));
