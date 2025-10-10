/**
 * Command API Routes
 */

import { Router } from 'express';
import { CommandService } from '../../services/command-service.js';
import { ApiResponse } from '../../types/index.js';

const router = Router();
const commandService = new CommandService();

/**
 * GET /api/commands
 * Get commands for a session
 */
router.get('/', (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    const limit = parseInt(req.query.limit as string || '50', 10);
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'sessionId is required',
        },
      });
    }
    
    const commands = commandService.getSessionCommands(sessionId, limit);
    
    const response: ApiResponse = {
      success: true,
      data: commands,
    };
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'COMMAND_LIST_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/commands/:id
 * Get command by ID
 */
router.get('/:id', (req, res) => {
  try {
    const commandId = req.params.id;
    const command = commandService.getCommand(commandId);
    
    if (!command) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMMAND_NOT_FOUND',
          message: 'Command not found',
        },
      });
    }
    
    const response: ApiResponse = {
      success: true,
      data: command,
    };
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'COMMAND_GET_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/commands
 * Execute a command
 */
router.post('/', async (req, res) => {
  try {
    const { sessionId, command } = req.body;
    
    if (!sessionId || !command) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'sessionId and command are required',
        },
      });
    }
    
    const result = await commandService.executeCommand(sessionId, command);
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Command executed successfully',
    };
    
    res.status(201).json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'COMMAND_EXECUTE_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/commands/stats/:sessionId
 * Get command statistics for a session
 */
router.get('/stats/:sessionId', (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const stats = commandService.getSessionStats(sessionId);
    
    const response: ApiResponse = {
      success: true,
      data: stats,
    };
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'COMMAND_STATS_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;
