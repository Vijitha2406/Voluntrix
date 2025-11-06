const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  name: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['volunteer', 'organizer', 'both', 'admin'], default: 'volunteer' },
  
  // Enhanced Profile Fields
  bio: { type: String, maxlength: 500 },
  profilePicture: { type: String }, // URL or base64 data
  phone: { type: String },
  dateOfBirth: { type: Date },
  location: {
    city: { type: String },
    state: { type: String },
    country: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  
  // Skills and Interests
  skills: [{
    name: { type: String, required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Beginner' },
    verified: { type: Boolean, default: false }
  }],
  interests: [{ type: String }], // Categories like 'Environment', 'Education', 'Health', etc.
  
  // Volunteering Preferences
  preferences: {
    availabilityDays: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
    timeCommitment: { type: String, enum: ['1-2 hours', '3-5 hours', '6-8 hours', 'Full day', 'Multiple days'] },
    travelDistance: { type: Number, default: 25 }, // in kilometers
    remoteWork: { type: Boolean, default: false }
  },
  
  // Volunteering History and Stats
  volunteerStats: {
    totalHours: { type: Number, default: 0 },
    eventsCompleted: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    badges: [{
      name: { type: String },
      description: { type: String },
      icon: { type: String },
      earnedDate: { type: Date, default: Date.now }
    }],
    certificates: [{
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
      certificateId: { type: String, unique: true },
      issuedDate: { type: Date, default: Date.now },
      verificationCode: { type: String }
    }]
  },
  
  // Notification and Privacy Preferences
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true },
    eventReminders: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: true }
  },
  
  privacySettings: {
    profileVisibility: { type: String, enum: ['public', 'volunteers', 'organizers', 'private'], default: 'public' },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    showLocation: { type: Boolean, default: true },
    showStats: { type: Boolean, default: true }
  },
  
  // Social Links
  socialLinks: {
    linkedin: { type: String },
    twitter: { type: String },
    website: { type: String }
  },
  
  // Account Status
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  lastLoginDate: { type: Date },
  joinDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for location-based searches
UserSchema.index({ 'location.coordinates': '2dsphere' });

// Separate indexes for skills and interests (cannot compound index two array fields)
UserSchema.index({ 'skills.name': 1 });
UserSchema.index({ interests: 1 });

// Virtual field for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.name || 'Anonymous User';
});

// Method to calculate user compatibility score with an event
UserSchema.methods.calculateCompatibilityScore = function(event) {
  let score = 0;
  
  // Check skill matches
  if (event.requiredSkills && this.skills) {
    const userSkills = this.skills.map(s => s.name.toLowerCase());
    const matchingSkills = event.requiredSkills.filter(skill => 
      userSkills.includes(skill.toLowerCase())
    );
    score += matchingSkills.length * 20; // 20 points per skill match
  }
  
  // Check interest matches
  if (event.category && this.interests) {
    if (this.interests.map(i => i.toLowerCase()).includes(event.category.toLowerCase())) {
      score += 30; // 30 points for interest match
    }
  }
  
  // Location proximity bonus (if both have coordinates)
  if (event.location?.coordinates && this.location?.coordinates) {
    const distance = calculateDistance(
      this.location.coordinates,
      event.location.coordinates
    );
    if (distance <= this.preferences?.travelDistance || 25) {
      score += Math.max(0, 20 - distance); // Up to 20 points for nearby events
    }
  }
  
  // Availability match
  if (event.date && this.preferences?.availabilityDays) {
    const eventDay = new Date(event.date).toLocaleDateString('en', { weekday: 'long' });
    if (this.preferences.availabilityDays.includes(eventDay)) {
      score += 15; // 15 points for availability match
    }
  }
  
  return Math.min(100, score); // Cap at 100
};

// Helper function to calculate distance between coordinates
function calculateDistance(coords1, coords2) {
  const R = 6371; // Earth's radius in km
  const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
  const dLon = (coords2.lng - coords1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = mongoose.model('User', UserSchema);
