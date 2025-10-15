import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store';
import { wsService } from '../../services/websocket';
import MessageItem from './MessageItem';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  sessionId: string;
}

export default function MessageList({ sessionId }: MessageListProps) {
  const { messages } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionMessages = messages.get(sessionId) || [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionMessages]);

  // Listen for new messages from WebSocket
  useEffect(() => {
    const unsubscribe = wsService.on('terminal_output', (data) => {
      if (data.sessionId === sessionId) {
        // Add terminal output as a message
        useAppStore.getState().addMessage(sessionId, {
          id: `terminal-${Date.now()}`,
          sessionId,
          type: 'terminal',
          content: data.data,
          timestamp: new Date(data.timestamp),
        });
      }
    });

    return unsubscribe;
  }, [sessionId]);

  if (sessionMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <div className="text-center">
          <p className="text-lg">No messages yet</p>
          <p className="text-sm mt-2">Send a command to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
      {sessionMessages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
