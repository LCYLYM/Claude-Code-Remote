import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from './components/layout/MainLayout';
import { apiService } from './services/api';
import { wsService } from './services/websocket';
import { useAppStore } from './store';
import toast from 'react-hot-toast';

function App() {
  const { setSessions, setConnectionStatus, setCurrentSession } = useAppStore();

  // Fetch sessions on mount
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => apiService.getSessions('default-user'),
  });

  useEffect(() => {
    if (sessions) {
      setSessions(sessions);
      // Set first session as current if none selected
      if (sessions.length > 0 && !useAppStore.getState().currentSessionId) {
        setCurrentSession(sessions[0].id);
      }
    }
  }, [sessions, setSessions, setCurrentSession]);

  // Connect to WebSocket
  useEffect(() => {
    wsService.connect();

    const unsubscribeStatus = wsService.on('connection_status', (status) => {
      setConnectionStatus(status);
      
      if (status.connected) {
        toast.success('Connected to server');
      } else if (status.error && !status.reconnecting) {
        toast.error(`Connection error: ${status.error}`);
      }
    });

    const unsubscribeError = wsService.on('error', (data) => {
      toast.error(data.message || 'An error occurred');
    });

    const unsubscribeShutdown = wsService.on('server_shutdown', (data) => {
      toast.error(data.message || 'Server is shutting down');
    });

    return () => {
      unsubscribeStatus();
      unsubscribeError();
      unsubscribeShutdown();
      wsService.disconnect();
    };
  }, [setConnectionStatus]);

  return <MainLayout />;
}

export default App;
