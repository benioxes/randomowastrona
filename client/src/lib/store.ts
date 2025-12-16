import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { workspaceAPI } from './api';
import type { Workspace } from '@shared/schema';

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
  currentWorkspaceId: string | null;
  workspaces: Workspace[];
  
  // Window operations
  addWindow: (type: WindowState['type'], title: string, content: React.ReactNode) => void;
  removeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, position: [number, number, number]) => void;
  
  // Workspace operations
  loadWorkspace: (workspaceId: string) => Promise<void>;
  saveCurrentWorkspace: (name: string) => Promise<void>;
  loadWorkspaces: () => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  autoSaveWorkspace: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  windows: [
    {
      id: '1',
      title: 'Welcome to Aether',
      content: 'Welcome to the spatial operating system. Your workspace is automatically saved.',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      type: 'notes',
    }
  ],
  activeWindowId: '1',
  currentWorkspaceId: null,
  workspaces: [],
  
  addWindow: (type, title, content) => set((state) => {
    const id = uuidv4();
    const offset = (state.windows.length * 0.5) % 3;
    
    const newState = {
      windows: [
        ...state.windows,
        {
          id,
          title,
          content: typeof content === 'string' ? content : '',
          position: [-2 + offset, 0 + (Math.random() * 0.5), 0 + (Math.random() * 0.5)] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [1, 1, 1] as [number, number, number],
          type,
        }
      ],
      activeWindowId: id,
    };
    
    // Auto-save after adding window
    setTimeout(() => get().autoSaveWorkspace(), 500);
    
    return newState;
  }),

  removeWindow: (id) => set((state) => {
    const newState = {
      windows: state.windows.filter((w) => w.id !== id),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    };
    
    setTimeout(() => get().autoSaveWorkspace(), 500);
    
    return newState;
  }),

  focusWindow: (id) => set({ activeWindowId: id }),

  updateWindowPosition: (id, position) => set((state) => {
    const newState = {
      windows: state.windows.map((w) => 
        w.id === id ? { ...w, position } : w
      ),
    };
    
    setTimeout(() => get().autoSaveWorkspace(), 1000);
    
    return newState;
  }),

  loadWorkspace: async (workspaceId: string) => {
    try {
      const workspace = await workspaceAPI.getById(workspaceId);
      set({
        windows: workspace.windowsState.windows.map(w => ({
          ...w,
          content: w.content || '',
        })),
        activeWindowId: workspace.windowsState.activeWindowId,
        currentWorkspaceId: workspace.id,
      });
    } catch (error) {
      console.error('Failed to load workspace:', error);
    }
  },

  saveCurrentWorkspace: async (name: string) => {
    const state = get();
    try {
      const windowsState = {
        windows: state.windows.map(w => ({
          ...w,
          content: typeof w.content === 'string' ? w.content : '',
        })),
        activeWindowId: state.activeWindowId,
      };

      if (state.currentWorkspaceId) {
        await workspaceAPI.update(state.currentWorkspaceId, {
          name,
          windowsState,
        });
      } else {
        const workspace = await workspaceAPI.create({
          name,
          windowsState,
        });
        set({ currentWorkspaceId: workspace.id });
      }
      
      await get().loadWorkspaces();
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  },

  autoSaveWorkspace: async () => {
    const state = get();
    if (!state.currentWorkspaceId) return;

    try {
      const windowsState = {
        windows: state.windows.map(w => ({
          ...w,
          content: typeof w.content === 'string' ? w.content : '',
        })),
        activeWindowId: state.activeWindowId,
      };

      await workspaceAPI.update(state.currentWorkspaceId, {
        windowsState,
      });
    } catch (error) {
      console.error('Failed to auto-save workspace:', error);
    }
  },

  loadWorkspaces: async () => {
    try {
      const workspaces = await workspaceAPI.getAll();
      set({ workspaces });
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  },

  deleteWorkspace: async (id: string) => {
    try {
      await workspaceAPI.delete(id);
      await get().loadWorkspaces();
      
      if (get().currentWorkspaceId === id) {
        set({ currentWorkspaceId: null });
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  },
}));
