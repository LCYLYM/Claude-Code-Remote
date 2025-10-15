import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../../store';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { wsService } from '../../services/websocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TerminalView from '../terminal/TerminalView';
import { Play, Square, Terminal as TerminalIcon, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatPanel() {
  const { currentSessionId, addMessage, setMessages } = useAppStore();
  const [viewMode, setViewMode] = useState<'chat' | 'terminal'>('chat');
  const [sessionActive, setSessionActive] = useState(false);

  // Fetch session details
  const { data: session } = useQuery({
    queryKey: ['session', currentSessionId],
    queryFn: () => (currentSessionId ? apiService.getSession(currentSessionId) : null),
    enabled: !!currentSessionId,
  });

  // Fetch messages
  const { data: messages } = useQuery({
    queryKey: ['messages', currentSessionId],
    queryFn: () => (currentSessionId ? apiService.getMessages(currentSessionId) : []),
    enabled: !!currentSessionId,
  });

  useEffect(() => {
    if (messages && currentSessionId) {
      setMessages(currentSessionId, messages);
    }
  }, [messages, currentSessionId, setMessages]);

  useEffect(() => {
    if (session) {
      setSessionActive(session.status === 'active');
    }
  }, [session]);

  // Join session on mount
  useEffect(() => {
    if (currentSessionId) {
      wsService.joinSession(currentSessionId, 'default-user');

      const unsubscribe = wsService.on('session_activated', (data) => {
        if (data.sessionId === currentSessionId) {
          setSessionActive(true);
          toast.success('Session activated');
        }
      });

      const unsubscribeDeactivated = wsService.on('session_deactivated', (data) => {
        if (data.sessionId === currentSessionId) {
          setSessionActive(false);
          toast.info('Session deactivated');
        }
      });

      return () => {
        wsService.leaveSession(currentSessionId);
        unsubscribe();
        unsubscribeDeactivated();
      };
    }
  }, [currentSessionId]);

  const handleActivateSession = async () => {
    if (!currentSessionId) return;

    try {
      if (sessionActive) {
        await apiService.deactivateSession(currentSessionId);
        setSessionActive(false);
        toast.success('Session deactivated');
      } else {
        await apiService.activateSession(currentSessionId);
        setSessionActive(true);
        toast.success('Session activated');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle session');
    }
  };

  if (!currentSessionId) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
        <div className="text-center">
          <MessageSquare size={64} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No session selected</p>
          <p className="text-sm mt-2">Create or select a session to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <h2 className="font-semibold text-lg">{session?.name}</h2>
          <span
            className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${
                sessionActive
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }
            `}
          >
            {sessionActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('chat')}
              className={`
                px-3 py-1 rounded-md text-sm font-medium transition-colors
                ${
                  viewMode === 'chat'
                    ? 'bg-white dark:bg-slate-600 shadow-sm'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-600'
                }
              `}
            >
              <MessageSquare size={16} className="inline mr-1" />
              Chat
            </button>
            <button
              onClick={() => setViewMode('terminal')}
              className={`
                px-3 py-1 rounded-md text-sm font-medium transition-colors
                ${
                  viewMode === 'terminal'
                    ? 'bg-white dark:bg-slate-600 shadow-sm'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-600'
                }
              `}
            >
              <TerminalIcon size={16} className="inline mr-1" />
              Terminal
            </button>
          </div>

          {/* Activate/Deactivate button */}
          <button
            onClick={handleActivateSession}
            className={`
              btn flex items-center space-x-2
              ${sessionActive ? 'btn-danger' : 'btn-primary'}
            `}
          >
            {sessionActive ? (
              <>
                <Square size={16} />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Start</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'chat' ? (
          <div className="h-full flex flex-col">
            <MessageList sessionId={currentSessionId} />
            <MessageInput sessionId={currentSessionId} disabled={!sessionActive} />
          </div>
        ) : (
          <TerminalView sessionId={currentSessionId} active={sessionActive} />
        )}
      </div>
    </div>
  );
}
