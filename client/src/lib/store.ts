import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { workspaceAPI } from './api';
import { wsManager } from './websocket';
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

export interface RemoteCursor {
  id: string;
  username: string;
  color: string;
  position: [number, number, number];
  lastUpdate: number;
}

interface StoreState {
  windows: WindowState[];
  activeWindowId: string | null;
  currentWorkspaceId: string | null;
  workspaces: Workspace[];
  
  // Multiplayer state
  userId: string;
  username: string;
  userColor: string;
  remoteCursors: Map<string, RemoteCursor>;
  
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
  
  // Multiplayer operations
  setUsername: (username: string) => void;
  updateLocalCursor: (position: [number, number, number]) => void;
  handleRemoteMessage: (data: any) => void;
  broadcastWindowMove: (windowId: string, position: [number, number, number]) => void;
  broadcastWindowAction: (action: 'add' | 'remove', window?: WindowState) => void;
}

// Generate random user color
const generateUserColor = () => {
  const colors = ['#8b5cf6', '#22d3ee', '#f472b6', '#4ade80', '#facc15', '#fb923c'];
  return colors[Math.floor(Math.random() * colors.length)];
};

let saveTimeout: NodeJS.Timeout | null = null;

export const useStore = create<StoreState>((set, get) => ({
  windows: [
    {
      id: '1',
      title: 'Welcome to Aether',
      content: 'A collaborative 3D spatial operating system. Drag windows to move them. Throw them to see physics! Open workspaces panel to save your layout.',
      position: [0, 0.5, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      type: 'notes',
    }
  ],
  activeWindowId: '1',
  currentWorkspaceId: null,
  workspaces: [],
  
  // Multiplayer
  userId: uuidv4(),
  username: `User_${Math.floor(Math.random() * 1000)}`,
  userColor: generateUserColor(),
  remoteCursors: new Map(),
  
  addWindow: (type, title, content) => {
    const id = uuidv4();
    const state = get();
    const offset = (state.windows.length * 0.8) % 4;
    
    const newWindow: WindowState = {
      id,
      title,
      content: typeof content === 'string' ? content : '',
      position: [-2 + offset, 0.5 + (Math.random() * 0.5 - 0.25), Math.random() * 0.5 - 0.25],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      type,
    };
    
    set((state) => ({
      windows: [...state.windows, newWindow],
      activeWindowId: id,
    }));
    
    // Broadcast to other users
    get().broadcastWindowAction('add', newWindow);
    
    // Throttled auto-save
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().autoSaveWorkspace(), 2000);
  },

  removeWindow: (id) => {
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    }));
    
    get().broadcastWindowAction('remove', { id } as WindowState);
    
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().autoSaveWorkspace(), 2000);
  },

  focusWindow: (id) => set({ activeWindowId: id }),

  updateWindowPosition: (id, position) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, position } : w
      ),
    }));
  },

  broadcastWindowMove: (windowId, position) => {
    const state = get();
    wsManager.send({
      type: 'window_move',
      userId: state.userId,
      windowId,
      position,
    });
  },

  broadcastWindowAction: (action, window) => {
    const state = get();
    wsManager.send({
      type: 'window_action',
      userId: state.userId,
      action,
      window: window ? {
        id: window.id,
        title: window.title,
        content: typeof window.content === 'string' ? window.content : '',
        position: window.position,
        rotation: window.rotation,
        scale: window.scale,
        type: window.type,
      } : undefined,
    });
  },

  setUsername: (username) => set({ username }),

  updateLocalCursor: (position) => {
    const state = get();
    wsManager.send({
      type: 'cursor',
      userId: state.userId,
      username: state.username,
      color: state.userColor,
      position,
    });
  },

  handleRemoteMessage: (data) => {
    const state = get();
    
    if (data.userId === state.userId) return; // Ignore own messages

    switch (data.type) {
      case 'cursor':
        set((state) => {
          const newCursors = new Map(state.remoteCursors);
          newCursors.set(data.userId, {
            id: data.userId,
            username: data.username,
            color: data.color,
            position: data.position,
            lastUpdate: Date.now(),
          });
          return { remoteCursors: newCursors };
        });
        break;

      case 'window_move':
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === data.windowId ? { ...w, position: data.position } : w
          ),
        }));
        break;

      case 'window_action':
        if (data.action === 'add' && data.window) {
          set((state) => ({
            windows: [...state.windows, data.window],
          }));
        } else if (data.action === 'remove' && data.window) {
          set((state) => ({
            windows: state.windows.filter((w) => w.id !== data.window.id),
          }));
        }
        break;
    }
  },

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

// Initialize WebSocket message handler
wsManager.addHandler((data) => {
  useStore.getState().handleRemoteMessage(data);
});
