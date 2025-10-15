/**
 * Session Manager Service
 * Manages Claude Code sessions and their lifecycle
 */

import { nanoid } from 'nanoid';
import { Session } from '../types/index.js';
import { DatabaseManager } from '../database/index.js';
import { createChildLogger } from '../utils/logger.js';
import { PTYManager } from './pty-manager.js';

const logger = createChildLogger('SessionManager');

export class SessionManager {
  private db = DatabaseManager.getInstance().getDb();
  private ptyManager = PTYManager.getInstance();
  private static instance: SessionManager;

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Create a new session
   */
  public createSession(userId: string, name: string): Session {
    const sessionId = nanoid();
    const now = new Date();

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, user_id, name, status, created_at, updated_at, last_activity_at)
      VALUES (?, ?, ?, 'inactive', ?, ?, ?)
    `);

    stmt.run(sessionId, userId, name, now.toISOString(), now.toISOString(), now.toISOString());

    logger.info(`Created session ${sessionId} for user ${userId}`);

    return {
      id: sessionId,
      userId,
      name,
      status: 'inactive',
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    };
  }

  /**
   * Get session by ID
   */
  public getSession(sessionId: string): Session | null {
    const stmt = this.db.prepare(`
      SELECT id, user_id, name, pty_pid, status, created_at, updated_at, last_activity_at
      FROM sessions WHERE id = ?
    `);

    const row = stmt.get(sessionId) as any;
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      ptyPid: row.pty_pid,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastActivityAt: new Date(row.last_activity_at),
    };
  }

  /**
   * Get all sessions for a user
   */
  public getUserSessions(userId: string): Session[] {
    const stmt = this.db.prepare(`
      SELECT id, user_id, name, pty_pid, status, created_at, updated_at, last_activity_at
      FROM sessions WHERE user_id = ?
      ORDER BY last_activity_at DESC
    `);

    const rows = stmt.all(userId) as any[];
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      ptyPid: row.pty_pid,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastActivityAt: new Date(row.last_activity_at),
    }));
  }

  /**
   * Update session status
   */
  public updateSessionStatus(sessionId: string, status: Session['status']): void {
    const stmt = this.db.prepare(`
      UPDATE sessions 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(status, new Date().toISOString(), sessionId);
    logger.info(`Updated session ${sessionId} status to ${status}`);
  }

  /**
   * Update session activity timestamp
   */
  public updateSessionActivity(sessionId: string): void {
    const stmt = this.db.prepare(`
      UPDATE sessions 
      SET last_activity_at = ?
      WHERE id = ?
    `);

    stmt.run(new Date().toISOString(), sessionId);
  }

  /**
   * Activate session (start PTY)
   */
  public activateSession(sessionId: string): boolean {
    try {
      const session = this.getSession(sessionId);
      if (!session) {
        logger.error(`Session ${sessionId} not found`);
        return false;
      }

      if (this.ptyManager.hasPTY(sessionId)) {
        logger.warn(`PTY already active for session ${sessionId}`);
        return true;
      }

      const ptyInstance = this.ptyManager.createPTY(sessionId);

      const stmt = this.db.prepare(`
        UPDATE sessions 
        SET status = 'active', pty_pid = ?, updated_at = ?
        WHERE id = ?
      `);

      stmt.run(ptyInstance.pid, new Date().toISOString(), sessionId);
      logger.info(`Activated session ${sessionId} with PTY pid ${ptyInstance.pid}`);

      return true;
    } catch (error) {
      logger.error(`Error activating session ${sessionId}`, { error });
      return false;
    }
  }

  /**
   * Deactivate session (stop PTY)
   */
  public deactivateSession(sessionId: string): boolean {
    try {
      this.ptyManager.kill(sessionId);
      
      const stmt = this.db.prepare(`
        UPDATE sessions 
        SET status = 'inactive', pty_pid = NULL, updated_at = ?
        WHERE id = ?
      `);

      stmt.run(new Date().toISOString(), sessionId);
      logger.info(`Deactivated session ${sessionId}`);

      return true;
    } catch (error) {
      logger.error(`Error deactivating session ${sessionId}`, { error });
      return false;
    }
  }

  /**
   * Delete session
   */
  public deleteSession(sessionId: string): boolean {
    try {
      this.ptyManager.kill(sessionId);

      const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
      stmt.run(sessionId);

      logger.info(`Deleted session ${sessionId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting session ${sessionId}`, { error });
      return false;
    }
  }

  /**
   * Rename session
   */
  public renameSession(sessionId: string, newName: string): boolean {
    try {
      const stmt = this.db.prepare(`
        UPDATE sessions 
        SET name = ?, updated_at = ?
        WHERE id = ?
      `);

      stmt.run(newName, new Date().toISOString(), sessionId);
      logger.info(`Renamed session ${sessionId} to ${newName}`);
      return true;
    } catch (error) {
      logger.error(`Error renaming session ${sessionId}`, { error });
      return false;
    }
  }

  /**
   * Clean up inactive sessions
   */
  public cleanupInactiveSessions(maxAgeMs: number = 86400000): number {
    const cutoffDate = new Date(Date.now() - maxAgeMs);
    
    const stmt = this.db.prepare(`
      DELETE FROM sessions 
      WHERE status = 'inactive' AND last_activity_at < ?
    `);

    const result = stmt.run(cutoffDate.toISOString());
    const deletedCount = result.changes;

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} inactive sessions`);
    }

    return deletedCount;
  }
}

export default SessionManager;
