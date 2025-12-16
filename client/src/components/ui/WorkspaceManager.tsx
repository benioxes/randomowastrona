import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Save, FolderOpen, Trash2, X } from 'lucide-react';

export function WorkspaceManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const { 
    workspaces, 
    loadWorkspaces, 
    saveCurrentWorkspace, 
    loadWorkspace,
    deleteWorkspace,
    currentWorkspaceId 
  } = useStore();

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    await saveCurrentWorkspace(saveName);
    setSaveName('');
    setIsOpen(false);
  };

  const handleLoad = async (id: string) => {
    await loadWorkspace(id);
    setIsOpen(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this workspace?')) {
      await deleteWorkspace(id);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-8 right-8 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-lg border border-white/10 text-white/80 hover:text-white transition-all flex items-center gap-2 text-sm font-mono z-10"
        data-testid="button-workspace-manager"
      >
        <FolderOpen size={16} />
        Workspaces
      </button>
    );
  }

  return (
    <div className="fixed top-8 right-8 w-96 bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 p-6 z-20 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-mono text-lg">Workspaces</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/50 hover:text-white transition-colors"
          data-testid="button-close-workspace-manager"
        >
          <X size={20} />
        </button>
      </div>

      {/* Save Section */}
      <div className="mb-6 pb-6 border-b border-white/10">
        <label className="text-white/60 text-xs font-mono mb-2 block uppercase tracking-wider">
          Save Current Layout
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Workspace name..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono placeholder-white/30 focus:outline-none focus:border-purple-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            data-testid="input-workspace-name"
          />
          <button
            onClick={handleSave}
            disabled={!saveName.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg transition-colors flex items-center gap-2"
            data-testid="button-save-workspace"
          >
            <Save size={16} />
          </button>
        </div>
      </div>

      {/* Load Section */}
      <div>
        <label className="text-white/60 text-xs font-mono mb-3 block uppercase tracking-wider">
          Saved Workspaces
        </label>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {workspaces.length === 0 ? (
            <p className="text-white/30 text-sm font-mono italic" data-testid="text-no-workspaces">
              No saved workspaces yet
            </p>
          ) : (
            workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className={`group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  workspace.id === currentWorkspaceId
                    ? 'bg-purple-600/20 border-purple-500/50'
                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
                onClick={() => handleLoad(workspace.id)}
                data-testid={`workspace-item-${workspace.id}`}
              >
                <div className="flex-1">
                  <p className="text-white font-mono text-sm" data-testid={`text-workspace-name-${workspace.id}`}>
                    {workspace.name}
                  </p>
                  <p className="text-white/40 text-xs font-mono mt-1">
                    {workspace.windowsState.windows.length} windows
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(workspace.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-red-400 transition-all p-2"
                  data-testid={`button-delete-workspace-${workspace.id}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
