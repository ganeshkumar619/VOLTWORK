import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  User,
  CustomerProfile,
  WorkerProfile,
  ServiceCategory,
  Job,
  JobMaterial,
  JobStatusHistoryItem,
  Invoice,
  PaymentRecord,
  SalaryRecord,
  AttendanceRecord,
  NotificationItem,
  SMSLog,
  AuditLog,
  LocationTracking,
  CompanySettings,
} from '../types/index.ts';

interface DatabaseSchema {
  users: User[];
  customers: CustomerProfile[];
  workers: WorkerProfile[];
  serviceCategories: ServiceCategory[];
  jobs: Job[];
  jobMaterials: JobMaterial[];
  jobStatusHistory: JobStatusHistoryItem[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  salaryRecords: SalaryRecord[];
  attendance: AttendanceRecord[];
  notifications: NotificationItem[];
  smsLogs: SMSLog[];
  auditLogs: AuditLog[];
  locationTracking: LocationTracking[];
  companySettings: CompanySettings;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'voltwork.db.json');

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'VoltWork AI Electrical Services',
  tagline: 'Smart Electrical Service & Diagnostics',
  adminLocation: {
    village: 'Mudukkumeendanpatti',
    taluk: 'Kovilpatti',
    district: 'Thoothukudi',
    state: 'Tamilnadu',
    pincode: '628716',
    formattedAddress: 'Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716',
    latitude: 9.17,
    longitude: 77.87,
  },
  serviceArea: {
    defaultLocation: 'Kovilpatti, Thoothukudi District, Tamilnadu - 628716',
    district: 'Thoothukudi',
    state: 'Tamilnadu',
    primaryPincode: '628716',
    serviceRadiusKm: 25,
    serviceZones: [
      '628716 (Mudukkumeendanpatti / HQ)',
      '628501 (Kovilpatti Main)',
      '628502 (Kovilpatti North / Industrial)',
      '628503 (Kovilpatti East)',
      '628720 (Kayathar Sub-Division)',
      '628714 (Kadambur Zone)',
      '628552 (Ilayarasanendal)',
    ],
  },
  businessAddress: 'Mudukkumeendanpatti, Kovilpatti, Thoothukudi District, Tamilnadu - 628716',
  phone: '+91 98765 43210',
  email: 'admin@voltwork.ai',
  gstin: '33AAAAA0000A1Z5',
  registrationNumber: 'TN-EL-2026-9941',
  timezone: 'Asia/Kolkata',
  timezoneOffset: 'UTC+5:30',
  updatedAt: new Date().toISOString(),
};

// Default electrical service categories
const DEFAULT_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-fan',
    name: 'Fan Repair',
    requiredSkill: 'Fan Repair',
    defaultRefPrice: 350,
    description: 'Ceiling fan, exhaust fan, regulator replacement, bearing and winding fix',
    iconName: 'Fan',
  },
  {
    id: 'cat-light',
    name: 'Light Repair',
    requiredSkill: 'Lighting',
    defaultRefPrice: 250,
    description: 'LED lights, tube lights, chandelier, panel lights, floodlight repair',
    iconName: 'Lamp',
  },
  {
    id: 'cat-switch',
    name: 'Switch Repair',
    requiredSkill: 'Switchgear',
    defaultRefPrice: 200,
    description: 'Modular switch replacement, faulty switchboard, gang box inspection',
    iconName: 'ToggleRight',
  },
  {
    id: 'cat-socket',
    name: 'Socket Repair',
    requiredSkill: 'Switchgear',
    defaultRefPrice: 250,
    description: '16A power socket, 6A standard socket, earthing check, burnt pin fix',
    iconName: 'Plug',
  },
  {
    id: 'cat-wiring',
    name: 'Wiring',
    requiredSkill: 'Wiring',
    defaultRefPrice: 1200,
    description: 'Complete home wiring, conduit wiring, short circuit isolation, re-wiring',
    iconName: 'Cable',
  },
  {
    id: 'cat-mcb',
    name: 'MCB / DB',
    requiredSkill: 'MCB / DB',
    defaultRefPrice: 800,
    description: 'Distribution board overhaul, MCB tripping fix, RCCB / ELCB installation',
    iconName: 'ShieldAlert',
  },
  {
    id: 'cat-motor',
    name: 'Motor',
    requiredSkill: 'Motors',
    defaultRefPrice: 1500,
    description: 'Single/Three-phase motor starter, winding diagnosis, capacitor change',
    iconName: 'Cpu',
  },
  {
    id: 'cat-pump',
    name: 'Pump',
    requiredSkill: 'Motors',
    defaultRefPrice: 950,
    description: 'Submersible pump, borewell starter, monoblock water pump electricals',
    iconName: 'Activity',
  },
  {
    id: 'cat-inverter',
    name: 'Inverter',
    requiredSkill: 'Inverter',
    defaultRefPrice: 850,
    description: 'Inverter home backup wiring, battery connection, changeover switch',
    iconName: 'BatteryCharging',
  },
  {
    id: 'cat-appliance',
    name: 'Appliance Electrical Issue',
    requiredSkill: 'Appliances',
    defaultRefPrice: 600,
    description: 'Geyser, heater, AC point electrical line, washing machine plug points',
    iconName: 'Wrench',
  },
  {
    id: 'cat-new-install',
    name: 'New Electrical Installation',
    requiredSkill: 'Wiring',
    defaultRefPrice: 3500,
    description: 'Full house electrification, meter box connection, earthing rod setup',
    iconName: 'Building',
  },
  {
    id: 'cat-emergency',
    name: 'Emergency',
    requiredSkill: 'Emergency',
    defaultRefPrice: 1000,
    description: 'Electrical fire sparks, total power blackout, neutral wire break',
    iconName: 'Flame',
  },
  {
    id: 'cat-other',
    name: 'Other',
    requiredSkill: 'General',
    defaultRefPrice: 400,
    description: 'General electrical inspection, energy audit, miscellaneous repairs',
    iconName: 'HelpCircle',
  },
];

