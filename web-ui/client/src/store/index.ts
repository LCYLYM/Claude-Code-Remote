/**
 * Global State Store using Zustand
 */

import { create } from 'zustand';
import { Session, Message, ConnectionStatus } from '../types';

interface AppState {
  // Sessions
  sessions: Session[];
  currentSessionId: string | null;
  
  // Messages
  messages: Map<string, Message[]>;
  
  // Connection
  connectionStatus: ConnectionStatus;
  
  // UI State
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  
  // Actions
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  removeSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string | null) => void;
  
  addMessage: (sessionId: string, message: Message) => void;
  setMessages: (sessionId: string, messages: Message[]) => void;
  clearMessages: (sessionId: string) => void;
  
  setConnectionStatus: (status: ConnectionStatus) => void;
  
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  sessions: [],
  currentSessionId: null,
  messages: new Map(),
  connectionStatus: {
    connected: false,
    reconnecting: false,
  },
  sidebarCollapsed: false,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'dark',
  
  // Session actions
  setSessions: (sessions) => set({ sessions }),
  
  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session],
    })),
  
  updateSession: (sessionId, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    })),
  
  removeSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      currentSessionId:
        state.currentSessionId === sessionId ? null : state.currentSessionId,
    })),
  
  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
  
  // Message actions
  addMessage: (sessionId, message) =>
    set((state) => {
      const newMessages = new Map(state.messages);
      const sessionMessages = newMessages.get(sessionId) || [];
      newMessages.set(sessionId, [...sessionMessages, message]);
      return { messages: newMessages };
    }),
  
  setMessages: (sessionId, messages) =>
    set((state) => {
      const newMessages = new Map(state.messages);
      newMessages.set(sessionId, messages);
      return { messages: newMessages };
    }),
  
  clearMessages: (sessionId) =>
    set((state) => {
      const newMessages = new Map(state.messages);
      newMessages.delete(sessionId);
      return { messages: newMessages };
    }),
  
  // Connection actions
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  // UI actions
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
    
    // Update DOM
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));

// Initialize theme
const theme = useAppStore.getState().theme;
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
}

export default useAppStore;
