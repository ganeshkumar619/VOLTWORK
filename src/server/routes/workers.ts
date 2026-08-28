import { Router } from 'express';
import { db, hashPassword } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';
import type { WorkerProfile, User } from '../../types/index.ts';

export const workerRouter = Router();

// GET /api/workers (Admin: full details including salary info; Worker/Customer: public profile info)
workerRouter.get('/', authMiddleware, (req: any, res) => {
  const user = req.user;
  const includeDeleted = req.query.includeDeleted === 'true' && user.role === 'admin';
  const allWorkers = db.getWorkers();
  const jobs = db.getJobs();

  const filteredWorkers = allWorkers.filter((w) => {
    const isDel = w.status === 'DELETED' || w.status === 'deleted';
    if (!includeDeleted && isDel) return false;
    return true;
  });

  const enriched = filteredWorkers.map((w) => {
    const workerJobs = jobs.filter((j) => j.assignedWorkerId === w.id && !j.isDeleted);
    const completedCount = workerJobs.filter((j) => j.status === 'COMPLETED' || j.status === 'CLOSED' || j.status === 'PAID' || j.status === 'ADMIN_VERIFIED').length;
    const activeJob = workerJobs.find((j) => ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'REACHED', 'WORK_STARTED'].includes(j.status));

    // Sanitization: If not admin and not the worker themselves, strip private salary/financial data
    const isSelf = user.role === 'worker' && w.userId === user.id;
    const isAdmin = user.role === 'admin';

    const baseData = {
      ...w,
      completedJobsCount: completedCount,
      activeJobId: activeJob?.id,
      activeJobTitle: activeJob?.category,
    };

    if (!isAdmin && !isSelf) {
      delete (baseData as any).basicSalary;
      delete (baseData as any).commissionRate;
      delete (baseData as any).salaryType;
    }

    return baseData;
  });

  return res.json(enriched);
});

// GET /api/workers/me (Worker gets own profile)
workerRouter.get('/me', authMiddleware, (req: any, res) => {
  const user = req.user;
  const worker = db.getWorkers().find((w) => w.userId === user.id || w.id === user.id || w.email === user.email);

  if (!worker) {
    // If user is a worker but workerProfile not linked, return basic info from user object
    return res.json({
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      skills: ['Wiring', 'MCB / DB', 'General Electrical'],
      experienceYears: 3,
      availability: 'available',
      status: 'active',
      joiningDate: user.createdAt,
      completedJobsCount: 0,
      rating: 5.0,
    });
  }

  const jobs = db.getJobs().filter((j) => j.assignedWorkerId === worker.id && !j.isDeleted);
  const completedCount = jobs.filter((j) => ['COMPLETED', 'CLOSED', 'PAID', 'ADMIN_VERIFIED'].includes(j.status)).length;
  const activeJob = jobs.find((j) => ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'REACHED', 'WORK_STARTED'].includes(j.status));

  return res.json({
    ...worker,
    completedJobsCount: completedCount,
    activeJobId: activeJob?.id,
    activeJobTitle: activeJob?.category,
  });
});

// PUT /api/workers/me (Worker updates own profile)
workerRouter.put('/me', authMiddleware, (req: any, res) => {
  const user = req.user;
  const { name, phone, skills, availability, experienceYears, address } = req.body;

  let worker = db.getWorkers().find((w) => w.userId === user.id || w.id === user.id || w.email === user.email);

  if (worker) {
    if (name) worker.name = name;
    if (phone) worker.phone = phone;
    if (skills) worker.skills = Array.isArray(skills) ? skills : [skills];
    if (availability) worker.availability = availability;
    if (experienceYears !== undefined) worker.experienceYears = Number(experienceYears);
    if (address) worker.address = address;

    const u = db.getUsers().find((usr) => usr.id === user.id || usr.email === user.email);
    if (u) {
      if (name) u.name = name;
      if (phone) u.phone = phone;
    }

    db.save();
    return res.json(worker);
  } else {
    // Create new worker profile if missing
    const newWorker: any = {
      id: `wrk-${Date.now()}`,
      userId: user.id,
      name: name || user.name,
      phone: phone || user.phone,
      email: user.email,
      skills: skills || ['Wiring', 'MCB / DB'],
      experienceYears: experienceYears ? Number(experienceYears) : 3,
      salaryType: 'monthly',
      basicSalary: 18000,
      commissionRate: 10,
      address: address || 'Kovilpatti, Tamilnadu',
      status: 'active',
      availability: availability || 'available',
      joiningDate: user.createdAt || new Date().toISOString(),
      rating: 5.0,
      ratingCount: 1,
    };
    db.getWorkers().push(newWorker);
    db.save();
    return res.json(newWorker);
  }
});

