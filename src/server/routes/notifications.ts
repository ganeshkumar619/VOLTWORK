import { Router } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';

export const notificationRouter = Router();

// GET /api/notifications
notificationRouter.get('/', authMiddleware, (req: any, res) => {
  const user = req.user;
  const allNotifs = db.getNotifications();

  // Filter based on role or targeted userId
  const filtered = allNotifs.filter((n) => {
    if (n.userId && n.userId === user.id) return true;
    if (n.recipientRole === 'all') return true;
    if (n.recipientRole === user.role) return true;
    return false;
  });

  return res.json(filtered.slice(0, 50));
});

// PUT /api/notifications/:id/read
notificationRouter.put('/:id/read', authMiddleware, (req, res) => {
  const notif = db.getNotifications().find((n) => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    db.save();
  }
  return res.json({ success: true });
});

// PUT /api/notifications/read-all
notificationRouter.put('/read-all', authMiddleware, (req: any, res) => {
  const user = req.user;
  const notifs = db.getNotifications();
  notifs.forEach((n) => {
    if (n.userId === user.id || n.recipientRole === 'all' || n.recipientRole === user.role) {
      n.isRead = true;
    }
  });
  db.save();
  return res.json({ success: true });
});

// DELETE /api/notifications/:id (Admin only - Permanent Hard Delete)
notificationRouter.delete('/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
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
    details: `Admin permanently deleted notification ${id} from database`,
  });

  return res.json({
    success: true,
    message: 'messages permanently deleted',
    id,
  });
});

