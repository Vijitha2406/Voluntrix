const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
require('dotenv').config();

const sampleEvents = [
  {
    title: 'Community Garden Cleanup',
    description: 'Join us for a community garden cleanup event! We\'ll be weeding, planting, and beautifying our local community garden. All skill levels welcome.',
    date: new Date('2025-11-15T09:00:00Z'),
    location: {
      address: '123 Green Street, San Francisco, CA',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      venue: 'Community Garden Center',
      isRemote: false
    },
    capacity: 20,
    category: 'Environment',
    requiredSkills: [
      { name: 'Gardening', level: 'Beginner', mandatory: false },
      { name: 'Physical Labor', level: 'Beginner', mandatory: false }
    ],
    timeCommitment: '3-5 hours',
    images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop'],
    volunteers: []
  },
  {
    title: 'Coding Workshop for Kids',
    description: 'Teach coding basics to underprivileged children aged 8-14. Help bridge the digital divide by introducing kids to programming concepts through fun, interactive activities.',
    date: new Date('2025-11-20T14:00:00Z'),
    location: {
      address: '456 Tech Avenue, Seattle, WA',
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      venue: 'Tech Community Center',
      isRemote: false
    },
    capacity: 15,
    category: 'Education',
    requiredSkills: [
      { name: 'Technology', level: 'Intermediate', mandatory: true },
      { name: 'Teaching', level: 'Beginner', mandatory: false }
    ],
    timeCommitment: '3-5 hours',
    images: ['https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop'],
    volunteers: []
  },
  {
    title: 'Free Health Screening Event',
    description: 'Assist healthcare professionals in providing free health screenings to the community. Help with registration, vital signs, and patient guidance.',
    date: new Date('2025-11-25T08:00:00Z'),
    location: {
      address: '789 Health Plaza, Austin, TX',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      venue: 'Community Health Center',
      isRemote: false
    },
    capacity: 25,
    category: 'Health',
    requiredSkills: [
      { name: 'Healthcare', level: 'Intermediate', mandatory: false },
      { name: 'First Aid', level: 'Beginner', mandatory: false }
    ],
    timeCommitment: '6-8 hours',
    images: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop'],
    volunteers: []
  },
  {
    title: 'Animal Shelter Volunteer Day',
    description: 'Spend a day helping at the local animal shelter. Activities include dog walking, cat socialization, cleaning kennels, and assisting with adoption events.',
    date: new Date('2025-12-01T10:00:00Z'),
    location: {
      address: '321 Animal Lane, Denver, CO',
      city: 'Denver',
      state: 'CO',
      country: 'USA',
      venue: 'Rocky Mountain Animal Shelter',
      isRemote: false
    },
    capacity: 12,
    category: 'Animals',
    requiredSkills: [
      { name: 'Animal Care', level: 'Beginner', mandatory: false }
    ],
    timeCommitment: '6-8 hours',
    images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=600&fit=crop'],
    volunteers: []
  }
];

async function populateEvents() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Get existing users to assign as organizers
    const users = await User.find({});
    console.log(`Found ${users.length} existing users.`);
    
    if (users.length === 0) {
      console.log('❌ No users found! Please run step 1 first to create users.');
      return;
    }

    // Find organizers (users with role 'organizer' or 'both')
    const organizers = users.filter(user => user.role === 'organizer' || user.role === 'both');
    console.log(`Found ${organizers.length} potential organizers.`);

    // Clear existing events
    console.log('🗑️  Clearing existing events...');
    
    // Drop indexes first to avoid conflicts
    try {
      await Event.collection.dropIndexes();
      console.log('Dropped Event indexes.');
    } catch (error) {
      console.log('No Event indexes to drop or collection doesn\'t exist.');
    }
    
    const deletedEvents = await Event.deleteMany({});
    console.log(`Deleted ${deletedEvents.deletedCount} events.`);

    // Create events
    console.log('Creating sample events...');
    const createdEvents = [];
    
    for (let i = 0; i < sampleEvents.length; i++) {
      const eventData = sampleEvents[i];
      
      // Assign organizer (rotate between available organizers)
      const organizer = organizers[i % organizers.length];
      eventData.organizer = organizer._id;
      
      const event = new Event(eventData);
      const savedEvent = await event.save();
      createdEvents.push(savedEvent);
      console.log(`Created event: ${savedEvent.title} (Organizer: ${organizer.firstName})`);
    }

    console.log(`\n✅ Successfully created ${createdEvents.length} events!`);
    console.log('\nEvent Summary:');
    createdEvents.forEach(event => {
      const organizer = organizers.find(org => org._id.toString() === event.organizer.toString());
      console.log(`- ${event.title} (${event.category}) - Organizer: ${organizer?.firstName}`);
    });

  } catch (error) {
    console.error('❌ Error populating events:', error);
  } finally {
    console.log('\nDisconnected from MongoDB.');
    await mongoose.disconnect();
  }
}

// Run the function
populateEvents();