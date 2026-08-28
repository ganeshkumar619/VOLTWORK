import { Router } from 'express';
import { db, hashPassword } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';
import type { CustomerProfile, User } from '../../types/index.ts';

export const customerRouter = Router();

// GET /api/customers (Admin only)
customerRouter.get('/', authMiddleware, requireRole('admin'), (req: any, res) => {
  const includeDeleted = req.query.includeDeleted === 'true';
  const allCustomers = db.getCustomers();
  const jobs = db.getJobs();
  const payments = db.getPayments();

  const filteredCustomers = allCustomers.filter((c) => {
    const isDel = c.status === 'DELETED' || c.status === 'deleted';
    if (!includeDeleted && isDel) return false;
    return true;
  });

  const enriched = filteredCustomers.map((c) => {
    const custJobs = jobs.filter((j) => j.customerId === c.id && !j.isDeleted);
    const custPayments = payments.filter((p) => p.customerId === c.id && p.paymentStatus === 'paid');
    const totalSpent = custPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate pending unpaid bills
    const unpaidJobs = custJobs.filter((j) => ['ADMIN_VERIFIED', 'PAYMENT_PENDING'].includes(j.status) && j.paymentStatus === 'pending');
    const unpaidAmount = unpaidJobs.reduce((sum, j) => sum + (j.finalAmount || 0), 0);

    const activeJobs = custJobs.filter((j) => ['REQUESTED', 'AI_ANALYSIS', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'REACHED', 'WORK_STARTED'].includes(j.status));

    return {
      ...c,
      totalJobs: custJobs.length,
      totalJobsCount: custJobs.length,
      totalSpent,
      recentJobs: custJobs.slice(-3),
      unpaidAmount,
      activeJobsCount: activeJobs.length,
    };
  });

  return res.json(enriched);
});

