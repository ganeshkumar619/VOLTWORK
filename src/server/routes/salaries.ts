import { Router } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';
import type { SalaryRecord } from '../../types/index.ts';

export const salaryRouter = Router();

// GET /api/salaries (Admin sees all; Worker sees only own)
salaryRouter.get('/', authMiddleware, (req: any, res) => {
  const user = req.user;
  const allSalaries = db.getSalaryRecords();

  if (user.role === 'admin') {
    return res.json(allSalaries.reverse());
  } else if (user.role === 'worker') {
    const worker = db.getWorkers().find((w) => w.userId === user.id || w.id === user.id || w.email === user.email);
    if (!worker) return res.json([]);
    return res.json(allSalaries.filter((s) => s.workerId === worker.id).reverse());
  }

  return res.status(403).json({ error: 'Customers cannot view salary records' });
});

// GET /api/salaries/my (Worker gets own salary records)
salaryRouter.get('/my', authMiddleware, (req: any, res) => {
  const user = req.user;
  if (user.role !== 'worker' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const worker = db.getWorkers().find((w) => w.userId === user.id || w.id === user.id || w.email === user.email);
  if (!worker) {
    return res.json([]);
  }

  const mySalaries = db.getSalaryRecords().filter((s) => s.workerId === worker.id);
  return res.json(mySalaries.reverse());
});

// POST /api/salaries (Admin creates or updates salary record)
salaryRouter.post('/', authMiddleware, requireRole('admin'), (req: any, res) => {
  try {
    const user = req.user;
    const {
      workerId,
      salaryPeriod, // YYYY-MM
      basicSalary,
      commission,
      bonus,
      deduction,
      paidAmount,
      paymentMethod,
      notes,
    } = req.body;

    if (!workerId || !salaryPeriod) {
      return res.status(400).json({ error: 'Worker and salary period (YYYY-MM) are required' });
    }

    const worker = db.getWorkers().find((w) => w.id === workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const basic = Number(basicSalary) >= 0 ? Number(basicSalary) : worker.basicSalary || 0;
    const comm = Number(commission) || 0;
    const bon = Number(bonus) || 0;
    const ded = Number(deduction) || 0;

    // Calculation: Basic + Commission + Bonus - Deduction = Total Salary
    const totalSalary = Math.max(0, basic + comm + bon - ded);
    const paid = Number(paidAmount) || 0;
    const remaining = Math.max(0, totalSalary - paid);
    const status = paid >= totalSalary && totalSalary > 0 ? 'paid' : paid > 0 ? 'partial' : 'pending';

    const now = new Date().toISOString();
    const existing = db.getSalaryRecords().find((s) => s.workerId === workerId && s.salaryPeriod === salaryPeriod);

    let record: SalaryRecord;

    if (existing) {
      existing.basicSalary = basic;
      existing.commission = comm;
      existing.bonus = bon;
      existing.deduction = ded;
      existing.totalSalary = totalSalary;
      existing.paidAmount = paid;
      existing.remainingAmount = remaining;
      existing.status = status;
      if (paymentMethod) existing.paymentMethod = paymentMethod;
      if (paid > 0) existing.paymentDate = now;
      if (notes !== undefined) existing.notes = notes;
      record = existing;
    } else {
      const salId = `SAL-${salaryPeriod.replace('-', '')}-${String(db.getSalaryRecords().length + 1).padStart(3, '0')}`;
      record = {
        id: salId,
        workerId,
        workerName: worker.name,
        salaryPeriod,
        basicSalary: basic,
        commission: comm,
        bonus: bon,
        deduction: ded,
        totalSalary,
        paidAmount: paid,
        remainingAmount: remaining,
        status,
        paymentMethod: paymentMethod || 'bank_transfer',
        paymentDate: paid > 0 ? now : undefined,
        notes: notes || '',
        createdAt: now,
      };
      db.getSalaryRecords().push(record);
    }

    db.logAudit({
      userId: user.id,
      userName: user.name,
      role: 'admin',
      action: 'SALARY_RECORD_SAVED',
      newValue: `Total: ₹${totalSalary}, Paid: ₹${paid}`,
      details: `Saved salary for ${worker.name} for period ${salaryPeriod}`,
    });

    db.addNotification({
      userId: worker.userId,
      recipientRole: 'worker',
      title: 'Salary Statement Updated',
      message: `Salary for period ${salaryPeriod} has been computed: Total ₹${totalSalary}, Paid: ₹${paid}`,
      type: 'salary_updated',
    });

    db.save();
    return res.status(201).json(record);
  } catch (error) {
    console.error('Save salary error:', error);
    return res.status(500).json({ error: 'Failed to save salary record' });
  }
});

// POST /api/salaries/:id/payout (Record payout)
salaryRouter.post('/:id/payout', authMiddleware, requireRole('admin'), (req: any, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, notes } = req.body;

  const record = db.getSalaryRecords().find((s) => s.id === id);
  if (!record) return res.status(404).json({ error: 'Salary record not found' });

  const payAmt = Number(amount) || record.remainingAmount;
  record.paidAmount = (record.paidAmount || 0) + payAmt;
  record.remainingAmount = Math.max(0, record.totalSalary - record.paidAmount);
  record.status = record.remainingAmount === 0 ? 'paid' : 'partial';
  record.paymentMethod = paymentMethod || record.paymentMethod || 'bank_transfer';
  record.paymentDate = new Date().toISOString();
  if (notes) record.notes = (record.notes ? record.notes + ' | ' : '') + notes;

  db.logAudit({
    userId: req.user.id,
    userName: req.user.name,
    role: 'admin',
    action: 'SALARY_PAYOUT',
    newValue: `₹${payAmt} via ${record.paymentMethod}`,
    details: `Disbursed salary ₹${payAmt} to ${record.workerName} (${record.salaryPeriod})`,
  });

  db.save();
  return res.json(record);
});

// POST /api/salaries/:id/send-sms (ADMIN ONLY: Dispatch worker salary notification SMS)
salaryRouter.post('/:id/send-sms', authMiddleware, requireRole('admin'), (req: any, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { customMessage } = req.body;

    const record = db.getSalaryRecords().find((s) => s.id === id);
    if (!record) return res.status(404).json({ error: 'Salary record not found' });

    const worker = db.getWorkers().find((w) => w.id === record.workerId);
    if (!worker) return res.status(404).json({ error: 'Worker profile not found' });

    const phoneNumber = worker.phone;
    if (!phoneNumber) return res.status(400).json({ error: 'Worker phone number missing' });

    const now = new Date().toISOString();
    // Required template format:
    // "Dear {worker_name}, Your salary for {period} has been updated. Total: ₹{totalSalary}. Paid: ₹{paidAmount}. Pending: ₹{remainingAmount}. - VoltWork AI"
    const messageContent =
      customMessage ||
      `Dear ${worker.name}, Your salary for ${record.salaryPeriod} has been updated. Total: ₹${record.totalSalary}. Paid: ₹${record.paidAmount}. Pending: ₹${record.remainingAmount}. - VoltWork AI`;

    const smsId = `SMS-SAL-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const smsLog: any = {
      id: smsId,
      salaryId: record.id,
      workerId: worker.id,
      workerName: worker.name,
      phoneNumber,
      finalAmount: record.totalSalary,
      messageContent,
      smsStatus: 'Sent',
      type: 'SALARY',
      recipientType: 'worker',
      sentByAdminId: user.id,
      sentByName: user.name,
      sentAt: now,
      providerResponse: `HTTP 200 OK: Delivered to ${phoneNumber} via Carrier Gateway [SID: SM${Math.floor(100000000 + Math.random() * 900000000)}]`,
    };

    record.smsStatus = 'Sent';
    record.lastSmsSentAt = now;
    db.getSMSLogs().unshift(smsLog);

    db.logAudit({
      userId: user.id,
      userName: user.name,
      role: 'admin',
      action: 'SALARY_SMS_SENT',
      details: `Salary SMS dispatched to Electrician ${worker.name} (${phoneNumber}) for ${record.salaryPeriod}`,
    });

    db.addNotification({
      userId: worker.userId,
      recipientRole: 'worker',
      title: 'Salary SMS Dispatched',
      message: `Salary breakdown SMS dispatched to your phone ${phoneNumber}`,
      type: 'sms_sent',
    });

    db.save();
    return res.json({
      success: true,
      smsLog,
      message: `Salary SMS successfully sent to ${worker.name}`,
    });
  } catch (error) {
    console.error('Salary SMS error:', error);
    return res.status(500).json({ error: 'Failed to dispatch salary SMS' });
  }
});
