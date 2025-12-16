import type { Workspace, InsertWorkspace } from '@shared/schema';

const API_BASE = '/api';

export const workspaceAPI = {
  getAll: async (): Promise<Workspace[]> => {
    const response = await fetch(`${API_BASE}/workspaces`);
    if (!response.ok) throw new Error('Failed to fetch workspaces');
    return response.json();
  },

  getById: async (id: string): Promise<Workspace> => {
    const response = await fetch(`${API_BASE}/workspaces/${id}`);
    if (!response.ok) throw new Error('Failed to fetch workspace');
    return response.json();
  },

  create: async (data: InsertWorkspace): Promise<Workspace> => {
    const response = await fetch(`${API_BASE}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create workspace');
    return response.json();
  },

  update: async (id: string, data: Partial<InsertWorkspace>): Promise<Workspace> => {
    const response = await fetch(`${API_BASE}/workspaces/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update workspace');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/workspaces/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete workspace');
  },
};
