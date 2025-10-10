/**
 * Client-side Type Definitions
 */

export interface Session {
  id: string;
  userId: string;
  name: string;
  ptyPid?: number;
  status: 'active' | 'inactive' | 'terminated';
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

export interface Message {
  id: string;
  sessionId: string;
  type: 'user' | 'assistant' | 'system' | 'terminal' | 'error';
  content: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface Command {
  id: string;
  sessionId: string;
  command: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  output?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface WebSocketMessage {
  type: 'message' | 'command' | 'terminal_output' | 'status' | 'error';
  payload: any;
  timestamp: Date;
}

export interface TerminalOutput {
  sessionId: string;
  data: string;
  timestamp: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  error?: string;
}

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  command: string;
  category: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  primary: string;
  background: string;
  text: string;
}