// Helper to hash passwords
export function hashPassword(plain: string): string {
  return crypto.createHash('sha256').update(plain + 'voltwork_salt_2026').digest('hex');
}

export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    timestamp: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifyToken(token?: string): { id: string; email: string; role: string; name: string } | null {
  if (!token) return null;
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.id && parsed.role) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    customers: [],
    workers: [],
    serviceCategories: [],
    jobs: [],
    jobMaterials: [],
    jobStatusHistory: [],
    invoices: [],
    payments: [],
    salaryRecords: [],
    attendance: [],
    notifications: [],
    smsLogs: [],
    auditLogs: [],
    locationTracking: [],
    companySettings: { ...DEFAULT_COMPANY_SETTINGS },
  };

  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading db file, re-initializing:', err);
        this.bootstrap();
      }
    } else {
      this.bootstrap();
    }

    // Ensure default categories exist
    if (!this.data.serviceCategories || this.data.serviceCategories.length === 0) {
      this.data.serviceCategories = [...DEFAULT_CATEGORIES];
      this.save();
    }

    // Ensure initial admin, workers, and sample customers exist if empty
    if (!this.data.users || this.data.users.length === 0) {
      this.bootstrap();
    } else {
      // Ensure admin exists and has username
      const admin = this.data.users.find((u) => u.role === 'admin');
      if (!admin) {
        const defaultAdmin: User & { passwordHash: string } = {
          id: 'usr-admin-01',
          name: 'Ganesh Kumar',
          username: 'admin',
          email: 'admin@voltwork.ai',
          phone: '+91 98400 00000',
          role: 'admin',
          address: 'Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716',
          location: 'Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716',
          village: 'Mudukkumeendanpatti',
          taluk: 'Kovilpatti',
          district: 'Thoothukudi',
          state: 'Tamilnadu',
          pincode: '628716',
          latitude: 9.17,
          longitude: 77.87,
          createdAt: new Date().toISOString(),
          status: 'active',
          avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Ganesh',
          passwordHash: hashPassword('admin123'),
        } as any;
        this.data.users.push(defaultAdmin);
        this.save();
      } else {
        if (!admin.username) {
          admin.username = 'admin';
          this.save();
        }
      }

      // Backfill usernames for workers and customers if missing
      let modified = false;
      this.data.users.forEach((u) => {
        if (!u.username) {
          if (u.role === 'admin') u.username = 'admin';
          else if (u.role === 'worker') {
            const raw = (u.name || 'worker').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 20);
            u.username = `${raw}_tech`;
          } else {
            const raw = (u.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 20);
            u.username = `${raw}_${u.id.slice(-4)}`;
          }
          modified = true;
        }
      });

      // Synchronize worker profiles with usernames
      this.data.workers.forEach((w) => {
        const u = this.data.users.find((usr) => usr.id === w.userId);
        if (u && u.username) {
          w.username = u.username;
          w.workerHandle = `@${u.username}`;
          modified = true;
        }
      });

      // Synchronize customer profiles with usernames
      this.data.customers.forEach((c) => {
        const u = this.data.users.find((usr) => usr.id === c.userId);
        if (u && u.username) {
          c.username = u.username;
          modified = true;
        }
      });

      if (modified) {
        this.save();
      }
    }

    // Ensure companySettings exists
    if (!this.data.companySettings || !this.data.companySettings.adminLocation) {
      this.data.companySettings = { ...DEFAULT_COMPANY_SETTINGS };
      this.save();
    } else {
      // Synchronize latest location details
      this.data.companySettings.adminLocation = { ...DEFAULT_COMPANY_SETTINGS.adminLocation };
      this.data.companySettings.serviceArea = { ...DEFAULT_COMPANY_SETTINGS.serviceArea };
      this.data.companySettings.businessAddress = DEFAULT_COMPANY_SETTINGS.businessAddress;
    }

    this.isLoaded = true;
  }

  private bootstrap() {
    const now = new Date().toISOString();

    const defaultAdmin: User & { passwordHash: string } = {
      id: 'usr-admin-01',
      name: 'Ganesh Kumar',
      username: 'admin',
      email: 'admin@voltwork.ai',
      phone: '+91 98400 00000',
      role: 'admin',
      address: 'Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716',
      location: 'Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716',
      village: 'Mudukkumeendanpatti',
      taluk: 'Kovilpatti',
      district: 'Thoothukudi',
      state: 'Tamilnadu',
      pincode: '628716',
      latitude: 9.17,
      longitude: 77.87,
      createdAt: now,
      status: 'active',
      avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Ganesh',
      passwordHash: hashPassword('admin123'),
    } as any;

    const workerUser1: User & { passwordHash: string } = {
      id: 'usr-worker-01',
      name: 'Murugan Electrician',
      username: 'murugan_tech',
      email: 'murugan@voltwork.ai',
      phone: '+91 98421 11223',
      role: 'worker',
      address: 'Kovilpatti Main Road, Thoothukudi - 628501',
      location: 'Kovilpatti, Thoothukudi - 628501',
      village: 'Kovilpatti',
      taluk: 'Kovilpatti',
      district: 'Thoothukudi',
      state: 'Tamilnadu',
      pincode: '628501',
      latitude: 9.172,
      longitude: 77.868,
      createdAt: now,
      status: 'active',
      avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Murugan',
      passwordHash: hashPassword('worker123'),
    } as any;

    const workerUser2: User & { passwordHash: string } = {
      id: 'usr-worker-02',
      name: 'Karthik R',
      username: 'karthik_volt',
      email: 'karthik@voltwork.ai',
      phone: '+91 98422 22334',
      role: 'worker',
      address: 'Kayathar Bus Stand Road, Thoothukudi - 628720',
      location: 'Kayathar, Thoothukudi - 628720',
      village: 'Kayathar',
      taluk: 'Kovilpatti',
      district: 'Thoothukudi',
      state: 'Tamilnadu',
      pincode: '628720',
      latitude: 9.045,
      longitude: 77.785,
      createdAt: now,
      status: 'active',
      avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Karthik',
      passwordHash: hashPassword('worker123'),
    } as any;

    const customerUser1: User & { passwordHash: string } = {
      id: 'usr-cust-01',
      name: 'Ravi Kumar',
      username: 'ravi_k',
      email: 'ravi_k@voltwork.user',
      phone: '+91 98401 23456',
      role: 'customer',
      address: '14, Gandhi Nagar, Kovilpatti, Thoothukudi - 628502',
      location: 'Gandhi Nagar, Kovilpatti - 628502',
      doorNo: '14',
      street: 'Gandhi Nagar 2nd Street',
      area: 'Kovilpatti',
      city: 'Kovilpatti',
      district: 'Thoothukudi',
      state: 'Tamilnadu',
      pincode: '628502',
      latitude: 9.175,
      longitude: 77.875,
      createdAt: now,
      status: 'active',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ravi',
      passwordHash: hashPassword('customer123'),
    } as any;

    const workerProfile1: WorkerProfile = {
      id: 'wrk-01',
      userId: 'usr-worker-01',
      name: 'Murugan Electrician',
      email: 'murugan@voltwork.ai',
      phone: '+91 98421 11223',
      skills: ['Wiring', 'Fan Repair', 'MCB / DB', 'Emergency'],
      experienceYears: 8,
      address: 'Kovilpatti Main Road, Thoothukudi - 628501',
      currentLat: 9.172,
      currentLng: 77.868,
      isLocationSharing: true,
      availability: 'available',
      joiningDate: '2024-01-15',
      employmentType: 'full_time',
      salaryType: 'monthly',
      basicSalary: 22000,
      commissionRate: 10,
      status: 'active',
      completedJobsCount: 42,
      rating: 4.9,
    };

    const workerProfile2: WorkerProfile = {
      id: 'wrk-02',
      userId: 'usr-worker-02',
      name: 'Karthik R',
      email: 'karthik@voltwork.ai',
      phone: '+91 98422 22334',
      skills: ['Inverter', 'Motors', 'Pump', 'Appliances'],
      experienceYears: 5,
      address: 'Kayathar Bus Stand Road, Thoothukudi - 628720',
      currentLat: 9.045,
      currentLng: 77.785,
      isLocationSharing: true,
      availability: 'available',
      joiningDate: '2024-06-01',
      employmentType: 'full_time',
      salaryType: 'monthly',
      basicSalary: 18000,
      commissionRate: 10,
      status: 'active',
      completedJobsCount: 28,
      rating: 4.8,
    };

    const customerProfile1: CustomerProfile = {
      id: 'cust-01',
      userId: 'usr-cust-01',
      name: 'Ravi Kumar',
      email: 'customer@email.com',
      phone: '+91 98401 23456',
      address: '14, Gandhi Nagar, Kovilpatti, Thoothukudi - 628502',
      doorNo: '14',
      street: 'Gandhi Nagar 2nd Street',
      area: 'Kovilpatti',
      city: 'Kovilpatti',
      district: 'Thoothukudi',
      state: 'Tamilnadu',
      pincode: '628502',
      latitude: 9.175,
      longitude: 77.875,
      createdAt: now,
      totalJobs: 1,
      totalSpent: 1200,
      status: 'active',
    };

    const sampleJob: Job = {
      id: 'JOB-1001',
      customerId: 'cust-01',
      customerName: 'Ravi Kumar',
      customerPhone: '+91 98401 23456',
      customerEmail: 'customer@email.com',
      address: '14, Gandhi Nagar, Kovilpatti, Thoothukudi - 628502',
      doorNo: '14',
      street: 'Gandhi Nagar 2nd Street',
      area: 'Kovilpatti',
      city: 'Kovilpatti',
      district: 'Thoothukudi',
      state: 'Tamilnadu',
      pincode: '628502',
      latitude: 9.175,
      longitude: 77.875,
      description: 'Main hall ceiling fan not rotating, humming noise observed.',
      category: 'Fan Repair',
      priority: 'medium',
      status: 'ASSIGNED',
      assignedWorkerId: 'wrk-01',
      assignedWorkerName: 'Murugan Electrician',
      assignedWorkerPhone: '+91 98421 11223',
      paymentStatus: 'pending',
      suggestedTotal: 350,
      createdAt: now,
      updatedAt: now,
    };

    this.data = {
      users: [defaultAdmin, workerUser1, workerUser2, customerUser1],
      customers: [customerProfile1],
      workers: [workerProfile1, workerProfile2],
      serviceCategories: [...DEFAULT_CATEGORIES],
      jobs: [sampleJob],
      jobMaterials: [],
      jobStatusHistory: [
        {
          id: 'hist-01',
          jobId: 'JOB-1001',
          status: 'REQUESTED',
          notes: 'Customer created new job request',
          updatedByUserId: 'usr-cust-01',
          updatedByName: 'Ravi Kumar',
          role: 'customer',
          timestamp: now,
        },
        {
          id: 'hist-02',
          jobId: 'JOB-1001',
          status: 'ASSIGNED',
          notes: 'Assigned to Murugan Electrician',
          updatedByUserId: 'usr-admin-01',
          updatedByName: 'Ganesh Kumar',
          role: 'admin',
          timestamp: now,
        },
      ],
      invoices: [],
      payments: [],
      salaryRecords: [],
      attendance: [
        {
          id: 'att-01',
          workerId: 'wrk-01',
          workerName: 'Murugan Electrician',
          date: new Date().toISOString().split('T')[0],
          status: 'present',
          checkIn: '08:30:00',
          notes: 'Kovilpatti HQ',
        },
      ],
      notifications: [],
      smsLogs: [],
      auditLogs: [],
      locationTracking: [],
      companySettings: { ...DEFAULT_COMPANY_SETTINGS },
    };
    this.save();
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // Getters
  public getUsers() {
    return this.data.users;
  }
  public getCustomers() {
    return this.data.customers;
  }
  public getWorkers() {
    return this.data.workers;
  }
  public getServiceCategories() {
    return this.data.serviceCategories;
  }
  public getJobs() {
    return this.data.jobs;
  }
  public getJobMaterials() {
    return this.data.jobMaterials;
  }
  public getJobStatusHistory() {
    return this.data.jobStatusHistory;
  }
  public getInvoices() {
    return this.data.invoices;
  }
  public getPayments() {
    return this.data.payments;
  }
  public getSalaryRecords() {
    return this.data.salaryRecords;
  }
  public getAttendance() {
    return this.data.attendance;
  }
  public getNotifications() {
    return this.data.notifications;
  }
  public getSMSLogs() {
    return this.data.smsLogs;
  }
  public getAuditLogs() {
    return this.data.auditLogs;
  }

  // --- Permanent Database Deletion Methods (Hard Delete, No Soft Delete, Cascades All Related) ---

  public permanentDeleteJob(jobId: string): boolean {
    const jobIdx = this.data.jobs.findIndex((j) => j.id === jobId);
    if (jobIdx === -1) return false;

    // 1. Remove job
    this.data.jobs.splice(jobIdx, 1);

    // 2. Cascade delete materials
    this.data.jobMaterials = this.data.jobMaterials.filter((m) => m.jobId !== jobId);

    // 3. Cascade delete status history
    this.data.jobStatusHistory = this.data.jobStatusHistory.filter((h) => h.jobId !== jobId);

    // 4. Cascade delete invoices
    this.data.invoices = this.data.invoices.filter((inv) => inv.jobId !== jobId && inv.id !== jobId);

    // 5. Cascade delete payments
    this.data.payments = this.data.payments.filter((p) => p.jobId !== jobId && p.invoiceId !== jobId);

    // 6. Cascade delete notifications
    this.data.notifications = this.data.notifications.filter((n) => n.jobId !== jobId);

    // 7. Cascade delete sms logs
    this.data.smsLogs = this.data.smsLogs.filter((s) => s.jobId !== jobId);

    // 8. Cascade delete location tracking
    if (this.data.locationTracking) {
      this.data.locationTracking = this.data.locationTracking.filter((l) => l.jobId !== jobId);
    }

    this.save();
    return true;
  }

  public permanentDeleteMessage(messageId: string): boolean {
    let found = false;

    // Check notifications
    const notifIdx = this.data.notifications.findIndex((n) => n.id === messageId);
    if (notifIdx !== -1) {
      this.data.notifications.splice(notifIdx, 1);
      found = true;
    }

    // Check SMS logs
    const smsIdx = this.data.smsLogs.findIndex((s) => s.id === messageId);
    if (smsIdx !== -1) {
      this.data.smsLogs.splice(smsIdx, 1);
      found = true;
    }

    if (found) {
      this.save();
    }
    return found;
  }

  public permanentDeleteWorker(workerId: string): boolean {
    const workerIdx = this.data.workers.findIndex((w) => w.id === workerId || w.userId === workerId);
    if (workerIdx === -1) return false;

    const worker = this.data.workers[workerIdx];
    const targetUserId = worker.userId || worker.id;
    const targetWorkerId = worker.id;

    // 1. Remove from workers
    this.data.workers.splice(workerIdx, 1);

    // 2. Remove user auth record
    const userIdx = this.data.users.findIndex((u) => u.id === targetUserId || u.id === targetWorkerId);
    if (userIdx !== -1) {
      this.data.users.splice(userIdx, 1);
    }

    // 3. Cascade delete attendance
    this.data.attendance = this.data.attendance.filter((a) => a.workerId !== targetWorkerId && a.workerId !== targetUserId);

    // 4. Cascade delete salary records
    this.data.salaryRecords = this.data.salaryRecords.filter((s) => s.workerId !== targetWorkerId && s.workerId !== targetUserId);

    // 5. Cascade delete location tracking
    if (this.data.locationTracking) {
      this.data.locationTracking = this.data.locationTracking.filter((l) => l.workerId !== targetWorkerId && l.workerId !== targetUserId);
    }

    // 6. Cascade delete worker notifications
    this.data.notifications = this.data.notifications.filter((n) => n.userId !== targetUserId && n.userId !== targetWorkerId);

    // 7. Unassign from any jobs
    this.data.jobs.forEach((j) => {
      if (j.assignedWorkerId === targetWorkerId || j.assignedWorkerId === targetUserId) {
        delete (j as any).assignedWorkerId;
        delete (j as any).assignedWorkerName;
        delete (j as any).assignedWorkerPhone;
        if (['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'REACHED', 'WORK_STARTED'].includes(j.status)) {
          j.status = 'REQUESTED';
        }
      }
    });

    this.save();
    return true;
  }

  public permanentDeleteBill(billId: string): boolean {
    let found = false;

    // Check invoices
    const invIdx = this.data.invoices.findIndex((inv) => inv.id === billId || inv.jobId === billId);
    if (invIdx !== -1) {
      const inv = this.data.invoices[invIdx];
      const associatedJobId = inv.jobId;
      this.data.invoices.splice(invIdx, 1);
      found = true;

      // Delete associated payments
      this.data.payments = this.data.payments.filter((p) => p.invoiceId !== inv.id && p.jobId !== associatedJobId && p.id !== billId);

      // Reset job billing status if job still exists
      const job = this.data.jobs.find((j) => j.id === associatedJobId);
      if (job) {
        job.paymentStatus = 'pending';
        if (job.status === 'PAID') {
          job.status = 'ADMIN_VERIFIED';
        }
      }
    }

    // Check payments if deleted directly by payment ID
    const payIdx = this.data.payments.findIndex((p) => p.id === billId);
    if (payIdx !== -1) {
      const pay = this.data.payments[payIdx];
      this.data.payments.splice(payIdx, 1);
      found = true;

      // If associated invoice exists and has no remaining payments, mark invoice pending
      const remainingPay = this.data.payments.filter((p) => p.invoiceId === pay.invoiceId);
      if (remainingPay.length === 0) {
        const inv = this.data.invoices.find((i) => i.id === pay.invoiceId || i.jobId === pay.jobId);
        if (inv) {
          inv.status = 'pending';
        }
        const job = this.data.jobs.find((j) => j.id === pay.jobId);
        if (job && job.paymentStatus === 'paid') {
          job.paymentStatus = 'pending';
          job.status = 'ADMIN_VERIFIED';
        }
      }
    }

    if (found) {
      this.save();
    }
    return found;
  }
  public getLocationTracking() {
    if (!this.data.locationTracking) {
      this.data.locationTracking = [];
    }
    return this.data.locationTracking;
  }

  public addLocationTracking(entry: Omit<LocationTracking, 'id' | 'timestamp'>) {
    const item: LocationTracking = {
      id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.getLocationTracking().push(item);
    this.save();
    return item;
  }

  public getCompanySettings(): CompanySettings {
    if (!this.data.companySettings || !this.data.companySettings.adminLocation) {
      this.data.companySettings = { ...DEFAULT_COMPANY_SETTINGS };
      this.save();
    }
    return this.data.companySettings;
  }

  public updateCompanySettings(updates: Partial<CompanySettings>): CompanySettings {
    const current = this.getCompanySettings();
    this.data.companySettings = {
      ...current,
      ...updates,
      adminLocation: {
        ...current.adminLocation,
        ...(updates.adminLocation || {}),
      },
      serviceArea: {
        ...current.serviceArea,
        ...(updates.serviceArea || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    // Keep admin user location synced if changed
    const adminUser = this.data.users?.find((u) => u.role === 'admin');
    if (adminUser && this.data.companySettings.adminLocation) {
      adminUser.address = this.data.companySettings.adminLocation.formattedAddress;
      adminUser.location = this.data.companySettings.adminLocation.formattedAddress;
      adminUser.village = this.data.companySettings.adminLocation.village;
      adminUser.taluk = this.data.companySettings.adminLocation.taluk;
      adminUser.district = this.data.companySettings.adminLocation.district;
      adminUser.state = this.data.companySettings.adminLocation.state;
      adminUser.pincode = this.data.companySettings.adminLocation.pincode;
      adminUser.latitude = this.data.companySettings.adminLocation.latitude;
      adminUser.longitude = this.data.companySettings.adminLocation.longitude;
    }

    this.save();
    return this.data.companySettings;
  }

  // Helpers
  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.data.auditLogs.unshift(log);
    this.save();
    return log;
  }

  public addNotification(entry: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>) {
    const item: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      ...entry,
    };
    this.data.notifications.unshift(item);
    this.save();
    return item;
  }
}

export const db = new Database();
