const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

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

function serializeEvent(e) {
  const obj = { ...e };
  // ensure id is string and volunteers/organizer are strings
  if (obj._id) obj.id = obj._id.toString();
  if (Array.isArray(obj.volunteers)) obj.volunteers = obj.volunteers.map(v => v ? v.toString() : v);
  if (obj.organizer) obj.organizer = obj.organizer.toString();
  return obj;
}

// List events
router.get('/', async (req, res) => {
  const events = await Event.find().limit(50).lean();
  const out = events.map(serializeEvent);
  res.json(out);
});

// Create event (requires auth) - only organizers or both
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, date, location, capacity } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(401).json({ message: 'Invalid user' });
  if (!(user.role === 'organizer' || user.role === 'both')) {
    return res.status(403).json({ message: 'Only organizers can create events' });
  }

  const evt = new Event({ title, description, date, location, capacity, organizer: req.user.id });
  await evt.save();
  const obj = serializeEvent(evt.toObject());
  res.status(201).json(obj);
});

// Join an event (requires auth)
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const evt = await Event.findById(req.params.id);
    if (!evt) return res.status(404).json({ message: 'Event not found' });

    const userId = req.user.id;
    // prevent organizer from joining their own event
    if (evt.organizer && evt.organizer.toString() === userId) {
      return res.status(400).json({ message: 'Organizer is already associated with the event' });
    }

    // prevent duplicate joins
    if (evt.volunteers && evt.volunteers.find(v => v.toString() === userId)) {
      return res.status(400).json({ message: 'Already joined' });
    }

    evt.volunteers = evt.volunteers || [];
    evt.volunteers.push(userId);
    await evt.save();

    const out = serializeEvent(evt.toObject());
    res.json(out);
  } catch (err) {
    console.error('join error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get events related to current user (created and joined)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const created = await Event.find({ organizer: userId }).lean();
    const joined = await Event.find({ volunteers: userId }).lean();
    res.json({ created: created.map(serializeEvent), joined: joined.map(serializeEvent) });
  } catch (err) {
    console.error('me error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave an event (requires auth)
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const evt = await Event.findById(req.params.id);
    if (!evt) return res.status(404).json({ message: 'Event not found' });
    const userId = req.user.id;
    if (!evt.volunteers || !evt.volunteers.find(v => v.toString() === userId)) {
      return res.status(400).json({ message: 'Not joined' });
    }
    evt.volunteers = evt.volunteers.filter(v => v.toString() !== userId);
    await evt.save();
    const out = serializeEvent(evt.toObject());
    res.json(out);
  } catch (err) {
    console.error('leave error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel (delete) an event - only organizer
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const evt = await Event.findById(req.params.id);
    if (!evt) return res.status(404).json({ message: 'Event not found' });
    if (evt.organizer.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await evt.remove();
    res.json({ message: 'Event cancelled' });
  } catch (err) {
    console.error('delete error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
