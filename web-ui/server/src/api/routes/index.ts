/**
 * API Routes Index
 */

import { Router } from 'express';
import sessionRoutes from './sessions.js';
import commandRoutes from './commands.js';
import messageRoutes from './messages.js';

const router = Router();

router.use('/sessions', sessionRoutes);
router.use('/commands', commandRoutes);
router.use('/messages', messageRoutes);

export default router;
