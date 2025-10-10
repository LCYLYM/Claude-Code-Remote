/**
 * Server Configuration Management
 */

import dotenv from 'dotenv';
import { ServerConfig } from '../types/index.js';

dotenv.config();

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '9999', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  databasePath: process.env.DATABASE_PATH || './data/claude-remote.db',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';

// Validate required configuration
export function validateConfig(): void {
  if (isProduction && config.jwtSecret === 'default-secret-change-in-production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }

  if (config.port < 1024 || config.port > 65535) {
    throw new Error('PORT must be between 1024 and 65535');
  }
}

export default config;
