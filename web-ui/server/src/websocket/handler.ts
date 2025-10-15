/**
 * WebSocket Handler
 * Manages real-time communication between client and server
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createChildLogger } from '../utils/logger.js';
import { PTYManager } from '../services/pty-manager.js';
import { SessionManager } from '../services/session-manager.js';
import { CommandService } from '../services/command-service.js';

const logger = createChildLogger('WebSocketHandler');

export class WebSocketHandler {
  private io: SocketIOServer;
  private ptyManager = PTYManager.getInstance();
  private sessionManager = SessionManager.getInstance();
  private commandService: CommandService;
  private connectedClients: Map<string, Socket> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
      },
      pingInterval: parseInt(process.env.WS_PING_INTERVAL || '30000', 10),
      pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '5000', 10),
    });

    this.commandService = new CommandService();
    this.setupEventHandlers();
    this.setupPTYEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const clientId = socket.id;
      logger.info(`Client connected: ${clientId}`);
      this.connectedClients.set(clientId, socket);

      // Handle session join
      socket.on('join_session', (data: { sessionId: string; userId: string }) => {
        this.handleJoinSession(socket, data);
      });

      // Handle session leave
      socket.on('leave_session', (data: { sessionId: string }) => {
        this.handleLeaveSession(socket, data);
      });

      // Handle command execution
      socket.on('execute_command', async (data: { sessionId: string; command: string }) => {
        await this.handleExecuteCommand(socket, data);
      });

      // Handle PTY input
      socket.on('terminal_input', (data: { sessionId: string; input: string }) => {
        this.handleTerminalInput(socket, data);
      });

      // Handle PTY resize
      socket.on('terminal_resize', (data: { sessionId: string; cols: number; rows: number }) => {
        this.handleTerminalResize(socket, data);
      });

      // Handle session activation
      socket.on('activate_session', (data: { sessionId: string }) => {
        this.handleActivateSession(socket, data);
      });

      // Handle session deactivation
      socket.on('deactivate_session', (data: { sessionId: string }) => {
        this.handleDeactivateSession(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${clientId}`);
        this.connectedClients.delete(clientId);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for client ${clientId}`, { error });
      });
    });
  }

  private setupPTYEventHandlers(): void {
    // Forward PTY output to connected clients
    this.ptyManager.on('data', ({ sessionId, data }) => {
      this.io.to(sessionId).emit('terminal_output', { sessionId, data });
    });

    // Handle PTY exit
    this.ptyManager.on('exit', ({ sessionId, exitCode, signal }) => {
      logger.info(`PTY exited for session ${sessionId}`, { exitCode, signal });
      this.sessionManager.updateSessionStatus(sessionId, 'inactive');
      this.io.to(sessionId).emit('session_terminated', { sessionId, exitCode, signal });
    });
  }

  private handleJoinSession(socket: Socket, data: { sessionId: string; userId: string }): void {
    const { sessionId, userId } = data;
    
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    if (session.userId !== userId) {
      socket.emit('error', { message: 'Unauthorized access to session' });
      return;
    }

    socket.join(sessionId);
    logger.info(`Client ${socket.id} joined session ${sessionId}`);
    
    socket.emit('session_joined', { 
      sessionId, 
      session: {
        ...session,
        hasActivePTY: this.ptyManager.hasPTY(sessionId),
      }
    });
  }

  private handleLeaveSession(socket: Socket, data: { sessionId: string }): void {
    const { sessionId } = data;
    socket.leave(sessionId);
    logger.info(`Client ${socket.id} left session ${sessionId}`);
  }

  private async handleExecuteCommand(
    socket: Socket, 
    data: { sessionId: string; command: string }
  ): Promise<void> {
    const { sessionId, command } = data;

    try {
      const result = await this.commandService.executeCommand(sessionId, command);
      socket.emit('command_executed', result);
      
      // Update session activity
      this.sessionManager.updateSessionActivity(sessionId);
    } catch (error: any) {
      logger.error(`Error executing command for session ${sessionId}`, { error });
      socket.emit('error', { message: error.message });
    }
  }

  private handleTerminalInput(socket: Socket, data: { sessionId: string; input: string }): void {
    const { sessionId, input } = data;
    
    const success = this.ptyManager.write(sessionId, input);
    if (!success) {
      socket.emit('error', { message: 'Failed to write to terminal' });
    } else {
      this.sessionManager.updateSessionActivity(sessionId);
    }
  }

  private handleTerminalResize(
    socket: Socket, 
    data: { sessionId: string; cols: number; rows: number }
  ): void {
    const { sessionId, cols, rows } = data;
    
    const success = this.ptyManager.resize(sessionId, cols, rows);
    if (!success) {
      socket.emit('error', { message: 'Failed to resize terminal' });
    }
  }

  private handleActivateSession(socket: Socket, data: { sessionId: string }): void {
    const { sessionId } = data;
    
    const success = this.sessionManager.activateSession(sessionId);
    if (success) {
      this.io.to(sessionId).emit('session_activated', { sessionId });
    } else {
      socket.emit('error', { message: 'Failed to activate session' });
    }
  }

  private handleDeactivateSession(socket: Socket, data: { sessionId: string }): void {
    const { sessionId } = data;
    
    const success = this.sessionManager.deactivateSession(sessionId);
    if (success) {
      this.io.to(sessionId).emit('session_deactivated', { sessionId });
    } else {
      socket.emit('error', { message: 'Failed to deactivate session' });
    }
  }

  /**
   * Broadcast message to all clients in a session
   */
  public broadcastToSession(sessionId: string, event: string, data: any): void {
    this.io.to(sessionId).emit(event, data);
  }

  /**
   * Get connected clients count
   */
  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Shutdown WebSocket server gracefully
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket server');
    
    // Notify all clients
    this.io.emit('server_shutdown', { message: 'Server is shutting down' });
    
    // Close all connections
    await new Promise<void>((resolve) => {
      this.io.close(() => {
        logger.info('WebSocket server closed');
        resolve();
      });
    });
  }
}

export default WebSocketHandler;
