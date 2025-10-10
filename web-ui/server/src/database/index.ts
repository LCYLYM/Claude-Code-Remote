/**
 * Database Connection and Schema Management
 */

import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export class DatabaseManager {
  private db: Database.Database;
  private static instance: DatabaseManager;

  private constructor() {
    const dbDir = dirname(config.databasePath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(config.databasePath);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private initSchema(): void {
    logger.info('Initializing database schema');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        pty_pid INTEGER,
        status TEXT NOT NULL DEFAULT 'inactive',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS commands (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        command TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        output TEXT,
        error TEXT,
        started_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS command_templates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        command TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_commands_session_id ON commands(session_id);
      CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
      CREATE INDEX IF NOT EXISTS idx_command_templates_user_id ON command_templates(user_id);
    `);

    logger.info('Database schema initialized successfully');
  }

  public getDb(): Database.Database {
    return this.db;
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      logger.info('Database connection closed');
    }
  }
}

export default DatabaseManager;
