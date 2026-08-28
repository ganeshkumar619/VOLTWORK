import { Router } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';
import type { AttendanceRecord, AttendanceStatus } from '../../types/index.ts';

export const attendanceRouter = Router();

// GET /api/attendance
attendanceRouter.get('/', authMiddleware, (req: any, res) => {
  const user = req.user;
  const all = db.getAttendance();

  if (user.role === 'admin') {
    return res.json(all.reverse());
  } else if (user.role === 'worker') {
    const worker = db.getWorkers().find((w) => w.userId === user.id);
    if (!worker) return res.json([]);
    return res.json(all.filter((a) => a.workerId === worker.id).reverse());
  }

  return res.status(403).json({ error: 'Access denied' });
});

// POST /api/attendance/check-in (Worker check in)
attendanceRouter.post('/check-in', authMiddleware, requireRole('worker'), (req: any, res) => {
  const user = req.user;
  const worker = db.getWorkers().find((w) => w.userId === user.id);
  if (!worker) return res.status(403).json({ error: 'Worker profile not found' });

  const { latitude, longitude, notes } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

  const existing = db.getAttendance().find((a) => a.workerId === worker.id && a.date === today);

  if (existing && existing.checkIn) {
    return res.status(400).json({ error: 'Already checked in today', record: existing });
  }

  if (existing) {
    existing.checkIn = nowTime;
    existing.status = 'present';
    if (latitude) existing.locationLat = Number(latitude);
    if (longitude) existing.locationLng = Number(longitude);
    if (notes) existing.notes = notes;
    db.save();
    return res.json(existing);
  }

  const newRec: AttendanceRecord = {
    id: `att-${Date.now()}`,
    workerId: worker.id,
    workerName: worker.name,
    date: today,
    checkIn: nowTime,
    status: 'present',
    locationLat: latitude ? Number(latitude) : undefined,
    locationLng: longitude ? Number(longitude) : undefined,
    notes: notes || 'Checked in via mobile app',
  };

  db.getAttendance().push(newRec);
  worker.availability = 'available';
  db.save();

  return res.status(201).json(newRec);
});

// POST /api/attendance/check-out (Worker check out)
attendanceRouter.post('/check-out', authMiddleware, requireRole('worker'), (req: any, res) => {
  const user = req.user;
  const worker = db.getWorkers().find((w) => w.userId === user.id);
  if (!worker) return res.status(403).json({ error: 'Worker profile not found' });

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

  const existing = db.getAttendance().find((a) => a.workerId === worker.id && a.date === today);

  if (!existing || !existing.checkIn) {
    return res.status(400).json({ error: 'Must check in before checking out' });
  }

  existing.checkOut = nowTime;

  // Calculate hours worked
  try {
    const [inH, inM] = existing.checkIn.split(':').map(Number);
    const [outH, outM] = nowTime.split(':').map(Number);
    const diffHours = outH + outM / 60 - (inH + inM / 60);
    existing.workingHours = Math.max(0, Number(diffHours.toFixed(2)));
    if (existing.workingHours < 4) {
      existing.status = 'half_day';
    }
  } catch (e) {
    existing.workingHours = 8;
  }

  db.save();
  return res.json(existing);
});

// POST /api/attendance/admin-record (Admin records or adjusts attendance)
attendanceRouter.post('/admin-record', authMiddleware, requireRole('admin'), (req: any, res) => {
  const { workerId, date, checkIn, checkOut, workingHours, status, notes } = req.body;

  if (!workerId || !date) {
    return res.status(400).json({ error: 'workerId and date are required' });
  }

  const worker = db.getWorkers().find((w) => w.id === workerId);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  const existing = db.getAttendance().find((a) => a.workerId === workerId && a.date === date);

  if (existing) {
    if (checkIn !== undefined) existing.checkIn = checkIn;
    if (checkOut !== undefined) existing.checkOut = checkOut;
    if (workingHours !== undefined) existing.workingHours = Number(workingHours);
    if (status) existing.status = status as AttendanceStatus;
    if (notes !== undefined) existing.notes = notes;
    db.save();
    return res.json(existing);
  }

  const newRec: AttendanceRecord = {
    id: `att-${Date.now()}`,
    workerId: worker.id,
    workerName: worker.name,
    date,
    checkIn: checkIn || '09:00:00',
    checkOut: checkOut || '18:00:00',
    workingHours: workingHours !== undefined ? Number(workingHours) : 9,
    status: (status as AttendanceStatus) || 'present',
    notes: notes || 'Admin recorded',
  };

  db.getAttendance().push(newRec);
  db.save();
  return res.status(201).json(newRec);
});
