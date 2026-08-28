import { Router } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';

export const auditRouter = Router();

// GET /api/audit (Admin only)
auditRouter.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  const logs = db.getAuditLogs();
  return res.json(logs);
});

// DELETE /api/audit/:id (Admin deletes single audit log)
auditRouter.delete('/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
  try {
    const { id } = req.params;
    const auditLogs = db.getAuditLogs();
    const index = auditLogs.findIndex((l) => l.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    const removed = auditLogs.splice(index, 1)[0];
    db.save();

    return res.json({ success: true, message: 'Audit log deleted successfully', removedId: id });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete audit log' });
  }
});

// DELETE /api/audit (Admin clears all or bulk deletes audit logs)
auditRouter.delete('/', authMiddleware, requireRole('admin'), (req: any, res) => {
  try {
    const { ids } = req.body || {};

    if (Array.isArray(ids) && ids.length > 0) {
      const auditLogs = db.getAuditLogs();
      const idSet = new Set(ids);
      const remaining = auditLogs.filter((l) => !idSet.has(l.id));
      (db as any).data.auditLogs = remaining;
      db.save();
      return res.json({ success: true, message: `${ids.length} audit logs deleted successfully`, deletedCount: ids.length });
    }

    // Clear all logs
    (db as any).data.auditLogs = [];
    db.save();
    return res.json({ success: true, message: 'All audit logs cleared successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to clear audit logs' });
  }
});

