/**
 * Claude Code Remote Web Server
 * Main entry point
 */

import express, { Express } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config, validateConfig } from './config/index.js';
import { logger } from './utils/logger.js';
import { DatabaseManager } from './database/index.js';
import { WebSocketHandler } from './websocket/handler.js';
import { PTYManager } from './services/pty-manager.js';
import { SessionManager } from './services/session-manager.js';
import apiRouter from './api/routes/index.js';

class Server {
  private app: Express;
  private httpServer;
  private wsHandler: WebSocketHandler;
  private ptyManager = PTYManager.getInstance();
  private sessionManager = SessionManager.getInstance();

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.wsHandler = new WebSocketHandler(this.httpServer);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Allow WebSocket connections
    }));

    // CORS
    this.app.use(cors({
      origin: config.corsOrigin,
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        connections: this.wsHandler.getConnectedClientsCount(),
      });
    });

    // API routes
    this.app.use('/api', apiRouter);

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
        },
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', { 
        error: err.message,
        stack: err.stack,
        path: req.path,
      });

      res.status(err.status || 500).json({
        success: false,
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: config.nodeEnv === 'production' 
            ? 'Internal server error' 
            : err.message,
        },
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error });
      this.shutdown(1);
    });

    // Handle termination signals
    process.on('SIGTERM', () => this.shutdown(0));
    process.on('SIGINT', () => this.shutdown(0));
  }

  public async start(): Promise<void> {
    try {
      // Validate configuration
      validateConfig();

      // Initialize database
      DatabaseManager.getInstance();

      // Start HTTP server
      await new Promise<void>((resolve) => {
        this.httpServer.listen(config.port, config.host, () => {
          logger.info(`Server started on ${config.host}:${config.port}`, {
            nodeEnv: config.nodeEnv,
          });
          resolve();
        });
      });

      // Start cleanup tasks
      this.startCleanupTasks();

      logger.info('Claude Code Remote Web Server is ready');
    } catch (error) {
      logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }

  private startCleanupTasks(): void {
    // Clean up inactive sessions every hour
    setInterval(() => {
      try {
        const count = this.sessionManager.cleanupInactiveSessions();
        if (count > 0) {
          logger.info(`Cleanup task: Removed ${count} inactive sessions`);
        }
      } catch (error) {
        logger.error('Error in session cleanup task', { error });
      }
    }, 3600000); // 1 hour
  }

  private async shutdown(exitCode: number): Promise<void> {
    logger.info('Shutting down server gracefully');

    try {
      // Close WebSocket connections
      await this.wsHandler.shutdown();

      // Close HTTP server
      await new Promise<void>((resolve) => {
        this.httpServer.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });

      // Clean up PTY instances
      this.ptyManager.cleanup();

      // Close database
      DatabaseManager.getInstance().close();

      logger.info('Server shutdown complete');
      process.exit(exitCode);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  }
}

// Start server
const server = new Server();
server.start();

export default Server;
