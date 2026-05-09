const express   = require('express');
const router    = express.Router();
const crypto    = require('crypto');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');
const User      = require('../models/User');
const OTP       = require('../models/OTP');
const { verifyToken } = require('../middleware/authMiddleware');
const { sendPasswordResetEmail, sendOTPEmail } = require('../utils/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- Rate Limiting for Login endpoints -----------------------------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes.' }
});

// --- Helper: sign a JWT --------------------------------------------------------
const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true if in production (HTTPS)
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-domain in prod, lax for local
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const sendTokenResponse = (user, statusCode, res, message) => {
  const token = signToken(user);
  res.cookie('jwt_token', token, cookieOptions);
  // We still return token in JSON for backward compatibility until frontend fully transitions, 
  // but it's not strictly necessary. We'll return it so we don't break immediate logic.
  res.status(statusCode).json({
    message,
    token, // Keeping this here temporarily if needed, though secure is cookie
    user: safeUser(user),
  });
};

const safeUser = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, avatar: u.avatar || null, createdAt: u.createdAt });

// --- POST /api/auth/send-otp ---------------------------------------------------
// Public - generates and sends an OTP for registration
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email)
      return res.status(400).json({ message: 'Name and email are required to send OTP.' });

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists)
      return res.status(409).json({ message: 'An account with that email already exists.' });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTPs for this email to prevent spam/confusion
    await OTP.deleteMany({ email: email.trim().toLowerCase() });

    // Save new OTP
    await OTP.create({
      email: email.trim().toLowerCase(),
      otp: otpCode
    });

    // Send email
    await sendOTPEmail(email.trim().toLowerCase(), name.trim(), otpCode);

    res.json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('[send-otp ERROR]', err);
    res.status(500).json({ message: err.message || 'Failed to send OTP.' });
  }
});

// --- POST /api/auth/register -------------------------------------------------
// Public - creates a CUSTOMER account only, after OTP verification.
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;
    if (!name || !email || !password || !otp)
      return res.status(400).json({ message: 'Name, email, password, and OTP are required.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const emailLower = email.trim().toLowerCase();

    const exists = await User.findOne({ email: emailLower });
    if (exists)
      return res.status(409).json({ message: 'An account with that email already exists.' });

    // Verify OTP
    const otpRecord = await OTP.findOne({ email: emailLower, otp });
    if (!otpRecord)
      return res.status(400).json({ message: 'Invalid or expired verification code.' });

    const user = await User.create({
      name:     name.trim(),
      email:    emailLower,
      password,
      role:     'customer',
    });

    // Delete OTP record since it's used
    await OTP.deleteOne({ _id: otpRecord._id });

    sendTokenResponse(user, 201, res, 'Account created successfully.');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- POST /api/auth/login ----------------------------------------------------
// Public - for CUSTOMER and MECHANIC only.
// Admin must use /admin-login.
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user)
      return res.status(404).json({ message: 'No account found with that email.' });

    // Block admins from this endpoint
    if (user.role === 'admin')
      return res.status(403).json({
        message: 'Admin accounts must use the Admin Portal.',
        redirect: '/admin-login',
      });

    const ok = await user.comparePassword(password);
    if (!ok)
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });

    sendTokenResponse(user, 200, res, 'Login successful.');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- POST /api/auth/admin-login -----------------------------------------------
// Separate secure endpoint - ADMIN only.
router.post('/admin-login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || user.role !== 'admin')
      return res.status(403).json({ message: 'Access denied. Master Admin credentials required.' });

    const ok = await user.comparePassword(password);
    if (!ok)
      return res.status(401).json({ message: 'Incorrect password.' });

    sendTokenResponse(user, 200, res, 'Admin login successful.');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- POST /api/auth/logout ----------------------------------------------------
// Clears the HttpOnly cookie
router.post('/logout', (req, res) => {
  res.cookie('jwt_token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // expires in 10 seconds
    httpOnly: true
  });
  res.status(200).json({ message: 'Logged out successfully.' });
});

// --- GET /api/auth/me ---------------------------------------------------------
// Protected - returns logged-in user from Bearer token or HttpOnly cookie.
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

// --- POST /api/auth/seed ------------------------------------------------------
// Seeds demo accounts. Safe to call multiple times.
router.post('/seed', async (_req, res) => {
  try {
    const demos = [
      { name: 'Admin User',    email: 'admin@toyota.com',    role: 'admin',    password: 'demo1234' },
      { name: 'Mechanic User', email: 'mechanic@toyota.com', role: 'mechanic', password: 'demo1234' },
      { name: 'Customer User', email: 'customer@toyota.com', role: 'customer', password: 'demo1234' },
    ];
    const results = [];
    for (const demo of demos) {
      const existing = await User.findOne({ email: demo.email });
      if (!existing) {
        const created = await User.create(demo);
        results.push({ status: 'created', email: created.email, role: created.role });
      } else if (!existing.password) {
        existing.password = demo.password;
        await existing.save();
        results.push({ status: 'patched', email: existing.email, role: existing.role });
      } else {
        results.push({ status: 'exists', email: existing.email, role: existing.role });
      }
    }
    res.json({ message: 'Demo accounts ready. Password: demo1234', accounts: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- POST /api/auth/forgot-password ------------------------------------------
// Generates a reset token, emails a link (or logs to console if SMTP not set).
// Only for customer + mechanic (not admin).
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    // Always return 200 to prevent email-enumeration attacks
    if (!user || user.role === 'admin') {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const rawToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetToken       = hashedToken;
    user.resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl    = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- POST /api/auth/reset-password -------------------------------------------
// Validates token + email, updates password.
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password)
      return res.status(400).json({ message: 'Token, email and new password are required.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      email:            email.trim().toLowerCase(),
      resetToken:       hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: 'Reset link is invalid or has expired.' });

    user.password         = password;   // pre-save hook will hash it
    user.resetToken       = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully. You can now sign in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- POST /api/auth/google ---------------------------------------------------
// Verifies a Google ID-token credential, then finds or creates a CUSTOMER account.
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential is required.' });

    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE')
      return res.status(503).json({ message: 'Google login is not configured on this server.' });

    const ticket  = await googleClient.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, email_verified } = payload;

    if (!email_verified)
      return res.status(400).json({ message: 'Google account email is not verified.' });

    let user = await User.findOne({ googleId });
    if (!user) user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (user.role !== 'customer')
        return res.status(403).json({ message: 'Google login is for customer accounts only.' });
      if (!user.googleId) { user.googleId = googleId; await user.save(); }
    } else {
      user = await User.create({ name, email: email.toLowerCase(), googleId, role: 'customer' });
    }

    const token = signToken(user);
    res.json({ message: 'Google login successful.', token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;