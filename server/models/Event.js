const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  endDate: { type: Date }, // For multi-day events
  
  // Enhanced Location Information
  location: {
    address: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    venue: { type: String }, // Specific venue name
    isRemote: { type: Boolean, default: false }
  },
  
  capacity: { type: Number, required: true },
  
  // Event Categorization and Requirements
  category: { 
    type: String, 
    enum: ['Environment', 'Education', 'Health', 'Community', 'Animals', 'Seniors', 'Children', 'Disaster Relief', 'Technology', 'Arts & Culture', 'Sports', 'Other'],
    required: true 
  },
  tags: [{ type: String }],
  requiredSkills: [{
    name: { type: String, required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Beginner' },
    mandatory: { type: Boolean, default: false }
  }],
  
  // Event Media
  images: [{ type: String }], // Multiple event photos
  documents: [{
    name: { type: String },
    url: { type: String },
    type: { type: String, enum: ['PDF', 'DOC', 'Image', 'Other'] }
  }],
  
  // Participation Management
  volunteers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['applied', 'accepted', 'rejected', 'completed', 'no-show'], default: 'applied' },
    appliedDate: { type: Date, default: Date.now },
    statusUpdatedDate: { type: Date, default: Date.now },
    hoursLogged: { type: Number, default: 0 },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 500 },
      submittedDate: { type: Date }
    }
  }],
  
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: {
    name: { type: String },
    website: { type: String },
    contact: { type: String }
  },
  
  // Event Details
  requirements: {
    minimumAge: { type: Number, default: 0 },
    maximumAge: { type: Number },
    physicalDemands: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Low' },
    backgroundCheck: { type: Boolean, default: false },
    training: { type: Boolean, default: false },
    equipment: [{ type: String }] // Equipment provided or required
  },
  
  // Time and Duration
  duration: { type: Number }, // Duration in hours
  timeCommitment: { type: String, enum: ['1-2 hours', '3-5 hours', '6-8 hours', 'Full day', 'Multiple days'] },
  recurring: {
    isRecurring: { type: Boolean, default: false },
    frequency: { type: String, enum: ['Weekly', 'Bi-weekly', 'Monthly', 'Custom'] },
    endDate: { type: Date }
  },
  
  // Event Status and Management
  status: { 
    type: String, 
    enum: ['draft', 'published', 'cancelled', 'completed', 'in-progress'], 
    default: 'published' 
  },
  registrationDeadline: { type: Date },
  maxApplications: { type: Number }, // If different from capacity
  
  // Analytics and Feedback
  views: { type: Number, default: 0 },
  applications: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  
  // Communication
  updates: [{
    message: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    urgent: { type: Boolean, default: false }
  }],
  
  // Integration Fields
  googleCalendarEventId: { type: String },
  externalEventId: { type: String },
  
  // Certificates
  certificateTemplate: {
    enabled: { type: Boolean, default: false },
    templateId: { type: String },
    customText: { type: String }
  }
}, { timestamps: true });

// Indexes for better performance
EventSchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial index
EventSchema.index({ date: 1, status: 1 }); // Date and status queries
EventSchema.index({ category: 1, tags: 1 }); // Category and tag searches
EventSchema.index({ organizer: 1, status: 1 }); // Organizer queries
EventSchema.index({ 'requiredSkills.name': 1 }); // Skills-based matching

// Virtual for current application count
EventSchema.virtual('currentApplications').get(function() {
  return this.volunteers ? this.volunteers.length : 0;
});

// Virtual for available spots
EventSchema.virtual('availableSpots').get(function() {
  const accepted = this.volunteers ? this.volunteers.filter(v => v.status === 'accepted').length : 0;
  return Math.max(0, this.capacity - accepted);
});

// Virtual for completed volunteers count
EventSchema.virtual('completedVolunteers').get(function() {
  return this.volunteers ? this.volunteers.filter(v => v.status === 'completed').length : 0;
});

// Method to check if user can apply
EventSchema.methods.canUserApply = function(userId) {
  const now = new Date();
  const userApplication = this.volunteers.find(v => v.user.toString() === userId.toString());
  
  return (
    this.status === 'published' &&
    this.date > now &&
    (!this.registrationDeadline || this.registrationDeadline > now) &&
    this.availableSpots > 0 &&
    (!userApplication || userApplication.status === 'rejected')
  );
};

// Method to update event statistics
EventSchema.methods.updateStats = function() {
  const completedVolunteers = this.volunteers.filter(v => v.status === 'completed');
  const ratingsWithFeedback = completedVolunteers.filter(v => v.feedback && v.feedback.rating);
  
  this.completionRate = this.volunteers.length > 0 ? 
    (completedVolunteers.length / this.volunteers.length) * 100 : 0;
    
  if (ratingsWithFeedback.length > 0) {
    const totalRating = ratingsWithFeedback.reduce((sum, v) => sum + v.feedback.rating, 0);
    this.averageRating = totalRating / ratingsWithFeedback.length;
    this.totalRatings = ratingsWithFeedback.length;
  }
  
  return this.save();
};

module.exports = mongoose.model('Event', EventSchema);
