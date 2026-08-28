import { Router } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';
import type { BusinessAnalytics } from '../../types/index.ts';

export const analyticsRouter = Router();

// GET /api/analytics (ADMIN ONLY)
analyticsRouter.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const jobs = db.getJobs();
    const payments = db.getPayments().filter((p) => p.paymentStatus === 'paid');
    const invoices = db.getInvoices();
    const workers = db.getWorkers();
    const customers = db.getCustomers();
    const salaries = db.getSalaryRecords();
    const materials = db.getJobMaterials();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const thisMonthStr = todayStr.substring(0, 7); // YYYY-MM

    // 1. Revenue calculations
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const todayRevenue = payments
      .filter((p) => p.paymentDate && p.paymentDate.startsWith(todayStr))
      .reduce((sum, p) => sum + p.amount, 0);
    const thisMonthRevenue = payments
      .filter((p) => p.paymentDate && p.paymentDate.startsWith(thisMonthStr))
      .reduce((sum, p) => sum + p.amount, 0);

    // 2. Pending payments (jobs that are verified/completed but unpaid)
    const pendingInvoices = invoices.filter((inv) => inv.status === 'pending');
    const pendingPaymentsCount = pendingInvoices.length;
    const pendingPaymentsAmount = pendingInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);

    // 3. Salaries
    const totalSalaryExpense = salaries.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const pendingSalaryExpense = salaries.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);

    // 4. Material costs
    const totalMaterialCost = materials.reduce((sum, m) => sum + (m.totalPrice || 0), 0);

    // 5. Estimated profit = Total Revenue - Total Salary Expense
    const estimatedProfit = totalRevenue - totalSalaryExpense;

    // 6. Job statuses
    const totalJobsCount = jobs.length;
    const pendingJobsCount = jobs.filter((j) => ['REQUESTED', 'AI_ANALYSIS', 'ASSIGNED'].includes(j.status)).length;
    const activeJobsCount = jobs.filter((j) => ['ACCEPTED', 'ON_THE_WAY', 'REACHED', 'WORK_STARTED'].includes(j.status)).length;
    const completedJobsCount = jobs.filter((j) =>
      ['COMPLETED', 'WAITING_FOR_ADMIN_VERIFICATION', 'ADMIN_VERIFIED', 'PAYMENT_PENDING', 'PAID', 'CLOSED'].includes(j.status)
    ).length;

    // 7. Workers count
    const totalWorkersCount = workers.length;
    const availableWorkersCount = workers.filter((w) => w.availability === 'available' && w.status === 'active').length;
    const totalCustomersCount = customers.length;

    // 8. Average completion time in hours
    let totalCompletionHours = 0;
    let completedCountWithDates = 0;
    jobs.forEach((j) => {
      if (j.createdAt && j.completedAt) {
        const diffMs = new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime();
        if (diffMs > 0) {
          totalCompletionHours += diffMs / (1000 * 60 * 60);
          completedCountWithDates++;
        }
      }
    });
    const averageCompletionHours =
      completedCountWithDates > 0 ? Number((totalCompletionHours / completedCountWithDates).toFixed(1)) : 0;

    // 9. Jobs per day (last 7 days)
    const jobsPerDayMap: Record<string, { total: number; completed: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      jobsPerDayMap[ds] = { total: 0, completed: 0 };
    }

    jobs.forEach((j) => {
      const dStr = j.createdAt.split('T')[0];
      if (jobsPerDayMap[dStr]) {
        jobsPerDayMap[dStr].total++;
        if (['COMPLETED', 'ADMIN_VERIFIED', 'PAID', 'CLOSED'].includes(j.status)) {
          jobsPerDayMap[dStr].completed++;
        }
      }
    });

    const jobsPerDay = Object.keys(jobsPerDayMap).map((date) => ({
      date,
      count: jobsPerDayMap[date].total,
      completed: jobsPerDayMap[date].completed,
    }));

    // 10. Revenue trend (last 7 days)
    const revTrendMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      revTrendMap[ds] = 0;
    }
    payments.forEach((p) => {
      const dStr = p.paymentDate.split('T')[0];
      if (revTrendMap[dStr] !== undefined) {
        revTrendMap[dStr] += p.amount;
      }
    });
    const revenueTrend = Object.keys(revTrendMap).map((date) => ({
      date,
      amount: revTrendMap[date],
    }));

    // 11. Category distribution
    const catMap: Record<string, { count: number; revenue: number }> = {};
    jobs.forEach((j) => {
      const cat = j.category || 'Other';
      if (!catMap[cat]) catMap[cat] = { count: 0, revenue: 0 };
      catMap[cat].count++;
      if (j.finalAmount && j.paymentStatus === 'paid') {
        catMap[cat].revenue += j.finalAmount;
      }
    });
    const categoryDistribution = Object.keys(catMap).map((category) => ({
      category,
      count: catMap[category].count,
      revenue: catMap[category].revenue,
    }));

    // 12. Top performing workers
    const topWorkers = workers.map((w) => {
      const workerJobs = jobs.filter((j) => j.assignedWorkerId === w.id);
      const workerCompleted = workerJobs.filter((j) =>
        ['COMPLETED', 'ADMIN_VERIFIED', 'PAID', 'CLOSED'].includes(j.status)
      ).length;
      const rev = workerJobs
        .filter((j) => j.paymentStatus === 'paid' && j.finalAmount)
        .reduce((sum, j) => sum + (j.finalAmount || 0), 0);

      return {
        workerId: w.id,
        workerName: w.name,
        completedJobs: workerCompleted,
        rating: w.rating || 5.0,
        revenueGenerated: rev,
      };
    });
    topWorkers.sort((a, b) => b.completedJobs - a.completedJobs || b.revenueGenerated - a.revenueGenerated);

    const analytics: BusinessAnalytics = {
      totalRevenue,
      thisMonthRevenue,
      todayRevenue,
      pendingPaymentsCount,
      pendingPaymentsAmount,
      totalSalaryExpense,
      pendingSalaryExpense,
      estimatedProfit,
      totalJobsCount,
      pendingJobsCount,
      activeJobsCount,
      completedJobsCount,
      totalWorkersCount,
      availableWorkersCount,
      totalCustomersCount,
      averageCompletionHours,
      jobsPerDay,
      revenueTrend,
      categoryDistribution,
      topWorkers: topWorkers.slice(0, 5),
    };

    return res.json(analytics);
  } catch (error) {
    console.error('Analytics calculation error:', error);
    return res.status(500).json({ error: 'Failed to generate analytics' });
  }
});
