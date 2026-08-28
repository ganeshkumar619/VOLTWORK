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

// POST /api/auth/register (Customer self-registration with Username/ID, Phone, Password, and Address)
authRouter.post('/register', (req, res) => {
  try {
    const {
      name,
      username,
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
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your full name (minimum 2 characters)' });
    }

    // 2. INSTAGRAM-STYLE USERNAME / ID VALIDATION:
    let cleanUsername = (username || '').trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '_');
    if (!cleanUsername || cleanUsername.length < 3) {
      // Auto-generate username from name if not given
      const baseName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 15);
      cleanUsername = `${baseName}_${Math.floor(100 + Math.random() * 900)}`;
    }

    const users = db.getUsers();
    // Check Username Uniqueness
    const existingUsername = users.find((u) => u.username?.toLowerCase() === cleanUsername);
    if (existingUsername) {
      return res.status(400).json({ error: `Username @${cleanUsername} is already taken. Please choose another username.` });
    }

    // 3. PHONE NUMBER VALIDATION:
    const cleanPhoneDigits = (phone ? String(phone) : '').replace(/\D/g, '').slice(-10);
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!cleanPhoneDigits || !phoneRegex.test(cleanPhoneDigits)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }

    const formattedPhone = `+91 ${cleanPhoneDigits.slice(0, 5)} ${cleanPhoneDigits.slice(5)}`;
    // Phone Uniqueness check
    const existingPhone = users.find((u) => {
      const uDigits = (u.phone ? String(u.phone) : '').replace(/\D/g, '').slice(-10);
      return uDigits === cleanPhoneDigits;
    });
    if (existingPhone) {
      return res.status(400).json({ error: 'This mobile number is already registered. Please login.' });
    }

    // 4. PASSWORD VALIDATION:
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    // 5. EMAIL (Optional, auto-generated based on username if not provided)
    const cleanEmail = (email && email.trim() && email.includes('@')) 
      ? email.trim().toLowerCase() 
      : `${cleanUsername}@voltwork.user`;

    // 6. ADDRESS & LOCATION:
    const resolvedDoor = (doorNo || '').trim();
    const resolvedStreet = (street || '').trim();
    const resolvedArea = (area || 'Mudukkumeendanpatti').trim();
    const resolvedCity = (city || 'Kovilpatti').trim();
    const resolvedDistrict = (district || 'Thoothukudi').trim();
    const resolvedState = (state || 'Tamilnadu').trim();
    const resolvedPincode = (pincode || '628716').trim();

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

    if (!fullAddress || fullAddress.length < 2) {
      fullAddress = 'Mudukkumeendanpatti, Kovilpatti, Thoothukudi - 628716';
    }

    const isGpsCaptured = Boolean(gpsCaptured);
    const numLat = latitude ? Number(latitude) : 9.1726;
    const numLng = longitude ? Number(longitude) : 77.8711;
    const now = new Date().toISOString();

    const userId = `usr-cust-${Date.now()}`;
    const customerId = `cust-${Date.now()}`;

    const newUser: any = {
      id: userId,
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      phone: formattedPhone,
      role: 'customer',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`,
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
      username: cleanUsername,
      phone: formattedPhone,
      email: cleanEmail,
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
      details: `New customer registered: ${name.trim()} (@${cleanUsername}) | Phone: ${formattedPhone} | Address: ${fullAddress}`,
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

// POST /api/auth/login (Unified login with Username / Handle, Phone, Worker ID, or Email + Password)
authRouter.post('/login', (req, res) => {
  try {
    const { identifier, username, email, phone, password, expectedRole } = req.body;
    const rawInput = identifier || username || email || phone || '';

    if (!rawInput || !password) {
      return res.status(400).json({ error: 'Username / ID and password are required' });
    }

    const cleanInput = String(rawInput).trim().toLowerCase().replace(/^@/, '');
    const cleanDigits = String(rawInput).replace(/\D/g, '').slice(-10);
    const users = db.getUsers();

    // Look up user by username, id, email, or phone
    let user: any = users.find((u) => {
      if (u.username && u.username.toLowerCase() === cleanInput) return true;
      if (u.id && u.id.toLowerCase() === cleanInput) return true;
      if (u.email && u.email.toLowerCase() === cleanInput) return true;
      if (cleanDigits.length >= 10 && u.phone) {
        const uDigits = u.phone.replace(/\D/g, '').slice(-10);
        if (uDigits === cleanDigits) return true;
      }
      return false;
    });

    // If not found by user table, check worker profile ID or workerHandle
    if (!user) {
      const worker = db.getWorkers().find((w) => {
        if (w.id && w.id.toLowerCase() === cleanInput) return true;
        if (w.username && w.username.toLowerCase() === cleanInput) return true;
        if (w.workerHandle && w.workerHandle.toLowerCase().replace(/^@/, '') === cleanInput) return true;
        if (w.email && w.email.toLowerCase() === cleanInput) return true;
        if (cleanDigits.length >= 10 && w.phone) {
          const wDigits = w.phone.replace(/\D/g, '').slice(-10);
          if (wDigits === cleanDigits) return true;
        }
        return false;
      });

      if (worker) {
        user = users.find((u) => u.id === worker.userId);
      }
    }

    // Special Admin alias fallback
    if (!user && expectedRole === 'admin' && (cleanInput === 'admin' || cleanInput === 'ganesh' || cleanInput === 'ganesh_admin')) {
      user = users.find((u) => u.role === 'admin');
    }

    if (!user) {
      if (expectedRole === 'customer') {
        return res.status(401).json({ error: 'Account not found. Please check your username or Create a New Account.' });
      }
      if (expectedRole === 'worker') {
        return res.status(401).json({ error: 'Worker ID not found. Please contact Administrator to get your Worker ID.' });
      }
      return res.status(401).json({ error: 'Invalid Username / ID or Password.' });
    }

    const hash = hashPassword(password);
    if (user.passwordHash !== hash) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    if (user.status === 'inactive' || user.status === 'deleted' || user.status === 'DELETED') {
      return res.status(403).json({ error: 'Account is deactivated. Contact Admin.' });
    }

    // Role-specific enforcement
    if (expectedRole && user.role !== expectedRole) {
      if (expectedRole === 'admin') {
        return res.status(403).json({
          error: 'Access Denied: Only authorized Admin can access the Admin Portal.',
        });
      }
      if (expectedRole === 'worker') {
        return res.status(403).json({
          error: 'Access Denied: This ID is not registered as a Field Electrician.',
        });
      }
      if (expectedRole === 'customer') {
        return res.status(403).json({
          error: `Access Denied: This account is registered as ${user.role.toUpperCase()}.`,
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

// POST /api/auth/google (Google OAuth / Identity Sign-In for Admin, Worker, and Customer)
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
    const now = new Date().toISOString();

    let customerProfile = null;
    let workerProfile = null;

    if (user) {
      if (user.status === 'inactive' || user.status === 'deleted' || user.status === 'DELETED') {
        return res.status(403).json({ error: 'Account is deactivated. Contact Admin.' });
      }

      if (expectedRole && user.role !== expectedRole) {
        return res.status(403).json({
          error: `Access Denied: This Google account is registered as ${user.role.toUpperCase()}.`,
        });
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
        details: `User signed in with Google (${cleanEmail}) as ${user.role}`,
      });
    } else {
      // Check role permissions for auto-creation / login
      if (cleanEmail === 'ganeshkumargurusamy619@gmail.com') {
        user = {
          id: 'usr-admin-01',
          name: displayName || 'Ganesh Kumar',
          email: cleanEmail,
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
          avatarUrl: avatarUrl || 'https://api.dicebear.com/7.x/personas/svg?seed=Ganesh',
          passwordHash: hashPassword('admin123'),
          googleId: googleId || `gid_${Date.now()}`,
        };
        users.push(user);
        db.save();
      } else if (expectedRole === 'admin') {
        return res.status(403).json({
          error: 'Access Denied: Only authorized Admin (ganeshkumargurusamy619@gmail.com) can access the Admin Portal.',
        });
      } else if (expectedRole === 'worker') {
        return res.status(403).json({
          error: 'Access Denied: This Google account is not registered as a Field Electrician. Please ask Admin to create your technician profile.',
        });
      } else {
        // Automatically create new Customer profile for any original Google email
        const userId = `usr-google-${Date.now()}`;
        const customerId = `cust-${Date.now()}`;
        const userAvatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;

        user = {
          id: userId,
          name: displayName,
          email: cleanEmail,
          phone: '+91 98400 00000',
          role: 'customer',
          avatarUrl: userAvatar,
          address: 'Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716',
          location: 'Kovilpatti, Thoothukudi',
          createdAt: now,
          status: 'active',
          passwordHash: hashPassword(`google-auth-${Date.now()}`),
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
          status: 'active',
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
          details: `New customer created via Google OAuth: ${displayName} (${cleanEmail})`,
        });
      }
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

// GET /api/auth/google/accounts (Returns available accounts for Google Account Picker)
authRouter.get('/google/accounts', (req, res) => {
  const users = db.getUsers().filter((u) => u.status === 'active');
  const accounts = [
    {
      email: 'ganeshkumargurusamy619@gmail.com',
      name: 'Ganesh Kumar (Admin)',
      avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Ganesh',
      role: 'admin',
      isRegistered: true,
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

// POST /api/auth/forgot-password (Self-service password recovery with username, phone, or email)
authRouter.post('/forgot-password', (req, res) => {
  try {
    const { email, identifier, username, phone, newPassword } = req.body;
    const rawInput = identifier || username || phone || email || '';

    if (!rawInput) {
      return res.status(400).json({ error: 'Username, phone number, or ID is required' });
    }

    const cleanInput = String(rawInput).trim().toLowerCase().replace(/^@/, '');
    const cleanDigits = String(rawInput).replace(/\D/g, '').slice(-10);
    const users = db.getUsers();
    
    const user: any = users.find((u) => {
      if (u.username && u.username.toLowerCase() === cleanInput) return true;
      if (u.id && u.id.toLowerCase() === cleanInput) return true;
      if (u.email && u.email.toLowerCase() === cleanInput) return true;
      if (cleanDigits.length >= 10 && u.phone) {
        const uDigits = u.phone.replace(/\D/g, '').slice(-10);
        if (uDigits === cleanDigits) return true;
      }
      return false;
    });

    if (!user) {
      return res.status(404).json({
        error: 'No account found with this Username or Phone number. Please check or register.',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'This account is deactivated. Please contact an Administrator.' });
    }

    if (newPassword) {
      if (newPassword.length < 4) {
        return res.status(400).json({ error: 'New password must be at least 4 characters long' });
      }

      user.passwordHash = hashPassword(newPassword);
      user.temporaryPassword = false;
      user.passwordChangedAt = new Date().toISOString();
      db.save();

      db.logAudit({
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: 'PASSWORD_RESET',
        details: `Password reset successfully for @${user.username || user.name}`,
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
      username: user.username || user.id,
      name: user.name,
      phone: user.phone,
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

// POST /api/admin/update-credentials (Update Admin username and/or password)
adminAuthRouter.post('/update-credentials', authMiddleware, requireRole('admin'), async (req: any, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const adminUser = req.user;

    if (currentPassword) {
      const currentHash = hashPassword(currentPassword);
      if (adminUser.passwordHash !== currentHash) {
        return res.status(400).json({ error: 'Current password does not match' });
      }
    }

    if (username && username.trim()) {
      const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
      const users = db.getUsers();
      const existing = users.find((u) => u.id !== adminUser.id && u.username?.toLowerCase() === cleanUsername);
      if (existing) {
        return res.status(400).json({ error: 'This username is already taken by another account' });
      }
      adminUser.username = cleanUsername;
    }

    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        return res.status(400).json({ error: 'New password must be at least 4 characters long' });
      }
      adminUser.passwordHash = hashPassword(newPassword.trim());
      adminUser.temporaryPassword = false;
      adminUser.passwordChangedAt = new Date().toISOString();
    }

    db.save();

    db.logAudit({
      userId: adminUser.id,
      userName: adminUser.name,
      role: 'admin',
      action: 'ADMIN_CREDENTIALS_UPDATED',
      details: `Admin updated credentials: Username=@${adminUser.username}`,
    });

    const { passwordHash, ...userClean } = adminUser;
    const newToken = generateToken(adminUser);

    return res.json({
      success: true,
      message: 'Admin credentials updated successfully',
      token: newToken,
      user: userClean,
    });
  } catch (error: any) {
    console.error('Admin update credentials error:', error);
    return res.status(500).json({ error: 'Failed to update credentials' });
  }
});

// POST /api/admin/change-password
adminAuthRouter.post('/change-password', async (req: any, res) => {
  try {
    const { email, username, identifier, currentPassword, newPassword, confirmPassword } = req.body;
    let targetUser: any = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.split(' ')[1]);
      if (payload) {
        targetUser = db.getUsers().find((u) => u.id === payload.id);
      }
    }

    const cleanInput = (identifier || username || email || '').trim().toLowerCase().replace(/^@/, '');
    if (!targetUser && cleanInput) {
      targetUser = db.getUsers().find((u) => (u.username?.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput || cleanInput === 'admin') && u.role === 'admin');
    }

    if (!targetUser || targetUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin authorization required' });
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long' });
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
      details: `Admin password updated for @${targetUser.username || targetUser.email}`,
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
  const { email, username, identifier } = req.body;
  const rawInput = identifier || username || email || '';
  const cleanInput = String(rawInput).trim().toLowerCase().replace(/^@/, '');

  let admin = db.getUsers().find((u) => (u.username?.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput || cleanInput === 'admin' || cleanInput === '') && u.role === 'admin');

  if (!admin) {
    return res.status(404).json({ error: 'No Admin account found' });
  }

  // Generate a temporary reset key / reset PIN
  const tempPin = Math.floor(100000 + Math.random() * 900000).toString();

  db.logAudit({
    userId: admin.id,
    userName: admin.name,
    role: 'admin',
    action: 'ADMIN_FORGOT_PASSWORD_REQUEST',
    details: `Password reset initiated for Admin @${admin.username || admin.name}`,
  });

  return res.json({
    success: true,
    message: `Password reset request verified for Admin (@${admin.username || 'admin'}). You can now set your new password.`,
    resetCode: tempPin,
    username: admin.username || 'admin',
  });
});

// POST /api/admin/reset-password
adminAuthRouter.post('/reset-password', (req, res) => {
  const { email, username, identifier, newPassword, confirmPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long' });
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const rawInput = identifier || username || email || '';
  const cleanInput = String(rawInput).trim().toLowerCase().replace(/^@/, '');
  const admin: any = db.getUsers().find((u) => (u.username?.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput || cleanInput === 'admin' || cleanInput === '') && u.role === 'admin');

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
    details: `Admin password successfully reset for @${admin.username || admin.name}`,
  });

  return res.json({
    success: true,
    message: 'Admin password reset successfully. You can now login with your new password.',
  });
});
