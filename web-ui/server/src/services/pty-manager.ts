/**
 * PTY Terminal Manager
 * Manages pseudo-terminal instances for each session
 */

import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import { PTYInstance } from '../types/index.js';
import { createChildLogger } from '../utils/logger.js';
import { nanoid } from 'nanoid';

const logger = createChildLogger('PTYManager');

export class PTYManager extends EventEmitter {
  private ptyInstances: Map<string, PTYInstance> = new Map();
  private static instance: PTYManager;

  private constructor() {
    super();
  }

  public static getInstance(): PTYManager {
    if (!PTYManager.instance) {
      PTYManager.instance = new PTYManager();
    }
    return PTYManager.instance;
  }

  /**
   * Create a new PTY instance for a session
   */
  public createPTY(sessionId: string, shell: string = '/bin/bash'): PTYInstance {
    if (this.ptyInstances.has(sessionId)) {
      logger.warn(`PTY already exists for session ${sessionId}, returning existing`);
      return this.ptyInstances.get(sessionId)!;
    }

    const cols = parseInt(process.env.PTY_COLS || '120', 10);
    const rows = parseInt(process.env.PTY_ROWS || '30', 10);

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: process.env.HOME || process.cwd(),
      env: process.env as { [key: string]: string },
    });

    const ptyInstance: PTYInstance = {
      id: nanoid(),
      sessionId,
      pty: ptyProcess,
      pid: ptyProcess.pid,
      status: 'active',
      createdAt: new Date(),
    };

    this.ptyInstances.set(sessionId, ptyInstance);

    // Handle PTY data output
    ptyProcess.onData((data: string) => {
      this.emit('data', { sessionId, data });
    });

    // Handle PTY exit
    ptyProcess.onExit(({ exitCode, signal }) => {
      logger.info(`PTY exited for session ${sessionId}`, { exitCode, signal });
      ptyInstance.status = 'inactive';
      this.emit('exit', { sessionId, exitCode, signal });
    });

    logger.info(`Created PTY for session ${sessionId}`, { pid: ptyProcess.pid });
    return ptyInstance;
  }

  /**
   * Write data to PTY
   */
  public write(sessionId: string, data: string): boolean {
    const ptyInstance = this.ptyInstances.get(sessionId);
    if (!ptyInstance || ptyInstance.status !== 'active') {
      logger.error(`Cannot write to inactive PTY for session ${sessionId}`);
      return false;
    }

    try {
      ptyInstance.pty.write(data);
      return true;
    } catch (error) {
      logger.error(`Error writing to PTY for session ${sessionId}`, { error });
      return false;
    }
  }

  /**
   * Resize PTY
   */
  public resize(sessionId: string, cols: number, rows: number): boolean {
    const ptyInstance = this.ptyInstances.get(sessionId);
    if (!ptyInstance || ptyInstance.status !== 'active') {
      logger.error(`Cannot resize inactive PTY for session ${sessionId}`);
      return false;
    }

    try {
      ptyInstance.pty.resize(cols, rows);
      logger.debug(`Resized PTY for session ${sessionId}`, { cols, rows });
      return true;
    } catch (error) {
      logger.error(`Error resizing PTY for session ${sessionId}`, { error });
      return false;
    }
  }

  /**
   * Kill PTY process
   */
  public kill(sessionId: string): boolean {
    const ptyInstance = this.ptyInstances.get(sessionId);
    if (!ptyInstance) {
      logger.warn(`No PTY found for session ${sessionId}`);
      return false;
    }

    try {
      ptyInstance.pty.kill();
      ptyInstance.status = 'inactive';
      this.ptyInstances.delete(sessionId);
      logger.info(`Killed PTY for session ${sessionId}`);
      return true;
    } catch (error) {
      logger.error(`Error killing PTY for session ${sessionId}`, { error });
      return false;
    }
  }

  /**
   * Get PTY instance by session ID
   */
  public getPTY(sessionId: string): PTYInstance | undefined {
    return this.ptyInstances.get(sessionId);
  }

  /**
   * Get all active PTY instances
   */
  public getAllPTYs(): PTYInstance[] {
    return Array.from(this.ptyInstances.values());
  }

  /**
   * Check if PTY exists for session
   */
  public hasPTY(sessionId: string): boolean {
    return this.ptyInstances.has(sessionId);
  }

  /**
   * Clean up all PTY instances
   */
  public cleanup(): void {
    logger.info('Cleaning up all PTY instances');
    for (const [sessionId, ptyInstance] of this.ptyInstances) {
      try {
        if (ptyInstance.status === 'active') {
          ptyInstance.pty.kill();
        }
      } catch (error) {
        logger.error(`Error killing PTY for session ${sessionId}`, { error });
      }
    }
    this.ptyInstances.clear();
  }
}

export default PTYManager;
