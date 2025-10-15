/**
 * WebSocket Service
 * Manages real-time communication with the server
 */

import { io, Socket } from 'socket.io-client';
import { WebSocketMessage, TerminalOutput } from '../types';

type EventCallback = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io({
      path: '/socket.io',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connection_status', { connected: true, reconnecting: false });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('connection_status', { connected: false, reconnecting: false });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.emit('connection_status', {
        connected: false,
        reconnecting: this.reconnectAttempts < this.maxReconnectAttempts,
        error: error.message,
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.emit('connection_status', { connected: true, reconnecting: false });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.emit('connection_status', {
        connected: false,
        reconnecting: false,
        error: 'Reconnection failed',
      });
    });

    // Application events
    this.socket.on('terminal_output', (data: TerminalOutput) => {
      this.emit('terminal_output', data);
    });

    this.socket.on('session_joined', (data) => {
      this.emit('session_joined', data);
    });

    this.socket.on('session_activated', (data) => {
      this.emit('session_activated', data);
    });

    this.socket.on('session_deactivated', (data) => {
      this.emit('session_deactivated', data);
    });

    this.socket.on('session_terminated', (data) => {
      this.emit('session_terminated', data);
    });

    this.socket.on('command_executed', (data) => {
      this.emit('command_executed', data);
    });

    this.socket.on('error', (data) => {
      this.emit('error', data);
    });

    this.socket.on('server_shutdown', (data) => {
      this.emit('server_shutdown', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Session methods
  joinSession(sessionId: string, userId: string): void {
    this.socket?.emit('join_session', { sessionId, userId });
  }

  leaveSession(sessionId: string): void {
    this.socket?.emit('leave_session', { sessionId });
  }

  activateSession(sessionId: string): void {
    this.socket?.emit('activate_session', { sessionId });
  }

  deactivateSession(sessionId: string): void {
    this.socket?.emit('deactivate_session', { sessionId });
  }

  // Command execution
  executeCommand(sessionId: string, command: string): void {
    this.socket?.emit('execute_command', { sessionId, command });
  }

  // Terminal input
  sendTerminalInput(sessionId: string, input: string): void {
    this.socket?.emit('terminal_input', { sessionId, input });
  }

  // Terminal resize
  resizeTerminal(sessionId: string, cols: number, rows: number): void {
    this.socket?.emit('terminal_resize', { sessionId, cols, rows });
  }

  // Event subscription
  on(event: string, callback: EventCallback): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(callback);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
    };
  }

  // Emit event to local handlers
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const wsService = new WebSocketService();
export default wsService;
