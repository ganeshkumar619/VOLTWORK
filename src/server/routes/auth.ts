import { Router } from 'express';
import { db, hashPassword, generateToken, verifyToken } from '../db.ts';
import type { User, CustomerProfile, WorkerProfile } from '../../types/index.ts';

export const authRouter = Router();

// Middleware to extract user from Authorization header
export function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = db.getUsers().find((u) => u.id === payload.id);
  if (!user || user.status === 'inactive') {
    return res.status(401).json({ error: 'User not found or inactive' });
  }

  req.user = user;
  next();
}

// Require specific role(s)
export function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    const userRole = (req.user?.role || '').toLowerCase();
    const allowed = roles.map((r) => r.toLowerCase());
    if (!req.user || !allowed.includes(userRole)) {
      return res.status(403).json({ error: 'Access forbidden: insufficient permissions' });
    }
    next();
  };
}

// POST /api/auth/register (Customer self-registration with full validation & GPS)
authRouter.post('/register', (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
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

    // 1. FULL NAME VALIDATION:
    // Cannot be empty, minimum 2 characters, only letters and spaces allowed
    if (!name || typeof name !== 'string' || name.trim().length < 2 || !/^[a-zA-Z\s]{2,50}$/.test(name.trim())) {
      return res.status(400).json({ error: 'Please enter your full name (minimum 2 characters, letters only)' });
    }

    // 2. EMAIL VALIDATION:
    // Must be valid email format, cannot be empty
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Email Uniqueness check
    const users = db.getUsers();
    const existingEmail = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existingEmail) {
      return res.status(400).json({ error: 'This email is already registered' });
    }

    // 3. PHONE NUMBER VALIDATION:
    // Must be 10 digits (Indian format), starts with 6,7,8,9
    const cleanPhoneDigits = (phone ? String(phone) : '').replace(/\D/g, '').slice(-10);
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!cleanPhoneDigits || !phoneRegex.test(cleanPhoneDigits)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit phone number (starts with 6,7,8,9)' });
    }

    const formattedPhone = `+91 ${cleanPhoneDigits.slice(0, 5)} ${cleanPhoneDigits.slice(5)}`;
    // Phone Uniqueness check across ALL users (Customers AND Workers)
    const existingPhone = users.find((u) => {
      const uDigits = (u.phone ? String(u.phone) : '').replace(/\D/g, '').slice(-10);
      return uDigits === cleanPhoneDigits;
    });
    if (existingPhone) {
      return res.status(400).json({ error: 'This phone number is already registered' });
    }

    // 4. PASSWORD VALIDATION:
    // Minimum 6 characters, must contain at least one number
    if (!password || typeof password !== 'string' || password.length < 6 || !/\d/.test(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters with a number' });
    }

    // 5. ADDRESS VALIDATION:
    // Format full address if components are passed or fallback
    const resolvedDoor = (doorNo || '').trim();
    const resolvedStreet = (street || '').trim();
    const resolvedArea = (area || 'Mudukkumeendanpatti').trim();
    const resolvedCity = (city || 'Kovilpatti').trim();
    const resolvedDistrict = (district || 'Thoothukudi').trim();
    const resolvedState = (state || 'Tamilnadu').trim();
    const resolvedPincode = (pincode || '628716').trim();

    if (!resolvedDoor || !resolvedStreet || !resolvedArea || !resolvedCity || !resolvedDistrict || !resolvedState || !resolvedPincode) {
      return res.status(400).json({ error: 'All address fields (Door No, Street, Area, City, District, State, PIN) are required' });
    }

    let fullAddress = (address || '').trim();
    if (!fullAddress) {
      const parts = [];
      if (resolvedDoor && resolvedStreet) parts.push(`${resolvedDoor}, ${resolvedStreet}`);
      else if (resolvedDoor) parts.push(resolvedDoor);
      else if (resolvedStreet) parts.push(resolvedStreet);
      if (resolvedArea && resolvedArea.toLowerCase() !== resolvedCity.toLowerCase()) parts.push(resolvedArea);
      if (resolvedCity) parts.push(resolvedCity);
      if (resolvedDistrict && resolvedDistrict.toLowerCase() !== resolvedCity.toLowerCase()) parts.push(resolvedDistrict);
      parts.push(`${resolvedState} - ${resolvedPincode}`);
      fullAddress = parts.join(', ');
    }

    if (!fullAddress || fullAddress.length < 3) {
      return res.status(400).json({ error: 'Please enter your complete address' });
    }

    // 6. GPS LOCATION VALIDATION & MANDATORY CAPTURE:
    const isGpsCaptured = Boolean(gpsCaptured);
    if (!isGpsCaptured || !latitude || !longitude) {
      return res.status(400).json({ error: 'Location access is required to register. Please enable location and try again.' });
    }

    const numLat = Number(latitude);
    const numLng = Number(longitude);
    const now = new Date().toISOString();

    const userId = `usr-cust-${Date.now()}`;
    const customerId = `cust-${Date.now()}`;

    const newUser: any = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: formattedPhone,
      role: 'customer',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
      address: fullAddress,
      doorNo: resolvedDoor,
      street: resolvedStreet,
      area: resolvedArea,
      city: resolvedCity,
      district: resolvedDistrict,
      state: resolvedState,
      pincode: resolvedPincode,
      latitude: numLat,
      longitude: numLng,
      gpsCaptured: isGpsCaptured,
      gpsCapturedAt: isGpsCaptured ? now : undefined,
      createdAt: now,
      status: 'active',
      passwordHash: hashPassword(password),
    };

    const newCustomer: CustomerProfile = {
      id: customerId,
      userId,
      name: name.trim(),
      phone: formattedPhone,
      email: email.trim().toLowerCase(),
      address: fullAddress,
      doorNo: resolvedDoor,
      street: resolvedStreet,
      area: resolvedArea,
      city: resolvedCity,
      district: resolvedDistrict,
      state: resolvedState,
      pincode: resolvedPincode,
      latitude: numLat,
      longitude: numLng,
      gpsCaptured: isGpsCaptured,
      gpsCapturedAt: isGpsCaptured ? now : undefined,
      createdAt: now,
      totalJobs: 0,
      totalSpent: 0,
      status: 'active',
    };

    users.push(newUser);
    db.getCustomers().push(newCustomer);
    db.save();

    db.logAudit({
      userId,
      userName: name.trim(),
      role: 'customer',
      action: 'CUSTOMER_REGISTERED',
      details: `New customer registered: ${name.trim()} (${email.trim()}) | Phone: ${formattedPhone} | Address: ${fullAddress} | GPS: ${isGpsCaptured ? `${numLat}, ${numLng}` : 'Manual Entry'}`,
    });

    const token = generateToken(newUser);
    const { passwordHash, ...userClean } = newUser;

    return res.status(201).json({
      token,
      user: userClean,
      customerProfile: newCustomer,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register customer' });
  }
});

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = db.getUsers();
    const user: any = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const hash = hashPassword(password);
    if (user.passwordHash !== hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status === 'inactive' || user.status === 'deleted' || user.status === 'DELETED') {
      return res.status(403).json({ error: 'Account is deactivated. Contact Admin.' });
    }

    // Role-specific enforcement
    if (expectedRole && user.role !== expectedRole) {
      if (expectedRole === 'admin') {
        return res.status(403).json({
          error: 'Access Denied: This account is not registered as an Administrator. Please use the Customer or Worker login portal.',
        });
      }
      if (expectedRole === 'worker') {
        return res.status(403).json({
          error: 'Access Denied: This account is not registered as a Field Electrician. Electricians must be onboarded by Admin.',
        });
      }
      if (expectedRole === 'customer') {
        return res.status(403).json({
          error: `Access Denied: This account is registered as ${user.role.toUpperCase()}. Please sign in via the ${user.role} login portal.`,
        });
      }
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    db.save();

    const token = generateToken(user);
    const { passwordHash, ...userClean } = user;

    let customerProfile = null;
    let workerProfile = null;

    if (user.role === 'customer') {
      customerProfile = db.getCustomers().find((c) => c.userId === user.id) || null;
    } else if (user.role === 'worker') {
      workerProfile = db.getWorkers().find((w) => w.userId === user.id) || null;
    }

    return res.json({
      token,
      user: userClean,
      mustChangePassword: Boolean(user.temporaryPassword),
      customerProfile,
      workerProfile,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, (req: any, res) => {
  const user = req.user;
  const { passwordHash, ...userClean } = user;

  let customerProfile = null;
  let workerProfile = null;

  if (user.role === 'customer') {
    customerProfile = db.getCustomers().find((c) => c.userId === user.id) || null;
  } else if (user.role === 'worker') {
    workerProfile = db.getWorkers().find((w) => w.userId === user.id) || null;
  }

  return res.json({
    user: userClean,
    customerProfile,
    workerProfile,
  });
});

// PUT /api/auth/profile
authRouter.put('/profile', authMiddleware, (req: any, res) => {
  const user = req.user;
  const { name, phone, address, avatarUrl, latitude, longitude } = req.body;

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (avatarUrl) user.avatarUrl = avatarUrl;

  if (user.role === 'customer') {
    const cust = db.getCustomers().find((c) => c.userId === user.id);
    if (cust) {
      if (name) cust.name = name;
      if (phone) cust.phone = phone;
      if (address !== undefined) cust.address = address;
      if (latitude !== undefined) cust.latitude = Number(latitude);
      if (longitude !== undefined) cust.longitude = Number(longitude);
    }
  } else if (user.role === 'worker') {
    const worker = db.getWorkers().find((w) => w.userId === user.id);
    if (worker) {
      if (name) worker.name = name;
      if (phone) worker.phone = phone;
      if (address !== undefined) worker.address = address;
    }
  }

  db.save();
  const { passwordHash, ...userClean } = user;
  return res.json({ user: userClean });
});

// POST /api/auth/google (Google OAuth / Identity Sign-In & Secure Provisioning)
authRouter.post('/google', async (req, res) => {
  try {
    const { email, name, avatarUrl, googleId, expectedRole } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Valid Google email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const displayName = name || cleanEmail.split('@')[0];
    const users = db.getUsers();

    let user: any = users.find((u) => u.email.toLowerCase() === cleanEmail);
    let customerProfile = null;
    let workerProfile = null;
    const now = new Date().toISOString();

    // 1. If Admin Login requested:
    if (expectedRole === 'admin') {
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access Denied. Not an Admin account.',
        });
      }
    }

    // 2. If Worker Login requested:
    if (expectedRole === 'worker') {
      if (!user || user.role !== 'worker') {
        return res.status(403).json({
          error: 'Access Denied. Not a Worker account.',
        });
      }
    }

    // 3. If Customer Login requested:
    if (expectedRole === 'customer') {
      if (user && user.role !== 'customer') {
        return res.status(403).json({
          error: `Access Denied. This Google account is registered as ${user.role.toUpperCase()}. Please sign in via the ${user.role} login portal.`,
        });
      }
    }

    if (user) {
      // Existing user login via Google
      if (user.status === 'inactive' || user.status === 'deleted' || user.status === 'DELETED') {
        return res.status(403).json({ error: 'Account is deactivated. Please contact Admin.' });
      }

      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
        db.save();
      }

      if (user.role === 'customer') {
        customerProfile = db.getCustomers().find((c) => c.userId === user.id) || null;
      } else if (user.role === 'worker') {
        workerProfile = db.getWorkers().find((w) => w.userId === user.id) || null;
      }

      db.logAudit({
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: 'GOOGLE_OAUTH_LOGIN',
        details: `User signed in with Google (${cleanEmail}) via ${expectedRole || user.role} portal`,
      });
    } else {
      // If expectedRole is admin or worker, do not auto-create
      if (expectedRole === 'admin') {
        return res.status(403).json({
          error: 'Access Denied. Not an Admin account.',
        });
      }
      if (expectedRole === 'worker') {
        return res.status(403).json({
          error: 'Access Denied. Not a Worker account.',
        });
      }

      // Automatically register new customer account securely
      const userId = `usr-google-${Date.now()}`;
      const customerId = `cust-${Date.now()}`;
      const userAvatar =
        avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;

      user = {
        id: userId,
        name: displayName,
        email: cleanEmail,
        phone: '+91 98400 00000',
        role: 'customer',
        avatarUrl: userAvatar,
        createdAt: now,
        status: 'active',
        passwordHash: hashPassword(`google-auth-${Date.now()}-${Math.random()}`),
        googleId: googleId || `gid_${Date.now()}`,
      };

      const newCustomer: CustomerProfile = {
        id: customerId,
        userId,
        name: displayName,
        phone: '+91 98400 00000',
        email: cleanEmail,
        address: 'Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716',
        latitude: 9.1726,
        longitude: 77.8711,
        createdAt: now,
        totalJobs: 0,
        totalSpent: 0,
      };

      users.push(user);
      db.getCustomers().push(newCustomer);
      customerProfile = newCustomer;
      db.save();

      db.logAudit({
        userId,
        userName: displayName,
        role: 'customer',
        action: 'GOOGLE_OAUTH_REGISTER',
        details: `New customer account created via Google OAuth: ${displayName} (${cleanEmail})`,
      });
    }

    const token = generateToken(user);
    const { passwordHash, ...userClean } = user;

    return res.json({
      token,
      user: userClean,
      customerProfile,
      workerProfile,
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ error: 'Google authentication failed' });
  }
});

