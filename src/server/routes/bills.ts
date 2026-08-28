import { Router } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';

export const billsRouter = Router();

// GET /api/bills (List all bills/invoices)
billsRouter.get('/', authMiddleware, (req: any, res) => {
  const user = req.user;
  const allInvoices = db.getInvoices();

  if (user.role === 'admin') {
    return res.json([...allInvoices].reverse());
  } else if (user.role === 'customer') {
    const customer = db.getCustomers().find((c) => c.userId === user.id);
    if (!customer) return res.json([]);
    return res.json(allInvoices.filter((inv) => inv.customerId === customer.id).reverse());
  } else if (user.role === 'worker') {
    const worker = db.getWorkers().find((w) => w.userId === user.id);
    if (!worker) return res.json([]);
    return res.json(allInvoices.filter((inv) => inv.workerId === worker.id).reverse());
  }

  return res.json([]);
});

// GET /api/bills/:id
billsRouter.get('/:id', authMiddleware, (req: any, res) => {
  const invoice = db.getInvoices().find((inv) => inv.id === req.params.id || inv.jobId === req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Bill not found' });
  }
  return res.json(invoice);
});

// DELETE /api/bills/:id (ADMIN ONLY - Hard delete bill from database)
billsRouter.delete('/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
  const user = req.user;
  const id = req.params.id;

  const invoice = db.getInvoices().find((inv) => inv.id === id || inv.jobId === id);
  const payment = db.getPayments().find((p) => p.id === id || p.invoiceId === id || p.jobId === id);

  if (!invoice && !payment) {
    return res.status(404).json({ error: 'Bill not found' });
  }

  const billRef = invoice ? invoice.id : payment?.id;
  const billAmount = invoice ? invoice.finalAmount : payment?.amount;
  const customerName = invoice ? invoice.customerName : payment?.customerName;

  const deleted = db.permanentDeleteBill(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Bill not found' });
  }

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: 'admin',
    action: 'HARD_DELETE_BILL',
    details: `Admin permanently deleted bill ${billRef} (₹${billAmount} for ${customerName}). Record purged from database.`,
  });

  return res.json({
    success: true,
    message: 'bills permanently deleted',
    id,
  });
});
