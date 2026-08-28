import express from 'express';
import { authRouter, adminAuthRouter } from './routes/auth.ts';
import { customerRouter } from './routes/customers.ts';
import { workerRouter } from './routes/workers.ts';
import { jobRouter } from './routes/jobs.ts';
import { billingRouter } from './routes/billing.ts';
import { salaryRouter } from './routes/salaries.ts';
import { attendanceRouter } from './routes/attendance.ts';
import { smsRouter } from './routes/sms.ts';
import { aiRouter } from './routes/ai.ts';
import { analyticsRouter } from './routes/analytics.ts';
import { notificationRouter } from './routes/notifications.ts';
import { categoryRouter } from './routes/categories.ts';
import { auditRouter } from './routes/audit.ts';
import { settingsRouter } from './routes/settings.ts';
import { historyRouter } from './routes/history.ts';
import { messagesRouter } from './routes/messages.ts';
import { billsRouter } from './routes/bills.ts';

export const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), platform: 'VoltWork AI v2.0' });
});

// Reverse Geocoding API Proxy (avoids browser CORS & unsafe User-Agent headers)
app.get('/api/geocode/reverse', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}&zoom=18&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'Accept-Language': 'en-IN, en;q=0.9',
        'User-Agent': 'VoltWorkAI-Platform/2.0 (contact: ganeshkumargurusamy619@gmail.com)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data = await response.json();
    const addr = data.address || {};

    const doorNo = addr.house_number || addr.building || addr.house_name || '';
    const street = addr.road || addr.street || addr.residential || addr.pedestrian || addr.footway || '';
    let area = addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || addr.quarter || addr.residential || addr.locality || '';
    let city = addr.city || addr.town || addr.municipality || addr.city_district || addr.subdistrict || addr.county || '';
    let district = addr.state_district || addr.county || addr.district || '';
    let state = addr.state || 'Tamilnadu';
    let pincode = addr.postcode || '';

    // Smart defaults if in Mudukkumeendanpatti / Kovilpatti region or empty
    const isLocalHQ = Math.abs(lat - 9.1726) < 0.35 && Math.abs(lng - 77.8711) < 0.35;
    if (!area) area = isLocalHQ ? 'Mudukkumeendanpatti' : (city || 'Mudukkumeendanpatti');
    if (!city) city = isLocalHQ ? 'Kovilpatti' : (area || 'Kovilpatti');
    if (!district) district = isLocalHQ ? 'Thoothukudi' : 'Thoothukudi';
    if (!state) state = 'Tamilnadu';
    if (!pincode) pincode = isLocalHQ ? '628716' : '628716';

    res.json({
      doorNo,
      street,
      area,
      city,
      district,
      state,
      pincode,
      displayName: data.display_name || '',
      latitude: lat,
      longitude: lng,
    });
  } catch (err: any) {
    console.warn('Backend reverse geocode fallback:', err?.message || err);
    // Graceful fallback response
    const lat = parseFloat(req.query.lat as string) || 9.1726;
    const lng = parseFloat(req.query.lng as string) || 77.8711;
    res.json({
      doorNo: '',
      street: '',
      area: 'Mudukkumeendanpatti',
      city: 'Kovilpatti',
      district: 'Thoothukudi',
      state: 'Tamilnadu',
      pincode: '628716',
      displayName: 'Mudukkumeendanpatti, Kovilpatti, Thoothukudi District, Tamilnadu - 628716',
      latitude: lat,
      longitude: lng,
    });
  }
});

// OAuth Callback Route (Handles popup return and postMessage for OAuth flows)
app.get(['/auth/callback', '/auth/callback/'], (req, res) => {
  const { code, access_token, id_token, error } = req.query;

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>VoltWork AI - Authenticating</title>
        <style>
          body {
            background-color: #020617;
            color: #f1f5f9;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
          }
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(34, 211, 238, 0.2);
            border-top-color: #22d3ee;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h3 style="margin: 0 0 0.5rem; color: #38bdf8;">Authentication Successful</h3>
          <p style="margin: 0; font-size: 0.85rem; color: #94a3b8;">Returning to VoltWork AI...</p>
        </div>
        <script>
          const payload = {
            type: 'OAUTH_AUTH_SUCCESS',
            provider: 'google',
            code: ${JSON.stringify(code || '')},
            token: ${JSON.stringify(access_token || id_token || '')},
            error: ${JSON.stringify(error || '')}
          };

          if (window.opener) {
            window.opener.postMessage(payload, '*');
            setTimeout(() => window.close(), 400);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminAuthRouter);
app.use('/api/customers', customerRouter);
app.use('/api/workers', workerRouter);
app.use('/api/jobs', jobRouter);
app.use('/api/billing', billingRouter);
app.use('/api/salaries', salaryRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/sms', smsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/audit', auditRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/history', historyRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/bills', billsRouter);

export default app;
