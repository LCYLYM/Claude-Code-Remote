/**
 * Session API Routes
 */

import { Router } from 'express';
import { SessionManager } from '../../services/session-manager.js';
import { ApiResponse } from '../../types/index.js';

const router = Router();
const sessionManager = SessionManager.getInstance();

/**
 * GET /api/sessions
 * Get all sessions for current user
 */
router.get('/', (req, res) => {
  try {
    // TODO: Get userId from JWT token
    const userId = req.query.userId as string || 'default-user';
    
    const sessions = sessionManager.getUserSessions(userId);
    
    const response: ApiResponse = {
      success: true,
      data: sessions,
    };
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_LIST_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/sessions/:id
 * Get session by ID
 */
router.get('/:id', (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found',
        },
      });
    }
    
    const response: ApiResponse = {
      success: true,
      data: session,
    };
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_GET_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/sessions
 * Create new session
 */
router.post('/', (req, res) => {
  try {
    const { userId = 'default-user', name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session name is required',
        },
      });
    }
    
    const session = sessionManager.createSession(userId, name);
    
    const response: ApiResponse = {
      success: true,
      data: session,
      message: 'Session created successfully',
    };
    
    res.status(201).json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_CREATE_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * PUT /api/sessions/:id
 * Update session
 */
router.put('/:id', (req, res) => {
  try {
    const sessionId = req.params.id;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session name is required',
        },
      });
    }
    
    const success = sessionManager.renameSession(sessionId, name);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SESSION_UPDATE_ERROR',
          message: 'Failed to update session',
        },
      });
    }
    
    const response: ApiResponse = {
      success: true,
      data: sessionManager.getSession(sessionId),
      message: 'Session updated successfully',
    };
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_UPDATE_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * DELETE /api/sessions/:id
 * Delete session
 */
router.delete('/:id', (req, res) => {
  try {
    const sessionId = req.params.id;
    const success = sessionManager.deleteSession(sessionId);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SESSION_DELETE_ERROR',
          message: 'Failed to delete session',
        },
      });
    }
    
    const response: ApiResponse = {
      success: true,
      data: null,
      message: 'Session deleted successfully',
    };
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_DELETE_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/sessions/:id/activate
 * Activate session (start PTY)
 */
router.post('/:id/activate', (req, res) => {
  try {
    const sessionId = req.params.id;
    const success = sessionManager.activateSession(sessionId);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SESSION_ACTIVATE_ERROR',
          message: 'Failed to activate session',
        },
      });
    }
    
    const response: ApiResponse = {
      success: true,
      data: sessionManager.getSession(sessionId),
      message: 'Session activated successfully',
    };
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_ACTIVATE_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/sessions/:id/deactivate
 * Deactivate session (stop PTY)
 */
router.post('/:id/deactivate', (req, res) => {
  try {
    const sessionId = req.params.id;
    const success = sessionManager.deactivateSession(sessionId);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SESSION_DEACTIVATE_ERROR',
          message: 'Failed to deactivate session',
        },
      });
    }
    
    const response: ApiResponse = {
      success: true,
      data: sessionManager.getSession(sessionId),
      message: 'Session deactivated successfully',
    };
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_DEACTIVATE_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;
