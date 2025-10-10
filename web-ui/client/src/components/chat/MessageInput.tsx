import { useState, useRef, KeyboardEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { wsService } from '../../services/websocket';
import { useAppStore } from '../../store';
import toast from 'react-hot-toast';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  sessionId: string;
  disabled?: boolean;
}

export default function MessageInput({ sessionId, disabled = false }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addMessage } = useAppStore();

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Add user message
      const userMessage = await apiService.createMessage(sessionId, 'user', content);
      addMessage(sessionId, userMessage);

      // Execute command via WebSocket
      wsService.executeCommand(sessionId, content);

      return userMessage;
    },
    onSuccess: () => {
      setInput('');
      textareaRef.current?.focus();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate(input.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={disabled ? 'Session is inactive...' : 'Type a command or message...'}
            disabled={disabled || sendMessageMutation.isPending}
            className="input w-full resize-none min-h-[44px] max-h-[200px] pr-12"
            rows={1}
          />
          
          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-xs text-slate-400 dark:text-slate-500">
            {input.length}
          </div>
        </div>

        <button
          type="submit"
          disabled={!input.trim() || disabled || sendMessageMutation.isPending}
          className="btn btn-primary h-[44px] px-4"
        >
          {sendMessageMutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>

      {/* Tips */}
      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        <p>
          <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">
            Enter
          </kbd>{' '}
          to send,{' '}
          <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">
            Shift + Enter
          </kbd>{' '}
          for new line
        </p>
      </div>
    </div>
  );
}
