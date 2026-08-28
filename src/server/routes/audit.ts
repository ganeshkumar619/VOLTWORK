import { Router } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';

export const auditRouter = Router();

// GET /api/audit (Admin only)
auditRouter.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  const logs = db.getAuditLogs();
  return res.json(logs);
});
