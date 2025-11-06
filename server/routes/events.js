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
  
  // Handle volunteers array properly - extract user IDs from volunteer objects for backward compatibility
  if (Array.isArray(obj.volunteers)) {
    obj.volunteers = obj.volunteers.map(v => {
      if (v && typeof v === 'object' && v.user) {
        // Return just the user ID for backward compatibility with frontend
        return v.user.toString();
      }
      return v ? v.toString() : v;
    });
  }
  
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
  const { title, description, date, location, capacity, image } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(401).json({ message: 'Invalid user' });
  if (!(user.role === 'organizer' || user.role === 'both')) {
    return res.status(403).json({ message: 'Only organizers can create events' });
  }

  const evt = new Event({ title, description, date, location, capacity, image, organizer: req.user.id });
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

    // prevent duplicate joins - check for user ID in volunteer objects
    if (evt.volunteers && evt.volunteers.find(v => (v.user || v).toString() === userId)) {
      return res.status(400).json({ message: 'Already applied or joined' });
    }

    evt.volunteers = evt.volunteers || [];
    
    // Create proper volunteer application object
    const volunteerApplication = {
      user: userId,
      status: 'applied',
      appliedDate: new Date(),
      statusUpdatedDate: new Date(),
      hoursLogged: 0
    };
    
    evt.volunteers.push(volunteerApplication);
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
    // Query for events where user is in volunteers array (checking user field in volunteer objects)
    const joined = await Event.find({ 'volunteers.user': userId }).lean();
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
    
    // Check if user is in volunteers array (looking at volunteer objects)
    const volunteerIndex = evt.volunteers.findIndex(v => (v.user || v).toString() === userId);
    if (volunteerIndex === -1) {
      return res.status(400).json({ message: 'Not joined' });
    }
    
    // Remove the volunteer application
    evt.volunteers.splice(volunteerIndex, 1);
    await evt.save();
    const out = serializeEvent(evt.toObject());
    res.json(out);
  } catch (err) {
    console.error('leave error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel (delete) an event - organizer or admin
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const evt = await Event.findById(req.params.id);
    if (!evt) return res.status(404).json({ message: 'Event not found' });
    
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(401).json({ message: 'Invalid user' });
    
    // Check if user is admin or the organizer of the event
    const isAdmin = user.role === 'admin';
    const isOrganizer = evt.organizer.toString() === req.user.id;
    
    if (!isAdmin && !isOrganizer) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await evt.remove();
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('delete error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get personalized event recommendations
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: 'Invalid user' });

    // Get all available events (not past, not full, not created by user)
    const now = new Date();
    const availableEvents = await Event.find({
      date: { $gte: now },
      status: 'published',
      organizer: { $ne: req.user.id },
      $expr: {
        $lt: [
          { $size: { $filter: { input: '$volunteers', cond: { $eq: ['$$this.status', 'accepted'] } } } },
          '$capacity'
        ]
      }
    }).populate('organizer', 'firstName lastName name');

    // Calculate compatibility scores for each event
    const scoredEvents = availableEvents.map(event => {
      const score = user.calculateCompatibilityScore ? 
        user.calculateCompatibilityScore(event) : 
        calculateBasicCompatibility(user, event);
      
      return {
        ...serializeEvent(event.toObject()),
        compatibilityScore: score,
        matchReasons: getMatchReasons(user, event)
      };
    });

    // Sort by compatibility score and return top 10
    const recommendations = scoredEvents
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 10);

    res.json(recommendations);
  } catch (err) {
    console.error('recommendations error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fallback compatibility calculation for older user documents
function calculateBasicCompatibility(user, event) {
  let score = 0;
  
  // Check skill matches
  if (event.requiredSkills && user.skills) {
    const userSkills = user.skills.map(s => s.name?.toLowerCase() || '');
    const matchingSkills = event.requiredSkills.filter(skill => 
      userSkills.includes(skill.name?.toLowerCase() || '')
    );
    score += matchingSkills.length * 20;
  }
  
  // Check interest matches
  if (event.category && user.interests) {
    if (user.interests.map(i => i.toLowerCase()).includes(event.category.toLowerCase())) {
      score += 30;
    }
  }
  
  // Location proximity (basic check)
  if (event.location?.isRemote && user.preferences?.remoteWork) {
    score += 25;
  }
  
  // Availability match (basic)
  if (event.date && user.preferences?.availabilityDays) {
    const eventDay = new Date(event.date).toLocaleDateString('en', { weekday: 'long' });
    if (user.preferences.availabilityDays.includes(eventDay)) {
      score += 15;
    }
  }
  
  return Math.min(100, score);
}

function getMatchReasons(user, event) {
  const reasons = [];
  
  // Skill matches
  if (event.requiredSkills && user.skills) {
    const userSkills = user.skills.map(s => s.name?.toLowerCase() || '');
    const matchingSkills = event.requiredSkills.filter(skill => 
      userSkills.includes(skill.name?.toLowerCase() || '')
    );
    if (matchingSkills.length > 0) {
      reasons.push(`Matches your skills: ${matchingSkills.map(s => s.name).join(', ')}`);
    }
  }
  
  // Interest matches
  if (event.category && user.interests) {
    if (user.interests.map(i => i.toLowerCase()).includes(event.category.toLowerCase())) {
      reasons.push(`Aligns with your interest in ${event.category}`);
    }
  }
  
  // Location compatibility
  if (event.location?.isRemote && user.preferences?.remoteWork) {
    reasons.push('Remote opportunity matches your preferences');
  }
  
  // Time commitment match
  if (event.timeCommitment && user.preferences?.timeCommitment === event.timeCommitment) {
    reasons.push(`Perfect time commitment match: ${event.timeCommitment}`);
  }
  
  // Availability match
  if (event.date && user.preferences?.availabilityDays) {
    const eventDay = new Date(event.date).toLocaleDateString('en', { weekday: 'long' });
    if (user.preferences.availabilityDays.includes(eventDay)) {
      reasons.push(`Available on ${eventDay}s`);
    }
  }
  
  return reasons;
}

// Apply to an event (requires auth)
router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body; // Optional application message
    const evt = await Event.findById(req.params.id);
    if (!evt) return res.status(404).json({ message: 'Event not found' });

    const userId = req.user.id;
    
    // Prevent organizer from applying to their own event
    if (evt.organizer && evt.organizer.toString() === userId) {
      return res.status(400).json({ message: 'Organizer cannot apply to their own event' });
    }

    // Check if already applied
    const existingApplication = evt.participants.find(
      p => p.user.toString() === userId
    );
    if (existingApplication) {
      return res.status(400).json({ 
        message: `You have already applied to this event (Status: ${existingApplication.status})` 
      });
    }

    // Check capacity
    const acceptedCount = evt.participants.filter(p => p.status === 'accepted').length;
    if (acceptedCount >= evt.capacity) {
      return res.status(400).json({ message: 'Event is at full capacity' });
    }

    // Add application
    evt.participants.push({
      user: userId,
      status: 'pending',
      appliedAt: new Date(),
      message: message || ''
    });

    await evt.save();

    // Populate user data for response
    await evt.populate('participants.user', 'firstName lastName email');
    
    const userApplication = evt.participants.find(p => p.user._id.toString() === userId);
    res.status(201).json({
      message: 'Application submitted successfully',
      application: userApplication,
      event: serializeEvent(evt.toObject())
    });
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get applications for an event (organizer only)
router.get('/:id/applications', authMiddleware, async (req, res) => {
  try {
    const evt = await Event.findById(req.params.id)
      .populate('participants.user', 'firstName lastName email skills location')
      .lean();
    
    if (!evt) return res.status(404).json({ message: 'Event not found' });

    // Only organizer can view applications
    if (evt.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only organizer can view applications' });
    }

    res.json({
      eventTitle: evt.title,
      applications: evt.participants.map(p => ({
        id: p._id,
        user: p.user,
        status: p.status,
        appliedAt: p.appliedAt,
        message: p.message,
        acceptedAt: p.acceptedAt,
        volunteerHours: p.volunteerHours
      }))
    });
  } catch (err) {
    console.error('Get applications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update application status (organizer only)
router.patch('/:eventId/applications/:applicationId', authMiddleware, async (req, res) => {
  try {
    const { status, feedback } = req.body; // status: 'pending', 'accepted', 'rejected', 'completed'
    
    if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const evt = await Event.findById(req.params.eventId);
    if (!evt) return res.status(404).json({ message: 'Event not found' });

    // Only organizer can update applications
    if (evt.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only organizer can update applications' });
    }

    const application = evt.participants.id(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check capacity when accepting
    if (status === 'accepted') {
      const acceptedCount = evt.participants.filter(
        p => p.status === 'accepted' && p._id.toString() !== req.params.applicationId
      ).length;
      
      if (acceptedCount >= evt.capacity) {
        return res.status(400).json({ message: 'Event is at full capacity' });
      }
      application.acceptedAt = new Date();
    }

    // Update status and feedback
    application.status = status;
    if (feedback) application.feedback = feedback;

    // Set completion date for completed status
    if (status === 'completed') {
      application.completedAt = new Date();
      // Award default hours if not set
      if (!application.volunteerHours) {
        application.volunteerHours = 4; // Default 4 hours
      }
      
      // Update user's volunteer stats
      const user = await User.findById(application.user);
      if (user) {
        user.volunteerStats.totalHours += application.volunteerHours;
        user.volunteerStats.eventsCompleted += 1;
        await user.save();
      }
    }

    await evt.save();
    
    // Populate user data for response
    await evt.populate('participants.user', 'firstName lastName email');
    
    res.json({
      message: `Application ${status} successfully`,
      application: evt.participants.id(req.params.applicationId)
    });
  } catch (err) {
    console.error('Update application error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set volunteer hours for completed application
router.patch('/:eventId/applications/:applicationId/hours', authMiddleware, async (req, res) => {
  try {
    const { hours } = req.body;
    
    if (!hours || hours < 0 || hours > 24) {
      return res.status(400).json({ message: 'Invalid hours value (0-24)' });
    }

    const evt = await Event.findById(req.params.eventId);
    if (!evt) return res.status(404).json({ message: 'Event not found' });

    // Only organizer can set hours
    if (evt.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only organizer can set volunteer hours' });
    }

    const application = evt.participants.id(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'completed') {
      return res.status(400).json({ message: 'Can only set hours for completed applications' });
    }

    const oldHours = application.volunteerHours || 0;
    application.volunteerHours = hours;
    await evt.save();

    // Update user's total hours
    const user = await User.findById(application.user);
    if (user) {
      user.volunteerStats.totalHours = user.volunteerStats.totalHours - oldHours + hours;
      await user.save();
    }

    res.json({
      message: 'Volunteer hours updated successfully',
      hours: hours
    });
  } catch (err) {
    console.error('Set hours error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's applications
router.get('/my-applications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const events = await Event.find({
      'participants.user': userId
    })
    .populate('organizer', 'firstName lastName email')
    .lean();

    const applications = [];
    events.forEach(event => {
      const userApplication = event.participants.find(
        p => p.user.toString() === userId
      );
      if (userApplication) {
        applications.push({
          id: userApplication._id,
          event: {
            id: event._id,
            title: event.title,
            description: event.description,
            date: event.date,
            location: event.location,
            image: event.image,
            organizer: event.organizer
          },
          status: userApplication.status,
          appliedAt: userApplication.appliedAt,
          acceptedAt: userApplication.acceptedAt,
          completedAt: userApplication.completedAt,
          volunteerHours: userApplication.volunteerHours,
          feedback: userApplication.feedback,
          message: userApplication.message
        });
      }
    });

    // Sort by application date (newest first)
    applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    res.json(applications);
  } catch (err) {
    console.error('Get my applications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
