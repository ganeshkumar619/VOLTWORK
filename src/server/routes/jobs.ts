import { Router } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';
import { ruleBasedAnalyzer } from './ai.ts';
import type { Job, JobMaterial, JobStatus, JobStatusHistoryItem, Invoice } from '../../types/index.ts';

export const jobRouter = Router();

// GET /api/jobs (Role-filtered)
jobRouter.get('/', authMiddleware, (req: any, res) => {
  const user = req.user;
  const includeDeleted = req.query.includeDeleted === 'true' && user.role === 'admin';
  const allJobs = db.getJobs();
  const allMaterials = db.getJobMaterials();

  let filteredJobs: Job[] = [];

  if (user.role === 'admin') {
    filteredJobs = includeDeleted ? allJobs : allJobs.filter((j) => !j.isDeleted);
  } else if (user.role === 'customer') {
    const customer = db.getCustomers().find((c) => c.userId === user.id);
    if (!customer) return res.json([]);
    filteredJobs = allJobs.filter((j) => j.customerId === customer.id && !j.isDeleted);
  } else if (user.role === 'worker') {
    const worker = db.getWorkers().find((w) => w.userId === user.id);
    if (!worker) return res.json([]);
    filteredJobs = allJobs.filter((j) => j.assignedWorkerId === worker.id && !j.isDeleted);
  }

  // Enrich with materials
  const enriched = filteredJobs.map((j) => {
    const materials = allMaterials.filter((m) => m.jobId === j.id);
    const materialCost = materials.reduce((sum, m) => sum + m.totalPrice, 0);
    const labour = j.workDetails?.labourCharge || 0;
    const additional = j.workDetails?.additionalCharges || 0;
    const suggestedTotal = materialCost + labour + additional;

    return {
      ...j,
      problemDescription: j.description,
      location: j.address,
      materials,
      suggestedTotal: suggestedTotal > 0 ? suggestedTotal : undefined,
    };
  });

  return res.json(enriched.reverse());
});