// GET /api/customers/:id
customerRouter.get('/:id', authMiddleware, (req: any, res) => {
  const user = req.user;
  const customerId = req.params.id;
  const customer = db.getCustomers().find((c) => c.id === customerId || c.userId === user.id);

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  // Security: Customer can only view own profile; admin can view any
  if (user.role === 'customer' && customer.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Workers cannot browse unrelated customer profiles directly unless assigned
  if (user.role === 'worker') {
    const isAssigned = db.getJobs().some((j) => j.customerId === customer.id && j.assignedWorkerId === user.id && !j.isDeleted);
    if (!isAssigned) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  const includeDeleted = req.query.includeDeleted === 'true' && user.role === 'admin';
  const jobs = db.getJobs().filter((j) => j.customerId === customer.id && (includeDeleted || !j.isDeleted));
  const payments = db.getPayments().filter((p) => p.customerId === customer.id);
  const totalSpent = payments.filter((p) => p.paymentStatus === 'paid').reduce((sum, p) => sum + p.amount, 0);

  return res.json({
    ...customer,
    totalJobs: jobs.length,
    totalJobsCount: jobs.length,
    totalSpent,
    serviceHistory: jobs,
    payments,
  });
});

// GET /api/customers/:id/history (Customer's complete repair history)
customerRouter.get('/:id/history', authMiddleware, (req: any, res) => {
  const user = req.user;
  const customerId = req.params.id;
  const customer = db.getCustomers().find((c) => c.id === customerId);

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  if (user.role === 'customer' && customer.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const includeDeleted = req.query.includeDeleted === 'true' && user.role === 'admin';
  const jobs = db.getJobs().filter((j) => j.customerId === customer.id && (includeDeleted || !j.isDeleted));
  const allMaterials = db.getJobMaterials();

  const enriched = jobs.map((j) => ({
    ...j,
    materials: allMaterials.filter((m) => m.jobId === j.id),
  }));

  return res.json({
    customer,
    jobs: enriched.reverse(),
    history: enriched,
  });
});

// POST /api/customers (Admin creates customer manually)
customerRouter.post('/', authMiddleware, requireRole('admin'), (req: any, res) => {
  try {
    const { name, phone, email, address, latitude, longitude, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer name and phone are required' });
    }

    const userId = `usr-cust-${Date.now()}`;
    const customerId = `cust-${Date.now()}`;
    const now = new Date().toISOString();

    const userEmail = email ? email.toLowerCase() : `cust_${Date.now()}@voltwork.local`;

    const newUser: any = {
      id: userId,
      name,
      email: userEmail,
      phone,
      role: 'customer',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      createdAt: now,
      status: 'active',
      passwordHash: hashPassword('customer123'),
    };

    const newCustomer: CustomerProfile = {
      id: customerId,
      userId,
      name,
      phone,
      email: userEmail,
      address: address || '',
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      notes: notes || '',
      createdAt: now,
      totalJobs: 0,
      totalJobsCount: 0,
      totalSpent: 0,
      status: 'active',
    };

    db.getUsers().push(newUser);
    db.getCustomers().push(newCustomer);
    db.save();

    db.logAudit({
      userId: req.user.id,
      userName: req.user.name,
      role: 'admin',
      action: 'CUSTOMER_CREATED',
      details: `Admin created customer profile for ${name}`,
    });

    return res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Create customer error:', error);
    return res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT /api/customers/me/profile (Customer updates own address / GPS location)
customerRouter.put('/me/profile', authMiddleware, (req: any, res) => {
  const user = req.user;
  const customer = db.getCustomers().find((c) => c.userId === user.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer profile not found' });
  }

  const {
    address,
    doorNo,
    street,
    area,
    city,
    district,
    state,
    pincode,
    latitude,
    longitude,
    gpsCaptured,
  } = req.body;

  if (address !== undefined) customer.address = address;
  if (doorNo !== undefined) customer.doorNo = doorNo;
  if (street !== undefined) customer.street = street;
  if (area !== undefined) customer.area = area;
  if (city !== undefined) customer.city = city;
  if (district !== undefined) customer.district = district;
  if (state !== undefined) customer.state = state;
  if (pincode !== undefined) customer.pincode = pincode;
  if (latitude !== undefined) customer.latitude = Number(latitude);
  if (longitude !== undefined) customer.longitude = Number(longitude);
  if (gpsCaptured !== undefined) {
    customer.gpsCaptured = Boolean(gpsCaptured);
    customer.gpsCapturedAt = new Date().toISOString();
  }

  // Keep user sync
  const dbUser = db.getUsers().find((u) => u.id === user.id);
  if (dbUser) {
    if (address !== undefined) dbUser.address = address;
    if (doorNo !== undefined) dbUser.doorNo = doorNo;
    if (street !== undefined) dbUser.street = street;
    if (area !== undefined) dbUser.area = area;
    if (city !== undefined) dbUser.city = city;
    if (district !== undefined) dbUser.district = district;
    if (state !== undefined) dbUser.state = state;
    if (pincode !== undefined) dbUser.pincode = pincode;
    if (latitude !== undefined) dbUser.latitude = Number(latitude);
    if (longitude !== undefined) dbUser.longitude = Number(longitude);
    if (gpsCaptured !== undefined) dbUser.gpsCaptured = Boolean(gpsCaptured);
  }

  db.save();
  return res.json({
    success: true,
    message: 'Profile and location updated successfully',
    customer,
  });
});

// PUT /api/customers/:id (Admin updates customer)
customerRouter.put('/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
  const customer = db.getCustomers().find((c) => c.id === req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const {
    name,
    phone,
    email,
    address,
    doorNo,
    street,
    area,
    city,
    district,
    state,
    pincode,
    latitude,
    longitude,
    gpsCaptured,
    notes,
    status,
  } = req.body;

  if (name) customer.name = name;
  if (phone) customer.phone = phone;
  if (email) customer.email = email.toLowerCase();
  if (address !== undefined) customer.address = address;
  if (doorNo !== undefined) customer.doorNo = doorNo;
  if (street !== undefined) customer.street = street;
  if (area !== undefined) customer.area = area;
  if (city !== undefined) customer.city = city;
  if (district !== undefined) customer.district = district;
  if (state !== undefined) customer.state = state;
  if (pincode !== undefined) customer.pincode = pincode;
  if (latitude !== undefined) customer.latitude = Number(latitude);
  if (longitude !== undefined) customer.longitude = Number(longitude);
  if (gpsCaptured !== undefined) {
    customer.gpsCaptured = Boolean(gpsCaptured);
    customer.gpsCapturedAt = new Date().toISOString();
  }
  if (notes !== undefined) customer.notes = notes;
  if (status) customer.status = status;

  const user = db.getUsers().find((u) => u.id === customer.userId);
  if (user) {
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email) user.email = email.toLowerCase();
    if (address !== undefined) user.address = address;
    if (doorNo !== undefined) user.doorNo = doorNo;
    if (street !== undefined) user.street = street;
    if (area !== undefined) user.area = area;
    if (city !== undefined) user.city = city;
    if (district !== undefined) user.district = district;
    if (state !== undefined) user.state = state;
    if (pincode !== undefined) user.pincode = pincode;
    if (latitude !== undefined) user.latitude = Number(latitude);
    if (longitude !== undefined) user.longitude = Number(longitude);
    if (status) user.status = status === 'DELETED' || status === 'inactive' ? 'inactive' : 'active';
  }

  db.save();
  return res.json(customer);
});

// DELETE /api/customers/:id (Admin only - Permanent Hard Delete)
customerRouter.delete('/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
  const user = req.user;
  const customerId = req.params.id;

  const customers = db.getCustomers();
  const customer = customers.find((c) => c.id === customerId);

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  // Restriction: Cannot delete self
  if (customer.userId === user.id) {
    return res.status(400).json({ error: 'Cannot delete your own administrator account' });
  }

  // Hard delete customer and user record
  const custIndex = customers.findIndex((c) => c.id === customer.id);
  if (custIndex !== -1) {
    customers.splice(custIndex, 1);
  }
  const userIndex = db.getUsers().findIndex((u) => u.id === customer.userId);
  if (userIndex !== -1) {
    db.getUsers().splice(userIndex, 1);
  }

  // Remove associated jobs and payments
  const jobs = db.getJobs();
  const remainingJobs = jobs.filter((j) => j.customerId !== customer.id);
  jobs.length = 0;
  jobs.push(...remainingJobs);

  const payments = db.getPayments();
  const remainingPayments = payments.filter((p) => p.customerId !== customer.id);
  payments.length = 0;
  payments.push(...remainingPayments);

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: 'admin',
    action: 'HARD_DELETE_CUSTOMER',
    details: `Admin permanently purged customer ${customer.name} (${customer.phone}) and associated records from database.`,
  });

  db.save();
  return res.json({
    success: true,
    message: 'customer permanently deleted',
    id: customer.id,
    isHardDeleted: true,
  });
});

// DELETE /api/customers/:id/history (Admin only - permanently delete all history records for a customer)
customerRouter.delete('/:id/history', authMiddleware, requireRole('admin'), (req: any, res) => {
  const user = req.user;
  const customerId = req.params.id;

  const customer = db.getCustomers().find((c) => c.id === customerId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const jobs = db.getJobs();
  const customerJobs = jobs.filter((j) => j.customerId === customer.id);
  customerJobs.forEach((j) => {
    db.permanentDeleteJob(j.id);
  });

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: 'admin',
    action: 'HARD_DELETE_CUSTOMER_HISTORY',
    details: `Admin permanently purged all historical jobs for customer ${customer.name}.`,
  });

  return res.json({
    success: true,
    message: `All service history permanently deleted for customer ${customer.name}`,
    deletedCount: customerJobs.length,
  });
});

