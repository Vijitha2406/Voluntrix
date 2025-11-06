const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const sampleUsers = [
  {
    name: 'Alice Johnson',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
    password: 'password123',
    role: 'volunteer',
    skills: [
      { name: 'Teaching', level: 'Intermediate' },
      { name: 'Communication', level: 'Advanced' },
      { name: 'Event Planning', level: 'Beginner' }
    ],
    interests: ['Education', 'Youth Development', 'Community Building'],
    bio: 'Passionate educator with 5 years of experience in community outreach and youth mentoring.',
    location: {
      city: 'San Francisco',
      state: 'CA',
      country: 'USA'
    },
    preferences: {
      timeCommitment: '3-5 hours',
      remoteWork: false,
      availabilityDays: ['Saturday', 'Sunday'],
      travelDistance: 25
    },
    volunteerStats: {
      totalHours: 120,
      eventsCompleted: 8,
      badges: [
        { name: 'Community Helper', description: 'Completed 5+ community events' },
        { name: 'Education Advocate', description: 'Specialized in educational volunteering' }
      ]
    }
  },
  {
    name: 'Bob Smith',
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob@example.com',
    password: 'password123',
    role: 'organizer',
    skills: [
      { name: 'Project Management', level: 'Expert' },
      { name: 'Leadership', level: 'Advanced' },
      { name: 'Environmental Conservation', level: 'Advanced' }
    ],
    interests: ['Environment', 'Sustainability', 'Community Development'],
    bio: 'Environmental advocate and experienced project manager dedicated to creating positive community impact.',
    location: {
      city: 'San Francisco',
      state: 'CA',
      country: 'USA'
    },
    preferences: {
      timeCommitment: 'Full day',
      remoteWork: false,
      availabilityDays: ['Saturday', 'Sunday', 'Friday'],
      travelDistance: 50
    },
    volunteerStats: {
      totalHours: 200,
      eventsCompleted: 12,
      badges: [
        { name: 'Green Leader', description: 'Organized 5+ environmental events' },
        { name: 'Community Builder', description: 'Led community development initiatives' }
      ]
    }
  },
  {
    name: 'Carol Davis',
    firstName: 'Carol',
    lastName: 'Davis',
    email: 'carol@example.com',
    password: 'password123',
    role: 'both',
    skills: [
      { name: 'Technology', level: 'Expert' },
      { name: 'Web Development', level: 'Advanced' },
      { name: 'Digital Literacy Training', level: 'Intermediate' }
    ],
    interests: ['Technology', 'Digital Inclusion', 'Education'],
    bio: 'Software developer passionate about bridging the digital divide in underserved communities.',
    location: {
      city: 'Seattle',
      state: 'WA',
      country: 'USA'
    },
    preferences: {
      timeCommitment: 'Full day',
      remoteWork: true,
      availabilityDays: ['Saturday', 'Sunday'],
      travelDistance: 40
    },
    volunteerStats: {
      totalHours: 80,
      eventsCompleted: 6,
      badges: [
        { name: 'Tech for Good', description: 'Used technology skills for community benefit' }
      ]
    }
  },
  {
    name: 'David Wilson',
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david@example.com',
    password: 'password123',
    role: 'volunteer',
    skills: [
      { name: 'Healthcare', level: 'Advanced' },
      { name: 'First Aid', level: 'Expert' },
      { name: 'Patient Care', level: 'Advanced' }
    ],
    interests: ['Health', 'Senior Care', 'Emergency Response'],
    bio: 'Retired nurse committed to improving community health and emergency preparedness.',
    location: {
      city: 'Austin',
      state: 'TX',
      country: 'USA'
    },
    preferences: {
      timeCommitment: '6-8 hours',
      remoteWork: false,
      availabilityDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      travelDistance: 30
    },
    volunteerStats: {
      totalHours: 150,
      eventsCompleted: 10,
      badges: [
        { name: 'Health Hero', description: 'Contributed significantly to health initiatives' },
        { name: 'Emergency Responder', description: 'Trained in emergency response' }
      ]
    }
  },
  {
    name: 'Emma Brown',
    firstName: 'Emma',
    lastName: 'Brown',
    email: 'emma@example.com',
    password: 'password123',
    role: 'volunteer',
    skills: [
      { name: 'Animal Care', level: 'Advanced' },
      { name: 'Veterinary Support', level: 'Intermediate' },
      { name: 'Animal Training', level: 'Beginner' }
    ],
    interests: ['Animals', 'Wildlife Conservation', 'Pet Rescue'],
    bio: 'Animal lover and veterinary technician dedicated to animal welfare and rescue efforts.',
    location: {
      city: 'Denver',
      state: 'CO',
      country: 'USA'
    },
    preferences: {
      timeCommitment: '1-2 hours',
      remoteWork: false,
      availabilityDays: ['Saturday', 'Sunday'],
      travelDistance: 20
    },
    volunteerStats: {
      totalHours: 90,
      eventsCompleted: 7,
      badges: [
        { name: 'Animal Friend', description: 'Dedicated to animal welfare' }
      ]
    }
  }
];

async function populateUsers() {
  try {
    console.log('Environment check:');
    console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
    console.log('MONGO_URI starts with mongodb+srv:', process.env.MONGO_URI?.startsWith('mongodb+srv://'));

    console.log('🔄 Connecting to MongoDB...');
    console.log('URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Clear existing users
    console.log('🗑️  Clearing existing users...');
    
    // Drop indexes first to avoid conflicts
    try {
      await User.collection.dropIndexes();
      console.log('Dropped User indexes.');
    } catch (error) {
      console.log('No User indexes to drop or collection doesn\'t exist.');
    }
    
    const deletedUsers = await User.deleteMany({});
    console.log(`Deleted ${deletedUsers.deletedCount} users.`);

    // Create users
    console.log('Creating sample users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      // Hash password and store in correct field
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      delete userData.password; // Remove the password field
      userData.passwordHash = hashedPassword; // Add the correct passwordHash field
      
      const user = new User(userData);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${savedUser.firstName} ${savedUser.lastName}`);
    }

    console.log(`\n✅ Successfully created ${createdUsers.length} users!`);
    console.log('\nUser Summary:');
    createdUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.role}) - ${user.email}`);
    });

  } catch (error) {
    console.error('❌ Error populating users:', error);
  } finally {
    console.log('\nDisconnected from MongoDB.');
    await mongoose.disconnect();
  }
}

// Run the function
populateUsers();