// GET /api/jobs/:id
jobRouter.get('/:id', authMiddleware, (req: any, res) => {
  const user = req.user;
  const job = db.getJobs().find((j) => j.id === req.params.id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Role validation
  if (user.role === 'customer') {
    const customer = db.getCustomers().find((c) => c.userId === user.id);
    if (!customer || job.customerId !== customer.id) {
      return res.status(403).json({ error: 'Access denied to this job' });
    }
  } else if (user.role === 'worker') {
    const worker = db.getWorkers().find((w) => w.userId === user.id);
    if (!worker || job.assignedWorkerId !== worker.id) {
      return res.status(403).json({ error: 'Access denied to unassigned job' });
    }
  }

  const materials = db.getJobMaterials().filter((m) => m.jobId === job.id);
  const history = db.getJobStatusHistory().filter((h) => h.jobId === job.id);
  const invoice = db.getInvoices().find((inv) => inv.jobId === job.id);
  const assignedWorker = job.assignedWorkerId ? db.getWorkers().find((w) => w.id === job.assignedWorkerId) : null;

  const materialCost = materials.reduce((sum, m) => sum + m.totalPrice, 0);
  const labour = job.workDetails?.labourCharge || 0;
  const additional = job.workDetails?.additionalCharges || 0;
  const suggestedTotal = materialCost + labour + additional;

  const jobPayload = {
    ...job,
    problemDescription: job.description,
    location: job.address,
    workerNotes: job.workDetails?.workSummary || job.workDetails?.description,
    labourCharge: job.workDetails?.labourCharge,
    materialCost,
    additionalCharges: job.workDetails?.additionalCharges,
    materials,
    statusHistory: history,
    invoice,
    suggestedTotal,
    assignedWorkerDetails: assignedWorker
      ? {
          id: assignedWorker.id,
          name: assignedWorker.name,
          phone: assignedWorker.phone,
          avatarUrl: assignedWorker.avatarUrl,
          experienceYears: assignedWorker.experienceYears,
          currentLat: assignedWorker.currentLat,
          currentLng: assignedWorker.currentLng,
          locationUpdatedAt: assignedWorker.locationUpdatedAt,
          isLocationSharing: assignedWorker.isLocationSharing,
          rating: assignedWorker.rating,
        }
      : null,
  };

  return res.json({
    job: jobPayload,
    ...jobPayload,
  });
});

// GET /api/jobs/:id/location-tracking
jobRouter.get('/:id/location-tracking', authMiddleware, (req: any, res) => {
  const job = db.getJobs().find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const history = db.getLocationTracking().filter((l) => l.jobId === job.id);
  return res.json(history);
});

// POST /api/jobs (Create new job request)
jobRouter.post('/', authMiddleware, (req: any, res) => {
  try {
    const user = req.user;
    const {
      description,
      problemDescription,
      category,
      priority,
      preferredDate,
      preferredSchedule,
      address,
      location,
      latitude,
      longitude,
      notes,
      problemPhotoUrl,
      customerPhotos,
      aiAnalysis,
      customerId: specifiedCustomerId,
    } = req.body;

    const finalDescription = (description || problemDescription || '').trim();
    const finalCategory = (category || '').trim();
    const finalAddress = (address || location || '').trim();

    if (!finalDescription || !finalCategory) {
      const missingFields: string[] = [];
      if (!finalDescription) missingFields.push('Problem Description');
      if (!finalCategory) missingFields.push('Category');
      return res.status(400).json({
        error: `Description and Category are required. Missing: ${missingFields.join(', ')}`,
        missingFields,
      });
    }

    let customerId = '';
    let customerName = '';
    let customerPhone = '';
    let customerEmail = '';

    if (user.role === 'customer') {
      let customer = db.getCustomers().find((c) => c.userId === user.id);
      if (!customer) {
        customer = {
          id: `cust-${Date.now()}`,
          userId: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: finalAddress || '',
          latitude: latitude ? Number(latitude) : undefined,
          longitude: longitude ? Number(longitude) : undefined,
          createdAt: new Date().toISOString(),
        };
        db.getCustomers().push(customer);
      } else {
        if (finalAddress) customer.address = finalAddress;
        if (latitude) customer.latitude = Number(latitude);
        if (longitude) customer.longitude = Number(longitude);
      }
      customerId = customer.id;
      customerName = customer.name;
      customerPhone = customer.phone;
      customerEmail = customer.email;
    } else if (user.role === 'admin') {
      const customer = db.getCustomers().find((c) => c.id === specifiedCustomerId);
      if (!customer) {
        return res.status(400).json({ error: 'Valid customerId must be selected by admin' });
      }
      customerId = customer.id;
      customerName = customer.name;
      customerPhone = customer.phone;
      customerEmail = customer.email;
    } else {
      return res.status(403).json({ error: 'Workers cannot create service requests directly' });
    }

    const jobCount = db.getJobs().length + 1;
    const jobId = `JOB-${new Date().getFullYear()}-${String(jobCount).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newJob: Job = {
      id: jobId,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      address: finalAddress || 'Location Provided via GPS',
      latitude: latitude ? Number(latitude) : 9.1726,
      longitude: longitude ? Number(longitude) : 77.8711,
      description: finalDescription,
      category: finalCategory,
      priority: priority || 'medium',
      preferredDate: preferredDate || now.split('T')[0],
      problemPhotoUrl: problemPhotoUrl || (Array.isArray(customerPhotos) && customerPhotos[0]) || undefined,
      aiAnalysis: aiAnalysis || ruleBasedAnalyzer(finalDescription, finalCategory),
      status: 'REQUESTED',
      paymentStatus: 'pending',
      notes: notes || '',
      createdAt: now,
      updatedAt: now,
    };

    db.getJobs().push(newJob);

    // Initial status history
    const historyItem: JobStatusHistoryItem = {
      id: `hist-${Date.now()}`,
      jobId,
      status: 'REQUESTED',
      notes: 'Job request submitted by customer',
      updatedByUserId: user.id,
      updatedByName: user.name,
      role: user.role,
      timestamp: now,
      locationLat: latitude ? Number(latitude) : undefined,
      locationLng: longitude ? Number(longitude) : undefined,
    };
    db.getJobStatusHistory().push(historyItem);

    db.logAudit({
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'JOB_CREATED',
      jobId,
      details: `New electrical service requested: ${finalCategory} (${priority || 'medium'})`,
    });

    db.addNotification({
      recipientRole: 'admin',
      title: 'New Service Request',
      message: `${customerName} requested ${finalCategory} service (${jobId})`,
      jobId,
      type: 'job_created',
    });

    db.save();
    return res.status(201).json(newJob);
  } catch (error) {
    console.error('Job creation error:', error);
    return res.status(500).json({ error: 'Failed to create job request' });
  }
});

// POST /api/jobs/:id/assign (Admin assigns worker)
jobRouter.post('/:id/assign', authMiddleware, requireRole('admin'), (req: any, res) => {
  const job = db.getJobs().find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const { workerId, scheduledDate, notes } = req.body;
  const worker = db.getWorkers().find((w) => w.id === workerId);
  if (!worker) return res.status(400).json({ error: 'Worker not found' });

  const previousWorker = job.assignedWorkerName;
  job.assignedWorkerId = worker.id;
  job.assignedWorkerName = worker.name;
  job.assignedWorkerPhone = worker.phone;
  job.status = 'ASSIGNED';
  job.scheduledDate = scheduledDate || job.scheduledDate || new Date().toISOString();
  job.updatedAt = new Date().toISOString();
  if (notes) job.notes = (job.notes ? job.notes + '\n' : '') + `[Admin Note]: ${notes}`;

  worker.availability = 'on_job';

  const historyItem: JobStatusHistoryItem = {
    id: `hist-${Date.now()}`,
    jobId: job.id,
    status: 'ASSIGNED',
    notes: `Assigned to electrician ${worker.name}`,
    updatedByUserId: req.user.id,
    updatedByName: req.user.name,
    role: 'admin',
    timestamp: new Date().toISOString(),
  };
  db.getJobStatusHistory().push(historyItem);

  db.logAudit({
    userId: req.user.id,
    userName: req.user.name,
    role: 'admin',
    action: 'JOB_ASSIGNED',
    jobId: job.id,
    previousValue: previousWorker || 'None',
    newValue: worker.name,
    details: `Assigned job ${job.id} to worker ${worker.name}`,
  });

  // Notify Worker
  db.addNotification({
    userId: worker.userId,
    recipientRole: 'worker',
    title: 'New Job Assigned',
    message: `You have been assigned job ${job.id} (${job.category}) at ${job.address}`,
    jobId: job.id,
    type: 'worker_assigned',
  });

  // Notify Customer
  db.addNotification({
    recipientRole: 'customer',
    title: 'Technician Assigned',
    message: `Electrician ${worker.name} (${worker.phone}) has been assigned to your request (${job.id}).`,
    jobId: job.id,
    type: 'worker_assigned',
  });

  db.save();
  return res.json(job);
});

// Worker status update handler function
const handleWorkerStatusUpdate = (req: any, res: any) => {
  const user = req.user;
  const worker = db.getWorkers().find((w) => w.userId === user.id);
  if (!worker) return res.status(403).json({ error: 'Worker profile not found' });

  const job = db.getJobs().find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  if (job.assignedWorkerId !== worker.id) {
    return res.status(403).json({ error: 'Not authorized for this job' });
  }

  const { status, notes, latitude, longitude } = req.body;
  const validTransitions: JobStatus[] = ['ACCEPTED', 'ON_THE_WAY', 'REACHED', 'WORK_STARTED'];

  if (status === 'REJECTED') {
    job.assignedWorkerId = undefined;
    job.assignedWorkerName = undefined;
    job.assignedWorkerPhone = undefined;
    job.status = 'REQUESTED';
    worker.availability = 'available';

    const hist: JobStatusHistoryItem = {
      id: `hist-${Date.now()}`,
      jobId: job.id,
      status: 'REQUESTED',
      notes: `Rejected by worker ${worker.name}. Reason: ${notes || 'Busy'}`,
      updatedByUserId: user.id,
      updatedByName: user.name,
      role: 'worker',
      timestamp: new Date().toISOString(),
    };
    db.getJobStatusHistory().push(hist);

    db.addNotification({
      recipientRole: 'admin',
      title: 'Job Rejected by Electrician',
      message: `${worker.name} could not accept job ${job.id}. Please reassign.`,
      jobId: job.id,
      type: 'worker_rejected',
    });

    db.save();
    return res.json(job);
  }

  if (!validTransitions.includes(status)) {
    return res.status(400).json({ error: `Invalid worker status transition: ${status}` });
  }

  job.status = status;
  job.updatedAt = new Date().toISOString();

  if (latitude !== undefined && longitude !== undefined) {
    worker.currentLat = Number(latitude);
    worker.currentLng = Number(longitude);
    worker.locationUpdatedAt = new Date().toISOString();
    worker.isLocationSharing = true;

    // Record in LocationTracking table
    db.addLocationTracking({
      workerId: worker.id,
      workerName: worker.name,
      jobId: job.id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      status,
    });
  }

  if (status === 'ON_THE_WAY') {
    worker.isLocationSharing = true;
  }

  const hist: JobStatusHistoryItem = {
    id: `hist-${Date.now()}`,
    jobId: job.id,
    status,
    notes: notes || `Status updated to ${status}`,
    updatedByUserId: user.id,
    updatedByName: user.name,
    role: 'worker',
    timestamp: new Date().toISOString(),
    locationLat: latitude ? Number(latitude) : undefined,
    locationLng: longitude ? Number(longitude) : undefined,
  };
  db.getJobStatusHistory().push(hist);

  // Notify customer with helpful status message
  let notifMsg = `Job ${job.id} status is now ${status}`;
  let notifType: any = 'work_started';

  if (status === 'ACCEPTED') {
    notifMsg = `${worker.name} has accepted your service request.`;
    notifType = 'worker_accepted';
  } else if (status === 'ON_THE_WAY') {
    notifMsg = `${worker.name} is on the way to your location.`;
    notifType = 'worker_on_the_way';
  } else if (status === 'REACHED') {
    notifMsg = `${worker.name} has reached your service location.`;
    notifType = 'worker_reached';
  } else if (status === 'WORK_STARTED') {
    notifMsg = `${worker.name} has started the electrical repair work.`;
    notifType = 'work_started';
  }

  db.addNotification({
    recipientRole: 'customer',
    title: 'Service Status Update',
    message: notifMsg,
    jobId: job.id,
    type: notifType,
  });

  db.save();
  return res.json(job);
};

// POST /api/jobs/:id/worker-status & POST /api/jobs/:id/status
jobRouter.post('/:id/worker-status', authMiddleware, requireRole('worker'), handleWorkerStatusUpdate);
jobRouter.post('/:id/status', authMiddleware, requireRole('worker'), handleWorkerStatusUpdate);

// Worker complete handler function
const handleWorkerComplete = (req: any, res: any) => {
  const user = req.user;
  const worker = db.getWorkers().find((w) => w.userId === user.id);
  if (!worker) return res.status(403).json({ error: 'Worker profile not found' });

  const job = db.getJobs().find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  if (job.assignedWorkerId !== worker.id) {
    return res.status(403).json({ error: 'Not authorized for this job' });
  }

  const {
    workSummary,
    workerNotes,
    labourCharge,
    additionalCharges,
    additionalChargesReason,
    beforePhotos,
    beforeRepairPhotos,
    afterPhotos,
    afterRepairPhotos,
    materialsList,
    materials,
  } = req.body;

  const now = new Date().toISOString();
  const rawMaterials = Array.isArray(materialsList) ? materialsList : Array.isArray(materials) ? materials : [];

  // Save materials
  if (rawMaterials.length > 0) {
    const allMaterials = db.getJobMaterials();
    const otherMaterials = allMaterials.filter((m) => m.jobId !== job.id);
    db.getJobMaterials().length = 0;
    db.getJobMaterials().push(...otherMaterials);

    rawMaterials.forEach((m: any) => {
      if (m.materialName && Number(m.quantity) > 0) {
        const item: JobMaterial = {
          id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          jobId: job.id,
          materialName: m.materialName,
          quantity: Number(m.quantity) || 1,
          unitPrice: Number(m.unitPrice) || 0,
          totalPrice: (Number(m.quantity) || 1) * (Number(m.unitPrice) || 0),
          addedByWorkerId: worker.id,
          createdAt: now,
        };
        db.getJobMaterials().push(item);
      }
    });
  }

  const summary = workSummary || workerNotes || 'Work completed as requested';
  const beforeList = Array.isArray(beforePhotos) ? beforePhotos : Array.isArray(beforeRepairPhotos) ? beforeRepairPhotos : [];
  const afterList = Array.isArray(afterPhotos) ? afterPhotos : Array.isArray(afterRepairPhotos) ? afterRepairPhotos : [];

  job.workDetails = {
    description: summary,
    workSummary: summary,
    labourCharge: Number(labourCharge) || 0,
    additionalCharges: Number(additionalCharges) || 0,
    additionalChargesReason: additionalChargesReason || '',
    beforePhotos: beforeList,
    afterPhotos: afterList,
    submittedAt: now,
  };

  // Status transitions to WAITING_FOR_ADMIN_VERIFICATION
  job.status = 'WAITING_FOR_ADMIN_VERIFICATION';
  job.completedAt = now;
  job.updatedAt = now;

  // Turn off active location sharing
  worker.isLocationSharing = false;
  worker.availability = 'available';
  worker.completedJobsCount = (worker.completedJobsCount || 0) + 1;

  const hist: JobStatusHistoryItem = {
    id: `hist-${Date.now()}`,
    jobId: job.id,
    status: 'WAITING_FOR_ADMIN_VERIFICATION',
    notes: `Work completed by ${worker.name}. Submitted for Admin verification.`,
    updatedByUserId: user.id,
    updatedByName: user.name,
    role: 'worker',
    timestamp: now,
  };
  db.getJobStatusHistory().push(hist);

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: 'worker',
    action: 'JOB_WORK_SUBMITTED',
    jobId: job.id,
    details: `${worker.name} submitted completion details for job ${job.id}`,
  });

  // Notify Admin for review
  db.addNotification({
    recipientRole: 'admin',
    title: 'Job Completed - Verification Required',
    message: `${worker.name} completed job ${job.id}. Please review materials, labour and set final bill amount.`,
    jobId: job.id,
    type: 'work_completed',
  });

  db.save();
  return res.json(job);
};

// POST /api/jobs/:id/worker-complete & POST /api/jobs/:id/worker-submit
jobRouter.post('/:id/worker-complete', authMiddleware, requireRole('worker'), handleWorkerComplete);
jobRouter.post('/:id/worker-submit', authMiddleware, requireRole('worker'), handleWorkerComplete);

// Admin verification handler function
// STRICT RULE: Only Admin can approve final amount & generate final bill!
const handleAdminVerify = (req: any, res: any) => {
  const user = req.user;
  const job = db.getJobs().find((j) => j.id === req.params.id);

  if (!job) return res.status(404).json({ error: 'Job not found' });

  const { finalAmount, notes, adminVerificationNotes, labourCharge, materialCost, additionalCharges } = req.body;

  if (finalAmount === undefined || isNaN(Number(finalAmount)) || Number(finalAmount) < 0) {
    return res.status(400).json({ error: 'Valid final amount is required' });
  }

  const materials = db.getJobMaterials().filter((m) => m.jobId === job.id);
  const calculatedMatCost = materialCost !== undefined ? Number(materialCost) : materials.reduce((sum, m) => sum + m.totalPrice, 0);
  const calculatedLabour = labourCharge !== undefined ? Number(labourCharge) : (job.workDetails?.labourCharge || 0);
  const calculatedAdditional = additionalCharges !== undefined ? Number(additionalCharges) : (job.workDetails?.additionalCharges || 0);
  const suggestedTotal = calculatedMatCost + calculatedLabour + calculatedAdditional;

  const now = new Date().toISOString();
  const prevAmount = job.finalAmount;

  job.finalAmount = Number(finalAmount);
  job.finalAmountApprovedBy = user.name;
  job.finalAmountApprovedAt = now;
  job.status = 'ADMIN_VERIFIED';
  job.paymentStatus = 'pending';
  job.verifiedAt = now;
  job.updatedAt = now;
  const noteContent = notes || adminVerificationNotes;
  if (noteContent) job.notes = (job.notes ? job.notes + '\n' : '') + `[Verification Note]: ${noteContent}`;

  // Create or Update Invoice
  const invoices = db.getInvoices();
  let invoice = invoices.find((inv) => inv.jobId === job.id);
  if (!invoice) {
    const invCount = invoices.length + 1;
    invoice = {
      id: `INV-${new Date().getFullYear()}-${String(invCount).padStart(4, '0')}`,
      jobId: job.id,
      customerId: job.customerId,
      customerName: job.customerName,
      customerPhone: job.customerPhone,
      customerAddress: job.address,
      workerId: job.assignedWorkerId,
      workerName: job.assignedWorkerName,
      category: job.category,
      materialCost: calculatedMatCost,
      labourCharge: calculatedLabour,
      additionalCharges: calculatedAdditional,
      suggestedTotal,
      finalAmount: Number(finalAmount),
      approvedByAdminId: user.id,
      approvedByAdminName: user.name,
      approvedAt: now,
      status: 'pending',
      createdAt: now,
    };
    invoices.push(invoice);
  } else {
    invoice.materialCost = calculatedMatCost;
    invoice.labourCharge = calculatedLabour;
    invoice.additionalCharges = calculatedAdditional;
    invoice.suggestedTotal = suggestedTotal;
    invoice.finalAmount = Number(finalAmount);
    invoice.approvedByAdminId = user.id;
    invoice.approvedByAdminName = user.name;
    invoice.approvedAt = now;
  }

  const hist: JobStatusHistoryItem = {
    id: `hist-${Date.now()}`,
    jobId: job.id,
    status: 'ADMIN_VERIFIED',
    notes: `Bill verified and approved by Admin ${user.name}. Final Amount: ₹${finalAmount}`,
    updatedByUserId: user.id,
    updatedByName: user.name,
    role: 'admin',
    timestamp: now,
  };
  db.getJobStatusHistory().push(hist);

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: 'admin',
    action: 'JOB_VERIFIED_BILL_APPROVED',
    jobId: job.id,
    previousValue: prevAmount ? `₹${prevAmount}` : `Suggested ₹${suggestedTotal}`,
    newValue: `₹${finalAmount}`,
    details: `Admin ${user.name} approved final amount ₹${finalAmount} for job ${job.id}`,
  });

  // Notify Customer that final bill is approved and ready
  db.addNotification({
    recipientRole: 'customer',
    title: 'Bill Approved & Ready',
    message: `Your electrical service (${job.id}) bill of ₹${finalAmount} has been approved. You can now view invoice and make payment.`,
    jobId: job.id,
    type: 'bill_approved',
  });

  db.save();
  return res.json({ job, invoice });
};

// POST /api/jobs/:id/admin-verify & POST /api/jobs/:id/verify
jobRouter.post('/:id/admin-verify', authMiddleware, requireRole('admin'), handleAdminVerify);
jobRouter.post('/:id/verify', authMiddleware, requireRole('admin'), handleAdminVerify);

// GET /api/jobs/customer/:customerId/history (Full previous repair history for a customer)
jobRouter.get('/customer/:customerId/history', authMiddleware, (req: any, res) => {
  const { customerId } = req.params;
  const user = req.user;

  const customer = db.getCustomers().find((c) => c.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  if (user.role === 'customer' && customer.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const jobs = db.getJobs().filter((j) => j.customerId === customer.id && (user.role === 'admin' ? true : !j.isDeleted));
  const allMaterials = db.getJobMaterials();

  const history = jobs.map((j) => ({
    ...j,
    materials: allMaterials.filter((m) => m.jobId === j.id),
  }));

  return res.json(history.reverse());
});

// Helper to check 7-year retention rule
const isJobOlderThanSevenYears = (createdAtStr?: string): boolean => {
  if (!createdAtStr) return false;
  const createdDate = new Date(createdAtStr).getTime();
  if (isNaN(createdDate)) return false;
  const sevenYearsMs = 7 * 365.25 * 24 * 60 * 60 * 1000;
  return Date.now() - createdDate > sevenYearsMs;
};

// DELETE /api/jobs/:id (Admin only - Permanent Hard Delete single service history / job)
jobRouter.delete('/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
  const user = req.user;
  const jobId = req.params.id;

  const job = db.getJobs().find((j) => j.id === jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const customerName = job.customerName;
  const category = job.category;

  const deleted = db.permanentDeleteJob(jobId);
  if (!deleted) {
    return res.status(404).json({ error: 'Job not found' });
  }

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: 'admin',
    action: 'HARD_DELETE_HISTORY',
    jobId,
    details: `Admin permanently purged job/history ${jobId} (${category} for ${customerName}). Record removed from database.`,
  });

  return res.json({
    success: true,
    message: 'history permanently deleted',
    id: jobId,
    isHardDeleted: true,
  });
});

// POST /api/jobs/bulk-delete (Admin only - Permanently delete multiple history records)
jobRouter.post('/bulk-delete', authMiddleware, requireRole('admin'), (req: any, res) => {
  const user = req.user;
  const { jobIds } = req.body || {};

  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return res.status(400).json({ error: 'Array of jobIds is required for bulk deletion' });
  }

  let deletedCount = 0;
  const processedIds: string[] = [];

  jobIds.forEach((id) => {
    const success = db.permanentDeleteJob(id);
    if (success) {
      deletedCount++;
      processedIds.push(id);
    }
  });

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: 'admin',
    action: 'HARD_DELETE_HISTORY',
    details: `Admin permanently purged ${deletedCount} history records (${processedIds.join(', ')}). Records removed from database.`,
  });

  return res.json({
    success: true,
    deletedCount,
    processedIds,
    message: `${deletedCount} history records permanently deleted`,
  });
});

