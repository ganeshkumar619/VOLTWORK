export type UserRole = 'admin' | 'customer' | 'worker';

export type JobStatus =
  | 'REQUESTED'
  | 'AI_ANALYSIS'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'REACHED'
  | 'WORK_STARTED'
  | 'COMPLETED'
  | 'WAITING_FOR_ADMIN_VERIFICATION'
  | 'ADMIN_VERIFIED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'CLOSED';

export type JobPriority = 'low' | 'medium' | 'high' | 'emergency';

export type WorkerAvailability = 'available' | 'busy' | 'on_job' | 'inactive';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export type SMSStatus = 'Not Sent' | 'Sending' | 'Sent' | 'Failed';

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'half_day';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  address?: string;
  doorNo?: string;
  street?: string;
  area?: string;
  city?: string;
  location?: string;
  village?: string;
  taluk?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  gpsCaptured?: boolean;
  gpsCapturedAt?: string;
  createdAt: string;
  status: 'active' | 'inactive';
  temporaryPassword?: boolean;
  passwordChangedAt?: string;
  lastLogin?: string;
}

export interface AdminLocationDetails {
  village: string;
  taluk: string;
  district: string;
  state: string;
  pincode: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

export interface ServiceAreaDetails {
  defaultLocation: string;
  district: string;
  state: string;
  primaryPincode: string;
  serviceRadiusKm: number;
  serviceZones: string[];
}

export interface CompanySettings {
  name: string;
  tagline: string;
  adminLocation: AdminLocationDetails;
  serviceArea: ServiceAreaDetails;
  businessAddress: string;
  phone: string;
  email: string;
  gstin: string;
  registrationNumber: string;
  timezone: string;
  timezoneOffset: string;
  updatedAt?: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  name: string;
  username?: string;
  phone: string;
  email: string;
  address: string;
  doorNo?: string;
  street?: string;
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  gpsCaptured?: boolean;
  gpsCapturedAt?: string;
  createdAt: string;
  notes?: string;
  totalJobs?: number;
  totalJobsCount?: number;
  totalSpent?: number;
  status?: 'active' | 'inactive' | 'deleted' | 'ACTIVE' | 'INACTIVE' | 'DELETED';
  deletedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
  deletionReason?: string;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  name: string;
  username?: string;
  workerHandle?: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  skills: string[];
  experienceYears: number;
  address: string;
  currentLat?: number;
  currentLng?: number;
  locationUpdatedAt?: string;
  isLocationSharing: boolean;
  availability: WorkerAvailability;
  joiningDate: string;
  employmentType: 'full_time' | 'contract' | 'freelance';
  salaryType: 'monthly' | 'hourly' | 'commission';
  basicSalary: number;
  commissionRate: number; // percentage e.g. 10
  status: 'active' | 'inactive' | 'deleted' | 'ACTIVE' | 'INACTIVE' | 'DELETED';
  activeJobId?: string;
  completedJobsCount?: number;
  rating?: number;
  deletedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
  deletionReason?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  nameTa?: string;
  requiredSkill: string;
  defaultRefPrice: number;
  description: string;
  iconName?: string;
}

export interface ServiceHistoryItem {
  id: string;
  jobId: string;
  category: string;
  description: string;
  solutionNotes?: string;
  finalAmount: number;
  completedDate: string;
  workerName?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
  deletionReason?: string;
}

export interface AIAnalysisResult {
  category?: string;
  serviceCategory: string;
  priority: JobPriority | 'HIGH' | 'MEDIUM' | 'LOW' | 'EMERGENCY';
  requiredSkill: string;
  possibleIssue: string;
  suggestedMaterials: string[];
  estimatedComplexity: 'Low' | 'Medium' | 'High' | 'Expert' | 'Simple' | 'Moderate' | 'Complex' | string;
  confidence?: number;
  engine?: string;
  safetyWarning?: string;
  estimatedPriceRange?: { min: number; max: number };
  diagnosticPoints?: string[];
  timestamp?: string;
}

export interface JobMaterial {
  id: string;
  jobId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedByWorkerId?: string;
  createdAt: string;
}

export interface JobWorkDetails {
  description: string;
  workSummary?: string;
  labourCharge: number;
  additionalCharges: number;
  additionalChargesReason?: string;
  beforePhotos: string[];
  afterPhotos: string[];
  submittedAt?: string;
}

export interface JobStatusHistoryItem {
  id: string;
  jobId: string;
  status: JobStatus;
  notes?: string;
  updatedByUserId: string;
  updatedByName: string;
  role: UserRole;
  timestamp: string;
  locationLat?: number;
  locationLng?: number;
}

export interface Job {
  id: string; // e.g. JOB-1001
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  doorNo?: string;
  street?: string;
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  gpsCaptured?: boolean;
  gpsCapturedAt?: string;
  description: string;
  category: string;
  priority: JobPriority;
  preferredDate?: string;
  problemPhotoUrl?: string;
  aiAnalysis?: AIAnalysisResult;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  assignedWorkerPhone?: string;
  status: JobStatus;
  scheduledDate?: string;
  notes?: string;
  workDetails?: JobWorkDetails;
  materials?: JobMaterial[];
  suggestedTotal?: number;
  finalAmount?: number;
  finalAmountApprovedBy?: string;
  finalAmountApprovedAt?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  verifiedAt?: string;
  closedAt?: string;
  lastSmsStatus?: SMSStatus;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
  deletionReason?: string;
}

export interface Invoice {
  id: string; // INV-1001
  jobId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  workerId?: string;
  workerName?: string;
  category: string;
  materialCost: number;
  labourCharge: number;
  additionalCharges: number;
  suggestedTotal: number;
  finalAmount: number;
  approvedByAdminId: string;
  approvedByAdminName: string;
  approvedAt: string;
  status: PaymentStatus;
  paymentMethod?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string; // PAY-1001
  invoiceId: string;
  jobId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'online';
  paymentStatus: PaymentStatus;
  transactionRef?: string;
  recordedByAdminId?: string;
  recordedByName?: string;
  paymentDate: string;
  notes?: string;
}

export interface SalaryRecord {
  id: string; // SAL-1001
  workerId: string;
  workerName: string;
  salaryPeriod: string; // YYYY-MM e.g. 2026-08
  basicSalary: number;
  commission: number;
  bonus: number;
  deduction: number;
  totalSalary: number; // basic + commission + bonus - deduction
  paidAmount: number;
  remainingAmount: number;
  paymentMethod?: string;
  paymentDate?: string;
  status: 'paid' | 'partial' | 'pending';
  smsStatus?: SMSStatus;
  lastSmsSentAt?: string;
  notes?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm:ss
  checkOut?: string; // HH:mm:ss
  workingHours?: number; // hours e.g. 8.5
  status: AttendanceStatus;
  locationLat?: number;
  locationLng?: number;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string; // If undefined or 'all', targets all or role
  recipientRole?: UserRole | 'all';
  title: string;
  titleTa?: string;
  message: string;
  messageTa?: string;
  jobId?: string;
  type:
    | 'job_created'
    | 'worker_assigned'
    | 'worker_accepted'
    | 'worker_rejected'
    | 'worker_on_the_way'
    | 'worker_reached'
    | 'work_started'
    | 'work_completed'
    | 'admin_verified'
    | 'bill_approved'
    | 'sms_sent'
    | 'payment_received'
    | 'salary_updated';
  isRead: boolean;
  createdAt: string;
}

export interface SMSLog {
  id: string;
  jobId?: string;
  customerId?: string;
  customerName?: string;
  workerId?: string;
  workerName?: string;
  salaryId?: string;
  phoneNumber: string;
  finalAmount?: number;
  messageContent: string;
  smsStatus: SMSStatus;
  type?: 'BILL' | 'SALARY' | 'SYSTEM';
  recipientType?: 'customer' | 'worker';
  sentByAdminId: string;
  sentByName: string;
  sentAt: string;
  providerResponse?: string;
}

export interface LocationTracking {
  id: string;
  workerId: string;
  workerName?: string;
  jobId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  status: JobStatus;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  jobId?: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface BusinessAnalytics {
  totalRevenue: number;
  thisMonthRevenue: number;
  todayRevenue: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  totalSalaryExpense: number;
  pendingSalaryExpense: number;
  estimatedProfit: number;
  totalJobsCount: number;
  pendingJobsCount: number;
  activeJobsCount: number;
  completedJobsCount: number;
  totalWorkersCount: number;
  availableWorkersCount: number;
  totalCustomersCount: number;
  averageCompletionHours: number;
  jobsPerDay: { date: string; count: number; completed: number }[];
  revenueTrend: { date: string; amount: number }[];
  categoryDistribution: { category: string; count: number; revenue: number }[];
  topWorkers: {
    workerId: string;
    workerName: string;
    completedJobs: number;
    rating: number;
    revenueGenerated: number;
  }[];
}
