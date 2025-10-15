import { useState } from 'react';
import { useAppStore } from '../../store';
import { apiService } from '../../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, MessageSquare, Settings, Moon, Sun, Trash2 } from 'lucide-react';
import CreateSessionModal from './CreateSessionModal';

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const { sessions, currentSessionId, setCurrentSession, theme, setTheme } = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => apiService.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete session');
    },
  });

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this session?')) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (collapsed) {
    return (
      <div className="h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center py-4 space-y-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="New Session"
        >
          <Plus size={20} />
        </button>
        
        <div className="flex-1 w-full flex flex-col items-center space-y-2 overflow-y-auto scrollbar-thin">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setCurrentSession(session.id)}
              className={`
                w-12 h-12 rounded-lg flex items-center justify-center transition-colors
                ${
                  currentSessionId === session.id
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
              title={session.name}
            >
              <MessageSquare size={18} />
            </button>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {showCreateModal && <CreateSessionModal onClose={() => setShowCreateModal(false)} />}
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full btn btn-primary flex items-center justify-center space-x-2"
        >
          <Plus size={18} />
          <span>New Session</span>
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm">No sessions yet</p>
            <p className="text-xs mt-1">Create one to get started</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`
                group relative p-3 rounded-lg cursor-pointer transition-all
                ${
                  currentSessionId === session.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
              onClick={() => setCurrentSession(session.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{session.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`
                        inline-block w-2 h-2 rounded-full
                        ${session.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}
                      `}
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {session.status}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-opacity"
                  title="Delete session"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full btn btn-secondary flex items-center justify-center space-x-2"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
        </button>
        
        <button className="w-full btn btn-secondary flex items-center justify-center space-x-2">
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>

      {showCreateModal && <CreateSessionModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
