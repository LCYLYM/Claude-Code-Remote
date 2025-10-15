/**
 * Command Service
 * Handles command execution and management
 */

import { nanoid } from 'nanoid';
import { Command } from '../types/index.js';
import { DatabaseManager } from '../database/index.js';
import { createChildLogger } from '../utils/logger.js';
import { PTYManager } from './pty-manager.js';
import { SessionManager } from './session-manager.js';

const logger = createChildLogger('CommandService');

export class CommandService {
  private db = DatabaseManager.getInstance().getDb();
  private ptyManager = PTYManager.getInstance();
  private sessionManager = SessionManager.getInstance();

  /**
   * Execute a command in a session
   */
  public async executeCommand(sessionId: string, command: string): Promise<Command> {
    const commandId = nanoid();
    const now = new Date();

    // Save command to database
    const stmt = this.db.prepare(`
      INSERT INTO commands (id, session_id, command, status, created_at)
      VALUES (?, ?, ?, 'pending', ?)
    `);

    stmt.run(commandId, sessionId, command, now.toISOString());

    logger.info(`Created command ${commandId} for session ${sessionId}`);

    // Execute command
    const result = await this.processCommand(commandId, sessionId, command);
    return result;
  }

  /**
   * Process command execution
   */
  private async processCommand(
    commandId: string,
    sessionId: string,
    command: string
  ): Promise<Command> {
    try {
      // Update command status to executing
      this.updateCommandStatus(commandId, 'executing', new Date());

      // Ensure PTY is active
      if (!this.ptyManager.hasPTY(sessionId)) {
        const activated = this.sessionManager.activateSession(sessionId);
        if (!activated) {
          throw new Error('Failed to activate session');
        }
      }

      // Write command to PTY
      const success = this.ptyManager.write(sessionId, command + '\n');
      if (!success) {
        throw new Error('Failed to write command to terminal');
      }

      // Mark as completed (actual output will be streamed via WebSocket)
      this.updateCommandStatus(commandId, 'completed', undefined, new Date());

      return this.getCommand(commandId)!;
    } catch (error: any) {
      logger.error(`Error executing command ${commandId}`, { error });
      
      this.updateCommandStatus(
        commandId, 
        'failed', 
        undefined, 
        new Date(),
        error.message
      );

      return this.getCommand(commandId)!;
    }
  }

  /**
   * Get command by ID
   */
  public getCommand(commandId: string): Command | null {
    const stmt = this.db.prepare(`
      SELECT id, session_id, command, status, output, error, 
             started_at, completed_at, created_at
      FROM commands WHERE id = ?
    `);

    const row = stmt.get(commandId) as any;
    if (!row) return null;

    return {
      id: row.id,
      sessionId: row.session_id,
      command: row.command,
      status: row.status,
      output: row.output,
      error: row.error,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
    };
  }

  /**
   * Get commands for a session
   */
  public getSessionCommands(sessionId: string, limit: number = 50): Command[] {
    const stmt = this.db.prepare(`
      SELECT id, session_id, command, status, output, error,
             started_at, completed_at, created_at
      FROM commands 
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(sessionId, limit) as any[];
    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      command: row.command,
      status: row.status,
      output: row.output,
      error: row.error,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Update command status
   */
  private updateCommandStatus(
    commandId: string,
    status: Command['status'],
    startedAt?: Date,
    completedAt?: Date,
    error?: string
  ): void {
    const updates: string[] = ['status = ?'];
    const values: any[] = [status];

    if (startedAt) {
      updates.push('started_at = ?');
      values.push(startedAt.toISOString());
    }

    if (completedAt) {
      updates.push('completed_at = ?');
      values.push(completedAt.toISOString());
    }

    if (error) {
      updates.push('error = ?');
      values.push(error);
    }

    values.push(commandId);

    const stmt = this.db.prepare(`
      UPDATE commands SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
  }

  /**
   * Clean up old commands
   */
  public cleanupOldCommands(maxAgeMs: number = 604800000): number {
    const cutoffDate = new Date(Date.now() - maxAgeMs);
    
    const stmt = this.db.prepare(`
      DELETE FROM commands WHERE created_at < ?
    `);

    const result = stmt.run(cutoffDate.toISOString());
    const deletedCount = result.changes;

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} old commands`);
    }

    return deletedCount;
  }

  /**
   * Get command statistics for a session
   */
  public getSessionStats(sessionId: string): {
    total: number;
    pending: number;
    executing: number;
    completed: number;
    failed: number;
  } {
    const stmt = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM commands
      WHERE session_id = ?
      GROUP BY status
    `);

    const rows = stmt.all(sessionId) as any[];
    
    const stats = {
      total: 0,
      pending: 0,
      executing: 0,
      completed: 0,
      failed: 0,
    };

    rows.forEach(row => {
      stats.total += row.count;
      stats[row.status as keyof typeof stats] = row.count;
    });

    return stats;
  }
}

export default CommandService;
