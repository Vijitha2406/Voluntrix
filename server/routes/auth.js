const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// simple auth middleware for endpoints in this file
const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Missing token' });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

function isValidEmail(email) {
  return typeof email === 'string' && /@/.test(email);
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    if (!email || !password || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Missing or invalid email/password' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // normalize role to the allowed enum values
    const allowed = ['volunteer', 'organizer', 'both'];
    let finalRole = 'volunteer';
    if (typeof role === 'string') {
      const low = role.toLowerCase();
      if (allowed.includes(low)) finalRole = low;
    }

    const user = new User({
      firstName,
      lastName,
      name: `${firstName || ''} ${lastName || ''}`.trim(),
      email,
      passwordHash,
      role: finalRole,
    });
    try {
      await user.save();
    } catch (saveErr) {
      // handle duplicate email (11000) or validation errors
      if (saveErr && saveErr.code === 11000) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      if (saveErr && saveErr.name === 'ValidationError') {
        return res.status(400).json({ message: saveErr.message });
      }
      throw saveErr;
    }

    const token = jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ 
      token, 
      user: { 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      } 
    });
  } catch (err) {
    console.error('signup error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ 
      token, 
      user: { 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      } 
    });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me - validate token and return user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ 
      id: user._id.toString(), 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      firstName: user.firstName, 
      lastName: user.lastName
    });
  } catch (err) {
    console.error('me error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/profile - update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.body;
    
    // Get current user
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update fields if provided
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined && isValidEmail(email)) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    if (role !== undefined) {
      const allowed = ['volunteer', 'organizer', 'both'];
      if (allowed.includes(role.toLowerCase())) {
        user.role = role.toLowerCase();
      }
    }
    
    // Update name field
    user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();

    await user.save();

    return res.json({ 
      id: user._id.toString(), 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      firstName: user.firstName, 
      lastName: user.lastName
    });
  } catch (err) {
    console.error('profile update error', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
