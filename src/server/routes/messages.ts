import { Router } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';

export const messagesRouter = Router();

// GET /api/messages (List notifications & messages)
messagesRouter.get('/', authMiddleware, (req: any, res) => {
  const user = req.user;
  const allNotifs = db.getNotifications();

  if (user.role === 'admin') {
    return res.json(allNotifs);
  }

  const filtered = allNotifs.filter((n) => {
    if (n.userId && n.userId === user.id) return true;
    if (n.recipientRole === 'all') return true;
    if (n.recipientRole === user.role) return true;
    return false;
  });

  return res.json(filtered.slice(0, 50));
});

// DELETE /api/messages/:id (ADMIN ONLY - Hard delete message from database)
messagesRouter.delete('/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
  const user = req.user;
  const id = req.params.id;

  const deleted = db.permanentDeleteMessage(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Message not found' });
  }

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: 'admin',
    action: 'HARD_DELETE_MESSAGE',
    details: `Admin permanently deleted message ${id} from database. Record purged.`,
  });

  return res.json({
    success: true,
    message: 'messages permanently deleted',
    id,
  });
});
