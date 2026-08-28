import { Router } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';

export const historyRouter = Router();

// GET /api/history (List all history records)
historyRouter.get('/', authMiddleware, (req: any, res) => {
  const user = req.user;
  const allJobs = db.getJobs();

  if (user.role === 'admin') {
    return res.json([...allJobs].reverse());
  } else if (user.role === 'customer') {
    const customer = db.getCustomers().find((c) => c.userId === user.id);
    if (!customer) return res.json([]);
    return res.json(allJobs.filter((j) => j.customerId === customer.id).reverse());
  } else if (user.role === 'worker') {
    const worker = db.getWorkers().find((w) => w.userId === user.id);
    if (!worker) return res.json([]);
    return res.json(allJobs.filter((j) => j.assignedWorkerId === worker.id).reverse());
  }

  return res.json([]);
});

// GET /api/history/:id
historyRouter.get('/:id', authMiddleware, (req: any, res) => {
  const job = db.getJobs().find((j) => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'History record not found' });
  }
  return res.json(job);
});

// DELETE /api/history/:id (ADMIN ONLY - Hard delete history record)
historyRouter.delete('/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
  const user = req.user;
  const id = req.params.id;

  const job = db.getJobs().find((j) => j.id === id);
  if (!job) {
    return res.status(404).json({ error: 'History record not found' });
  }

  const customerName = job.customerName;
  const category = job.category;

  const deleted = db.permanentDeleteJob(id);
  if (!deleted) {
    return res.status(404).json({ error: 'History record not found' });
  }

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: 'admin',
    action: 'HARD_DELETE_HISTORY',
    jobId: id,
    details: `Admin permanently deleted history record ${id} (${category} - ${customerName}). Record purged from database.`,
  });

  return res.json({
    success: true,
    message: 'history permanently deleted',
    id,
  });
});
