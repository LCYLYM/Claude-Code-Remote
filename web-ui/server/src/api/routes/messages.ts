/**
 * Message API Routes
 */

import { Router } from 'express';
import { DatabaseManager } from '../../database/index.js';
import { ApiResponse, Message } from '../../types/index.js';
import { nanoid } from 'nanoid';

const router = Router();
const db = DatabaseManager.getInstance().getDb();

/**
 * GET /api/messages
 * Get messages for a session
 */
router.get('/', (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    const limit = parseInt(req.query.limit as string || '100', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'sessionId is required',
        },
      });
    }
    
    const stmt = db.prepare(`
      SELECT id, session_id, type, content, metadata, timestamp
      FROM messages
      WHERE session_id = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(sessionId, limit, offset) as any[];
    
    const messages: Message[] = rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      type: row.type,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      timestamp: new Date(row.timestamp),
    }));
    
    const response: ApiResponse = {
      success: true,
      data: messages,
    };
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'MESSAGE_LIST_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/messages
 * Create a new message
 */
router.post('/', (req, res) => {
  try {
    const { sessionId, type, content, metadata } = req.body;
    
    if (!sessionId || !type || !content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'sessionId, type, and content are required',
        },
      });
    }
    
    const messageId = nanoid();
    const timestamp = new Date();
    
    const stmt = db.prepare(`
      INSERT INTO messages (id, session_id, type, content, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      messageId,
      sessionId,
      type,
      content,
      metadata ? JSON.stringify(metadata) : null,
      timestamp.toISOString()
    );
    
    const message: Message = {
      id: messageId,
      sessionId,
      type,
      content,
      metadata,
      timestamp,
    };
    
    const response: ApiResponse = {
      success: true,
      data: message,
      message: 'Message created successfully',
    };
    
    res.status(201).json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'MESSAGE_CREATE_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * DELETE /api/messages/:id
 * Delete a message
 */
router.delete('/:id', (req, res) => {
  try {
    const messageId = req.params.id;
    
    const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
    const result = stmt.run(messageId);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found',
        },
      });
    }
    
    const response: ApiResponse = {
      success: true,
      data: null,
      message: 'Message deleted successfully',
    };
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'MESSAGE_DELETE_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;