// GET /api/workers/:id
workerRouter.get('/:id', authMiddleware, (req: any, res) => {
  const user = req.user;
  const worker = db.getWorkers().find((w) => w.id === req.params.id || w.userId === req.params.id);

  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  const isSelf = user.role === 'worker' && worker.userId === user.id;
  const isAdmin = user.role === 'admin';

  const jobs = db.getJobs().filter((j) => j.assignedWorkerId === worker.id);
  const attendance = db.getAttendance().filter((a) => a.workerId === worker.id);
  const salaries = isAdmin || isSelf ? db.getSalaryRecords().filter((s) => s.workerId === worker.id) : [];

  const responseData: any = {
    ...worker,
    assignedJobs: jobs,
    attendance,
    salaryRecords: salaries,
  };

  if (!isAdmin && !isSelf) {
    delete responseData.basicSalary;
    delete responseData.commissionRate;
    delete responseData.salaryType;
    delete responseData.salaryRecords;
  }

  return res.json(responseData);
});

// POST /api/workers (Admin adds new worker with credentials)
workerRouter.post('/', authMiddleware, requireRole('admin'), (req: any, res) => {
  try {
    const {
      name,
      username,
      phone,
      email,
      password,
      skills,
      experienceYears,
      address,
      employmentType,
      salaryType,
      basicSalary,
      commissionRate,
    } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, mobile number, and login password are required' });
    }

    const users = db.getUsers();
    
    // Generate clean username / Instagram-like handle
    let cleanUsername = (username || '').trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '_');
    if (!cleanUsername || cleanUsername.length < 3) {
      const baseName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 15);
      cleanUsername = `${baseName}_tech`;
    }

    // Ensure unique username
    let finalUsername = cleanUsername;
    let counter = 1;
    while (users.some((u) => u.username?.toLowerCase() === finalUsername)) {
      finalUsername = `${cleanUsername}_${counter}`;
      counter++;
    }

    const cleanEmail = (email && email.trim()) ? email.trim().toLowerCase() : `${finalUsername}@voltwork.ai`;
    const cleanPhone = phone.trim();

    const existingPhone = users.find((u) => u.phone && u.phone.replace(/\D/g, '').endsWith(cleanPhone.replace(/\D/g, '')));
    if (existingPhone) {
      return res.status(400).json({ error: `Phone number is already assigned to ${existingPhone.name} (${existingPhone.username || existingPhone.role})` });
    }

    const userId = `usr-work-${Date.now()}`;
    const workerId = `work-${Date.now()}`;
    const now = new Date().toISOString();

    const newUser: any = {
      id: userId,
      name: name.trim(),
      username: finalUsername,
      email: cleanEmail,
      phone: cleanPhone,
      role: 'worker',
      avatarUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(name.trim())}`,
      createdAt: now,
      status: 'active',
      passwordHash: hashPassword(password),
    };

    const newWorker: WorkerProfile = {
      id: workerId,
      userId,
      name: name.trim(),
      username: finalUsername,
      workerHandle: `@${finalUsername}`,
      phone: cleanPhone,
      email: cleanEmail,
      avatarUrl: newUser.avatarUrl,
      skills: Array.isArray(skills) ? skills : skills ? [skills] : ['Wiring', 'General Electrical'],
      experienceYears: Number(experienceYears) || 1,
      address: address || 'Kovilpatti, Thoothukudi',
      availability: 'available',
      isLocationSharing: false,
      joiningDate: now.split('T')[0],
      employmentType: employmentType || 'full_time',
      salaryType: salaryType || 'monthly',
      basicSalary: Number(basicSalary) || 18000,
      commissionRate: Number(commissionRate) || 5,
      status: 'active',
      completedJobsCount: 0,
      rating: 5.0,
    };

    users.push(newUser);
    db.getWorkers().push(newWorker);
    db.save();

    db.logAudit({
      userId: req.user.id,
      userName: req.user.name,
      role: 'admin',
      action: 'WORKER_CREATED',
      details: `Admin added electrician/worker ${name} with Handle: @${finalUsername} | Phone: ${cleanPhone}`,
    });

    db.addNotification({
      recipientRole: 'admin',
      title: 'New Electrician Added',
      message: `${name} (@${finalUsername}) has been registered as a field technician.`,
      type: 'salary_updated',
    });

    return res.status(201).json({
      ...newWorker,
      credentials: {
        username: finalUsername,
        workerHandle: `@${finalUsername}`,
        password,
      },
    });
  } catch (error) {
    console.error('Create worker error:', error);
    return res.status(500).json({ error: 'Failed to create worker' });
  }
});

// PUT /api/workers/:id (Admin updates worker, or worker updates own basic profile)
workerRouter.put('/:id', authMiddleware, (req: any, res) => {
  const user = req.user;
  const worker = db.getWorkers().find((w) => w.id === req.params.id || w.userId === req.params.id);

  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  const isSelf = user.role === 'worker' && worker.userId === user.id;
  const isAdmin = user.role === 'admin';

  if (!isAdmin && !isSelf) {
    return res.status(403).json({ error: 'Unauthorized to edit worker' });
  }

  const {
    name,
    phone,
    avatarUrl,
    skills,
    experienceYears,
    address,
    availability,
    employmentType,
    salaryType,
    basicSalary,
    commissionRate,
    status,
  } = req.body;

  if (name) worker.name = name;
  if (phone) worker.phone = phone;
  if (avatarUrl) worker.avatarUrl = avatarUrl;
  if (address !== undefined) worker.address = address;

  if (isAdmin) {
    if (skills) worker.skills = Array.isArray(skills) ? skills : [skills];
    if (experienceYears !== undefined) worker.experienceYears = Number(experienceYears);
    if (availability) worker.availability = availability;
    if (employmentType) worker.employmentType = employmentType;
    if (salaryType) worker.salaryType = salaryType;
    if (basicSalary !== undefined) worker.basicSalary = Number(basicSalary);
    if (commissionRate !== undefined) worker.commissionRate = Number(commissionRate);
    if (status) worker.status = status;
  }

  const linkedUser = db.getUsers().find((u) => u.id === worker.userId);
  if (linkedUser) {
    if (name) linkedUser.name = name;
    if (phone) linkedUser.phone = phone;
    if (avatarUrl) linkedUser.avatarUrl = avatarUrl;
    if (status && isAdmin) linkedUser.status = status;
  }

  db.save();
  return res.json(worker);
});

// POST /api/workers/:id/location (Worker updates live GPS location with consent)
workerRouter.post('/:id/location', authMiddleware, (req: any, res) => {
  const user = req.user;
  const worker = db.getWorkers().find((w) => w.id === req.params.id || w.userId === user.id);

  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  // Only worker themselves or admin can update location
  if (user.role === 'worker' && worker.userId !== user.id) {
    return res.status(403).json({ error: 'Cannot update other worker location' });
  }

  const { latitude, longitude, isLocationSharing } = req.body;

  if (latitude !== undefined && longitude !== undefined) {
    worker.currentLat = Number(latitude);
    worker.currentLng = Number(longitude);
    worker.locationUpdatedAt = new Date().toISOString();
  }

  if (isLocationSharing !== undefined) {
    worker.isLocationSharing = Boolean(isLocationSharing);
  }

  db.save();
  return res.json({
    success: true,
    currentLat: worker.currentLat,
    currentLng: worker.currentLng,
    locationUpdatedAt: worker.locationUpdatedAt,
    isLocationSharing: worker.isLocationSharing,
  });
});

// DELETE /api/workers/:id (Admin only - Permanent Hard Delete)
workerRouter.delete('/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
  const user = req.user;
  const workerId = req.params.id;

  const workers = db.getWorkers();
  const worker = workers.find((w) => w.id === workerId || w.userId === workerId);

  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  // Restriction: Cannot delete self
  if (worker.userId === user.id) {
    return res.status(400).json({ error: 'Cannot delete your own administrator account' });
  }

  const workerName = worker.name;
  const workerPhone = worker.phone;

  const deleted = db.permanentDeleteWorker(worker.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: 'admin',
    action: 'HARD_DELETE_WORKER',
    details: `Admin permanently purged worker ${workerName} (${workerPhone}). Record removed from database.`,
  });

  return res.json({
    success: true,
    message: 'workers permanently deleted',
    id: workerId,
  });
});