// GET /api/auth/google/accounts (Returns available accounts to simulate Google Account Picker in browser environment)
authRouter.get('/google/accounts', (req, res) => {
  const users = db.getUsers().filter((u) => u.status === 'active');
  const accounts = [
    {
      email: 'ganeshkumargurusamy619@gmail.com',
      name: 'Ganesh Kumar',
      avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Ganesh',
      role: 'customer',
      isRegistered: users.some((u) => u.email.toLowerCase() === 'ganeshkumargurusamy619@gmail.com'),
    },
    ...users.map((u) => ({
      email: u.email,
      name: u.name,
      avatarUrl: u.avatarUrl,
      role: u.role,
      isRegistered: true,
    })),
  ];

  // Remove duplicates by email
  const uniqueAccounts: any[] = [];
  const seen = new Set<string>();
  accounts.forEach((acc) => {
    const norm = acc.email.toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      uniqueAccounts.push(acc);
    }
  });

  return res.json({ accounts: uniqueAccounts });
});

// GET /api/auth/google/url (Returns Google OAuth configuration / URL with select_account prompt)
authRouter.get('/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || '';
  const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;

  if (!clientId) {
    return res.json({
      hasClientId: false,
      redirectUri,
      prompt: 'select_account',
      message: 'Google Client ID not set in environment. Interactive Google Sign-In with select_account prompt is enabled.',
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token id_token',
    scope: 'openid email profile',
    prompt: 'select_account',
    include_granted_scopes: 'true',
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.json({
    hasClientId: true,
    url,
    prompt: 'select_account',
    redirectUri,
  });
});

// POST /api/auth/forgot-password (Self-service password recovery)
authRouter.post('/forgot-password', (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const users = db.getUsers();
    const user: any = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(404).json({
        error: 'No account found with this email address. Please check your spelling or register.',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'This account is deactivated. Please contact an Administrator.' });
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }

      user.passwordHash = hashPassword(newPassword);
      db.save();

      db.logAudit({
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: 'PASSWORD_RESET',
        details: `Password reset successfully for ${cleanEmail}`,
      });

      return res.json({
        success: true,
        message: 'Password reset successfully. You can now sign in with your new password.',
      });
    }

    // Step 1: Verify identity
    return res.json({
      success: true,
      userFound: true,
      email: user.email,
      name: user.name,
      role: user.role,
      message: 'Account verified. You can now set a new password.',
    });
  } catch (error: any) {
    console.error('Forgot Password error:', error);
    return res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// POST /api/auth/change-password (Supports authenticated change or email+currentPassword change)
authRouter.post('/change-password', async (req: any, res) => {
  try {
    const { email, currentPassword, newPassword, confirmPassword } = req.body;
    let targetUser: any = null;

    // Check if token was provided in header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.split(' ')[1]);
      if (payload) {
        targetUser = db.getUsers().find((u) => u.id === payload.id);
      }
    }

    if (!targetUser && email) {
      targetUser = db.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    }

    if (!targetUser) {
      return res.status(401).json({ error: 'User not found or authorization required' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation do not match' });
    }

    // Verify current password if provided
    if (currentPassword) {
      const currentHash = hashPassword(currentPassword);
      if (targetUser.passwordHash !== currentHash) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    // Update password
    targetUser.passwordHash = hashPassword(newPassword);
    targetUser.temporaryPassword = false;
    targetUser.passwordChangedAt = new Date().toISOString();
    db.save();

    db.logAudit({
      userId: targetUser.id,
      userName: targetUser.name,
      role: targetUser.role,
      action: 'PASSWORD_CHANGED',
      details: `Password changed for user ${targetUser.email} (Temporary password cleared)`,
    });

    const { passwordHash, ...userClean } = targetUser;
    const newToken = generateToken(targetUser);

    return res.json({
      success: true,
      message: 'Password has been updated successfully. You can now use your new password.',
      token: newToken,
      user: userClean,
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// Admin-specific Router for /api/admin/* endpoints
export const adminAuthRouter = Router();

// POST /api/admin/change-password
adminAuthRouter.post('/change-password', async (req: any, res) => {
  try {
    const { email, currentPassword, newPassword, confirmPassword } = req.body;
    let targetUser: any = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.split(' ')[1]);
      if (payload) {
        targetUser = db.getUsers().find((u) => u.id === payload.id);
      }
    }

    if (!targetUser && email) {
      targetUser = db.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.role === 'admin');
    }

    if (!targetUser || targetUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin authorization required' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (currentPassword) {
      const currentHash = hashPassword(currentPassword);
      if (targetUser.passwordHash !== currentHash) {
        return res.status(400).json({ error: 'Current admin password is incorrect' });
      }
    }

    targetUser.passwordHash = hashPassword(newPassword);
    targetUser.temporaryPassword = false;
    targetUser.passwordChangedAt = new Date().toISOString();
    db.save();

    db.logAudit({
      userId: targetUser.id,
      userName: targetUser.name,
      role: 'admin',
      action: 'ADMIN_PASSWORD_CHANGED',
      details: `Admin password updated for ${targetUser.email}`,
    });

    const { passwordHash, ...userClean } = targetUser;
    const newToken = generateToken(targetUser);

    return res.json({
      success: true,
      message: 'Admin password updated successfully. New password is active.',
      token: newToken,
      user: userClean,
    });
  } catch (error: any) {
    console.error('Admin change password error:', error);
    return res.status(500).json({ error: 'Failed to update admin password' });
  }
});

// POST /api/admin/forgot-password
adminAuthRouter.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Admin email is required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const admin = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail && u.role === 'admin');

  if (!admin) {
    return res.status(404).json({ error: 'No Admin account found with this email' });
  }

  // Generate a temporary reset key / reset PIN
  const tempPin = Math.floor(100000 + Math.random() * 900000).toString();

  db.logAudit({
    userId: admin.id,
    userName: admin.name,
    role: 'admin',
    action: 'ADMIN_FORGOT_PASSWORD_REQUEST',
    details: `Password reset initiated for Admin ${cleanEmail}`,
  });

  return res.json({
    success: true,
    message: `Password reset request verified for Admin (${cleanEmail}). You can now set your new password.`,
    resetCode: tempPin,
    email: admin.email,
  });
});

// POST /api/admin/reset-password
adminAuthRouter.post('/reset-password', (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const admin: any = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail && u.role === 'admin');

  if (!admin) {
    return res.status(404).json({ error: 'Admin account not found' });
  }

  admin.passwordHash = hashPassword(newPassword);
  admin.temporaryPassword = false;
  admin.passwordChangedAt = new Date().toISOString();
  db.save();

  db.logAudit({
    userId: admin.id,
    userName: admin.name,
    role: 'admin',
    action: 'ADMIN_PASSWORD_RESET',
    details: `Admin password successfully reset for ${cleanEmail}`,
  });

  return res.json({
    success: true,
    message: 'Admin password reset successfully. You can now login with your new password.',
  });
});
