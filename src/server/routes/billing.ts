import { Router } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';
import type { Invoice, PaymentRecord } from '../../types/index.ts';

export const billingRouter = Router();

// GET /api/billing/invoices
billingRouter.get('/invoices', authMiddleware, (req: any, res) => {
  const user = req.user;
  const allInvoices = db.getInvoices();

  if (user.role === 'admin') {
    return res.json(allInvoices.reverse());
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

// GET /api/billing/invoices/:id
billingRouter.get('/invoices/:id', authMiddleware, (req: any, res) => {
  const user = req.user;
  const invoice = db.getInvoices().find((inv) => inv.id === req.params.id || inv.jobId === req.params.id);

  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  if (user.role === 'customer') {
    const customer = db.getCustomers().find((c) => c.userId === user.id);
    if (!customer || invoice.customerId !== customer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  const job = db.getJobs().find((j) => j.id === invoice.jobId);
  const materials = db.getJobMaterials().filter((m) => m.jobId === invoice.jobId);
  const payments = db.getPayments().filter((p) => p.invoiceId === invoice.id || p.jobId === invoice.jobId);

  return res.json({
    ...invoice,
    job,
    materials,
    payments,
  });
});

// POST /api/billing/record-payment (Customer pays online or Admin marks payment as received)
billingRouter.post('/record-payment', authMiddleware, (req: any, res) => {
  try {
    const user = req.user;
    const { jobId, invoiceId, amount, paymentMethod, transactionRef, notes } = req.body;

    const job = db.getJobs().find((j) => j.id === jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    let invoice = db.getInvoices().find((inv) => inv.jobId === jobId || inv.id === invoiceId);

    // If job was verified but invoice missing, create one
    if (!invoice && job.finalAmount) {
      invoice = {
        id: `INV-${Date.now()}`,
        jobId: job.id,
        customerId: job.customerId,
        customerName: job.customerName,
        customerPhone: job.customerPhone,
        customerAddress: job.address,
        workerId: job.assignedWorkerId,
        workerName: job.assignedWorkerName,
        category: job.category,
        materialCost: 0,
        labourCharge: job.finalAmount,
        additionalCharges: 0,
        suggestedTotal: job.finalAmount,
        finalAmount: job.finalAmount,
        approvedByAdminId: 'system',
        approvedByAdminName: 'Admin',
        approvedAt: new Date().toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      db.getInvoices().push(invoice);
    }

    const payAmount = Number(amount) || invoice?.finalAmount || job.finalAmount || 0;
    const now = new Date().toISOString();
    const payId = `PAY-${new Date().getFullYear()}-${String(db.getPayments().length + 1).padStart(4, '0')}`;

    const newPayment: PaymentRecord = {
      id: payId,
      invoiceId: invoice?.id || `INV-${job.id}`,
      jobId: job.id,
      customerId: job.customerId,
      customerName: job.customerName,
      amount: payAmount,
      paymentMethod: paymentMethod || 'upi',
      paymentStatus: 'paid',
      transactionRef: transactionRef || `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      recordedByAdminId: user.role === 'admin' ? user.id : undefined,
      recordedByName: user.name,
      paymentDate: now,
      notes: notes || `Payment received via ${paymentMethod || 'online'}`,
    };

    db.getPayments().push(newPayment);

    // Update job & invoice status
    job.paymentStatus = 'paid';
    job.status = 'PAID';
    job.paymentMethod = paymentMethod || 'upi';
    job.updatedAt = now;

    if (invoice) {
      invoice.status = 'paid';
      invoice.paidAt = now;
      invoice.paymentMethod = paymentMethod || 'upi';
    }

    // Add status history
    db.getJobStatusHistory().push({
      id: `hist-${Date.now()}`,
      jobId: job.id,
      status: 'PAID',
      notes: `Payment of ₹${payAmount} confirmed via ${paymentMethod || 'UPI'}. Txn: ${newPayment.transactionRef}`,
      updatedByUserId: user.id,
      updatedByName: user.name,
      role: user.role,
      timestamp: now,
    });

    db.logAudit({
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'PAYMENT_RECORDED',
      jobId: job.id,
      newValue: `₹${payAmount} via ${paymentMethod}`,
      details: `Payment of ₹${payAmount} recorded for job ${job.id}`,
    });

    // Notify Admin
    db.addNotification({
      recipientRole: 'admin',
      title: 'Payment Received',
      message: `Received ₹${payAmount} for Job ${job.id} (${job.customerName})`,
      jobId: job.id,
      type: 'payment_received',
    });

    // Notify Customer
    db.addNotification({
      recipientRole: 'customer',
      title: 'Payment Successful',
      message: `Your payment of ₹${payAmount} for ${job.category} (${job.id}) has been recorded. Receipt is ready.`,
      jobId: job.id,
      type: 'payment_received',
    });

    db.save();
    return res.status(201).json({
      success: true,
      payment: newPayment,
      job,
      invoice,
    });
  } catch (error) {
    console.error('Record payment error:', error);
    return res.status(500).json({ error: 'Failed to record payment' });
  }
});

// GET /api/billing/payments (List all recorded payments)
billingRouter.get('/payments', authMiddleware, (req: any, res) => {
  const user = req.user;
  const payments = db.getPayments();

  if (user.role === 'admin') {
    return res.json(payments.reverse());
  } else if (user.role === 'customer') {
    const customer = db.getCustomers().find((c) => c.userId === user.id);
    if (!customer) return res.json([]);
    return res.json(payments.filter((p) => p.customerId === customer.id).reverse());
  }

  return res.status(403).json({ error: 'Access denied' });
});

// DELETE /api/billing/:id (Admin only - Permanent Hard Delete of bill/invoice/payment)
billingRouter.delete('/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
  const user = req.user;
  const id = req.params.id;

  const deleted = db.permanentDeleteBill(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Bill not found' });
  }

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: 'admin',
    action: 'HARD_DELETE_BILL',
    details: `Admin permanently deleted bill record ${id} from database`,
  });

  return res.json({
    success: true,
    message: 'bills permanently deleted',
    id,
  });
});

// DELETE /api/billing/invoices/:id (Alias)
billingRouter.delete('/invoices/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
  const user = req.user;
  const id = req.params.id;

  const deleted = db.permanentDeleteBill(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Bill not found' });
  }

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: 'admin',
    action: 'HARD_DELETE_BILL',
    details: `Admin permanently deleted bill invoice ${id} from database`,
  });

  return res.json({
    success: true,
    message: 'bills permanently deleted',
    id,
  });
});

// DELETE /api/billing/payments/:id (Alias)
billingRouter.delete('/payments/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
  const user = req.user;
  const id = req.params.id;

  const deleted = db.permanentDeleteBill(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Payment record not found' });
  }

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: 'admin',
    action: 'HARD_DELETE_BILL',
    details: `Admin permanently deleted payment transaction ${id} from database`,
  });

  return res.json({
    success: true,
    message: 'bills permanently deleted',
    id,
  });
});
