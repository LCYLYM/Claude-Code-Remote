import { useAppStore } from '../../store';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function ConnectionIndicator() {
  const { connectionStatus } = useAppStore();

  if (connectionStatus.connected) {
    return (
      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
        <Wifi size={18} />
        <span className="text-sm font-medium">Connected</span>
      </div>
    );
  }

  if (connectionStatus.reconnecting) {
    return (
      <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
        <RefreshCw size={18} className="animate-spin" />
        <span className="text-sm font-medium">Reconnecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
      <WifiOff size={18} />
      <span className="text-sm font-medium">Disconnected</span>
    </div>
  );
}
