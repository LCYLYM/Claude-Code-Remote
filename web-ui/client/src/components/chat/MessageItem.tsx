import { Message } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { format } from 'date-fns';
import { User, Bot, Terminal, AlertCircle, Info } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  const getIcon = () => {
    switch (message.type) {
      case 'user':
        return <User size={16} />;
      case 'assistant':
        return <Bot size={16} />;
      case 'terminal':
        return <Terminal size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      case 'system':
        return <Info size={16} />;
      default:
        return null;
    }
  };

  const getMessageClass = () => {
    switch (message.type) {
      case 'user':
        return 'message-user';
      case 'assistant':
        return 'message-assistant';
      case 'terminal':
        return 'bg-slate-950 dark:bg-black text-green-400 rounded-lg px-4 py-3 font-mono text-sm';
      case 'error':
        return 'message-error';
      case 'system':
        return 'message-system';
      default:
        return '';
    }
  };

  const renderContent = () => {
    if (message.type === 'terminal') {
      return (
        <pre className="whitespace-pre-wrap break-words overflow-x-auto">
          <code>{message.content}</code>
        </pre>
      );
    }

    if (message.type === 'user' || message.type === 'system' || message.type === 'error') {
      return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
    }

    // Assistant messages support Markdown
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        className="markdown-content"
      >
        {message.content}
      </ReactMarkdown>
    );
  };

  return (
    <div
      className={`
        flex flex-col space-y-1 animate-fade-in
        ${message.type === 'user' ? 'items-end' : 'items-start'}
      `}
    >
      {/* Message header */}
      <div className="flex items-center space-x-2 px-1">
        {getIcon()}
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {format(new Date(message.timestamp), 'HH:mm:ss')}
        </span>
      </div>

      {/* Message content */}
      <div className={getMessageClass()}>{renderContent()}</div>

      {/* Metadata if available */}
      {message.metadata && Object.keys(message.metadata).length > 0 && (
        <div className="text-xs text-slate-500 dark:text-slate-400 px-1">
          {JSON.stringify(message.metadata)}
        </div>
      )}
    </div>
  );
}
