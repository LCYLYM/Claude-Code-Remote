/**
 * Core Type Definitions for Claude Code Remote Web Server
 */

export interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  jwtSecret: string;
  databasePath: string;
  logLevel: string;
  corsOrigin: string;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface PTYInstance {
  id: string;
  sessionId: string;
  pty: any; // node-pty IPty
  pid: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface WebSocketMessage {
  type: 'message' | 'command' | 'terminal_output' | 'status' | 'error';
  payload: any;
  timestamp: Date;
}

export interface CommandRequest {
  sessionId: string;
  command: string;
  interactive?: boolean;
}

export interface TerminalOutput {
  sessionId: string;
  data: string;
  timestamp: Date;
}

export interface SessionStatus {
  sessionId: string;
  status: 'active' | 'inactive' | 'terminated';
  ptyPid?: number;
  claudeCodeDetected: boolean;
  lastActivityAt: Date;
}

export interface FileInfo {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: Date;
}

export interface MCPCommand {
  type: 'list' | 'add' | 'remove' | 'inspect';
  context?: string;
  files?: string[];
}

export interface CompareCommand {
  file1: string;
  file2: string;
  diffType?: 'unified' | 'side-by-side';
}

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  command: string;
  category: string;
  userId: string;
  createdAt: Date;
}

export interface PerformanceMetrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  activeSessions: number;
  commandsExecuted: number;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
