import { Router } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';

export const settingsRouter = Router();

// GET /api/settings/company (Public / Authenticated: Returns company branding, admin location & service area)
settingsRouter.get('/company', (req, res) => {
  const settings = db.getCompanySettings();
  return res.json(settings);
});

// GET /api/settings/site-location (Admin site location details)
settingsRouter.get('/site-location', (req, res) => {
  const settings = db.getCompanySettings();
  return res.json({
    adminLocation: settings.adminLocation,
    serviceArea: settings.serviceArea,
    businessAddress: settings.businessAddress,
    timezone: settings.timezone,
    timezoneOffset: settings.timezoneOffset,
    serverTimeIST: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
    serverDateIST: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
  });
});

// PUT /api/settings/company (Admin only: Update location, service area, and business settings)
settingsRouter.put('/company', authMiddleware, requireRole('admin'), (req: any, res) => {
  const updates = req.body;
  const updated = db.updateCompanySettings(updates);

  db.logAudit({
    userId: req.user.id,
    userName: req.user.name,
    role: 'admin',
    action: 'SETTINGS_UPDATED',
    details: `Admin site location & business settings updated. Location: ${updated.adminLocation?.formattedAddress || updated.businessAddress}`,
  });

  return res.json({
    success: true,
    message: 'Admin location & business settings updated successfully',
    settings: updated,
  });
});
