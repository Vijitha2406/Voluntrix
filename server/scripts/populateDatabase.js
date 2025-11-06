const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Event = require('../models/Event');
const path = require('path');

// Load environment variables from the correct path
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('Environment check:');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('MONGO_URI starts with mongodb+srv:', process.env.MONGO_URI?.startsWith('mongodb+srv:'));

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voluntrix';

const sampleUsers = [
  {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@email.com',
    password: 'password123',
    role: 'volunteer',
    skills: [
      { name: 'Teaching', level: 'Advanced' },
      { name: 'Community Outreach', level: 'Intermediate' },
      { name: 'Event Planning', level: 'Beginner' }
    ],
    interests: ['Education', 'Youth Development', 'Community Service'],
    bio: 'Passionate educator with 5 years of experience in community outreach programs.',
    location: {
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      isRemote: false
    },
    preferences: {
      timeCommitment: '3-5 hours',
      remoteWork: false,
      availabilityDays: ['Saturday', 'Sunday'],
      travelDistance: 25
    },
    volunteerStats: {
      totalHours: 45,
      eventsCompleted: 3,
      badges: [
        { name: 'Community Helper', description: 'Helped multiple community events' },
        { name: 'Education Advocate', description: 'Promoted educational initiatives' }
      ]
    }
  },
  {
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob.smith@email.com',
    password: 'password123',
    role: 'organizer',
    skills: [
      { name: 'Project Management', level: 'Advanced' },
      { name: 'Fundraising', level: 'Advanced' },
      { name: 'Marketing', level: 'Intermediate' }
    ],
    interests: ['Environmental Conservation', 'Sustainability', 'Climate Action'],
    bio: 'Environmental activist and project manager dedicated to creating sustainable communities.',
    location: {
      city: 'Portland',
      state: 'OR',
      country: 'USA'
    },
    preferences: {
      timeCommitment: 'Full day',
      remoteWork: true,
      availabilityDays: ['Friday', 'Saturday', 'Sunday'],
      travelDistance: 50
    },
    volunteerStats: {
      totalHours: 120,
      eventsCompleted: 8,
      badges: [
        { name: 'Green Warrior', description: 'Environmental champion' },
        { name: 'Event Organizer', description: 'Successfully organized multiple events' },
        { name: 'Sustainability Champion', description: 'Promoted sustainable practices' }
      ]
    }
  },
  {
    firstName: 'Carol',
    lastName: 'Davis',
    email: 'carol.davis@email.com',
    password: 'password123',
    role: 'both',
    skills: [
      { name: 'Healthcare', level: 'Advanced' },
      { name: 'First Aid', level: 'Advanced' },
      { name: 'Medical Training', level: 'Expert' }
    ],
    interests: ['Healthcare', 'Emergency Response', 'Community Health'],
    bio: 'Registered nurse with expertise in emergency response and community health initiatives.',
    location: {
      city: 'Austin',
      state: 'TX',
      country: 'USA'
    },
    preferences: {
      timeCommitment: '6-8 hours',
      remoteWork: false,
      availabilityDays: ['Saturday', 'Sunday', 'Monday'],
      travelDistance: 30
    },
    volunteerStats: {
      totalHours: 200,
      eventsCompleted: 15,
      badges: [
        { name: 'Healthcare Hero', description: 'Provided healthcare services' },
        { name: 'Emergency Responder', description: 'Responded to emergency situations' },
        { name: 'Community Leader', description: 'Led community health initiatives' }
      ]
    }
  },
  {
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@email.com',
    password: 'password123',
    role: 'volunteer',
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
        { name: 'Tech Volunteer', description: 'Provided technology assistance' },
        { name: 'Digital Mentor', description: 'Mentored others in digital skills' }
      ]
    }
  },
  {
    firstName: 'Emma',
    lastName: 'Brown',
    email: 'emma.brown@email.com',
    password: 'password123',
    role: 'volunteer',
    skills: [
      { name: 'Animal Care', level: 'Advanced' },
      { name: 'Veterinary Assistance', level: 'Intermediate' },
      { name: 'Wildlife Rehabilitation', level: 'Beginner' }
    ],
    interests: ['Animal Welfare', 'Wildlife Conservation', 'Environmental Protection'],
    bio: 'Animal lover with experience in veterinary care and wildlife rehabilitation.',
    location: {
      city: 'Denver',
      state: 'CO',
      country: 'USA'
    },
    preferences: {
      timeCommitment: '6-8 hours',
      remoteWork: false,
      availabilityDays: ['Friday', 'Saturday', 'Sunday'],
      travelDistance: 35
    },
    volunteerStats: {
      totalHours: 95,
      eventsCompleted: 7,
      badges: [
        { name: 'Animal Advocate', description: 'Advocated for animal welfare' },
        { name: 'Wildlife Protector', description: 'Protected wildlife and habitats' }
      ]
    }
  }
];

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
  },
  {
    title: 'Beach Cleanup Initiative',
    description: 'Join our monthly beach cleanup to protect marine life and keep our coastlines beautiful. We provide all equipment and refreshments.',
    date: new Date('2025-12-07T07:00:00Z'),
    location: {
      address: 'Ocean Beach, San Francisco, CA',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      venue: 'Ocean Beach',
      isRemote: false
    },
    capacity: 30,
    category: 'Environment',
    requiredSkills: [
      { name: 'Environmental Conservation', level: 'Beginner', mandatory: false }
    ],
    timeCommitment: '3-5 hours',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
    volunteers: []
  },
  {
    title: 'Senior Tech Support Workshop',
    description: 'Help senior citizens learn to use smartphones, tablets, and computers. Provide one-on-one assistance with technology questions and digital literacy.',
    date: new Date('2025-12-10T13:00:00Z'),
    location: {
      address: '654 Community Center Dr, Portland, OR',
      city: 'Portland',
      state: 'OR',
      country: 'USA',
      venue: 'Portland Community Center',
      isRemote: false
    },
    capacity: 18,
    category: 'Education',
    requiredSkills: [
      { name: 'Technology', level: 'Intermediate', mandatory: true },
      { name: 'Teaching', level: 'Beginner', mandatory: false }
    ],
    timeCommitment: '3-5 hours',
    images: ['https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800&h=600&fit=crop'],
    volunteers: []
  },
  {
    title: 'Food Bank Sorting and Distribution',
    description: 'Help sort donations and distribute food to families in need. Perfect for groups and individuals looking to make a direct impact on food insecurity.',
    date: new Date('2025-12-14T09:00:00Z'),
    location: {
      address: '987 Hope Street, Austin, TX',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      venue: 'Hope Food Bank',
      isRemote: false
    },
    capacity: 40,
    category: 'Community',
    requiredSkills: [
      { name: 'Physical Labor', level: 'Beginner', mandatory: false },
      { name: 'Organization', level: 'Beginner', mandatory: false }
    ],
    timeCommitment: '3-5 hours',
    images: ['https://images.unsplash.com/photo-1593113616828-6e9aeb845d39?w=800&h=600&fit=crop'],
    volunteers: []
  },
  {
    title: 'Youth Mentorship Program',
    description: 'Mentor at-risk youth through educational activities, career guidance, and personal development sessions. Long-term commitment preferred.',
    date: new Date('2025-12-18T16:00:00Z'),
    location: {
      address: '147 Youth Center Blvd, Seattle, WA',
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      venue: 'Seattle Youth Development Center',
      isRemote: false
    },
    capacity: 10,
    category: 'Children',
    requiredSkills: [
      { name: 'Teaching', level: 'Intermediate', mandatory: false },
      { name: 'Mentoring', level: 'Beginner', mandatory: false }
    ],
    timeCommitment: '6-8 hours',
    images: ['https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=600&fit=crop'],
    volunteers: []
  }
];

async function populateDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('URI:', MONGODB_URI ? 'Set' : 'Not set');
    
    // Set a connection timeout
    const connection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log('✅ Connected to MongoDB successfully!');

    // Clear existing data and indexes
    console.log('🗑️  Clearing existing data...');
    
    // Drop indexes first to avoid conflicts
    try {
      await User.collection.dropIndexes();
      console.log('Dropped User indexes.');
    } catch (error) {
      console.log('No User indexes to drop or collection doesn\'t exist.');
    }
    
    try {
      await Event.collection.dropIndexes();
      console.log('Dropped Event indexes.');
    } catch (error) {
      console.log('No Event indexes to drop or collection doesn\'t exist.');
    }
    
    const deletedUsers = await User.deleteMany({});
    const deletedEvents = await Event.deleteMany({});
    console.log(`Deleted ${deletedUsers.deletedCount} users and ${deletedEvents.deletedCount} events.`);

    // Create users
    console.log('Creating sample users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      // Hash password and store in correct field
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      delete userData.password; // Remove the password field
      userData.passwordHash = hashedPassword; // Add the correct passwordHash field

      const user = new User({
        ...userData,
        passwordHash: hashedPassword
      });
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${savedUser.firstName} ${savedUser.lastName}`);
    }

    // Assign organizers to events
    const organizers = createdUsers.filter(user => 
      user.role === 'organizer' || user.role === 'both'
    );
    
    console.log('Creating sample events...');
    const createdEvents = [];
    
    for (let i = 0; i < sampleEvents.length; i++) {
      const eventData = sampleEvents[i];
      const organizer = organizers[i % organizers.length]; // Rotate organizers
      
      const event = new Event({
        ...eventData,
        organizer: organizer._id
      });
      
      const savedEvent = await event.save();
      createdEvents.push(savedEvent);
      console.log(`Created event: ${eventData.title} (Organizer: ${organizer.firstName})`);
    }

    // Create some sample applications
    console.log('Creating sample applications...');
    const volunteers = createdUsers.filter(user => 
      user.role === 'volunteer' || user.role === 'both'
    );

    // Add applications to various events
    let applicationCount = 0;
    for (let i = 0; i < volunteers.length && applicationCount < createdEvents.length; i++) {
      const volunteer = volunteers[i];
      
      // Find an event where this volunteer is not the organizer
      let eventIndex = applicationCount;
      let event = createdEvents[eventIndex];
      
      // Skip to next event if volunteer is organizer
      while (event && event.organizer.toString() === volunteer._id.toString()) {
        eventIndex = (eventIndex + 1) % createdEvents.length;
        event = createdEvents[eventIndex];
        // Prevent infinite loop
        if (eventIndex === applicationCount) break;
      }
      
      if (!event || event.organizer.toString() === volunteer._id.toString()) {
        continue; // Skip if no suitable event found
      }

      const statuses = ['pending', 'accepted', 'completed'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const application = {
        user: volunteer._id,
        status: status,
        appliedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
        message: `I'm very interested in this ${event.category.toLowerCase()} opportunity and believe my skills in ${volunteer.skills[0]?.name} would be valuable.`
      };

      if (status === 'accepted' || status === 'completed') {
        application.acceptedAt = new Date(application.appliedAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      }

      if (status === 'completed') {
        application.completedAt = new Date(application.acceptedAt.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000);
        application.volunteerHours = Math.floor(Math.random() * 8) + 2; // 2-10 hours
      }

      event.volunteers.push(application);
      await event.save();
      
      console.log(`Added application: ${volunteer.firstName} → ${event.title} (${status})`);
      applicationCount++;
    }

    // Add a few more applications for better testing
    for (let i = 0; i < 5; i++) {
      const randomVolunteer = volunteers[Math.floor(Math.random() * volunteers.length)];
      const randomEvent = createdEvents[Math.floor(Math.random() * createdEvents.length)];
      
      // Skip if volunteer is the organizer or already applied
      if (randomEvent.organizer.toString() === randomVolunteer._id.toString()) continue;
      if (randomEvent.volunteers.some(p => p.user.toString() === randomVolunteer._id.toString())) continue;

      const application = {
        user: randomVolunteer._id,
        status: 'pending',
        appliedAt: new Date(),
        message: `I would love to contribute to this ${randomEvent.category.toLowerCase()} initiative!`
      };

      randomEvent.volunteers.push(application);
      await randomEvent.save();
      
      console.log(`Added pending application: ${randomVolunteer.firstName} → ${randomEvent.title}`);
    }

    console.log('\n🎉 Database populated successfully!');
    console.log(`Created ${createdUsers.length} users and ${createdEvents.length} events with applications.`);
    
    console.log('\n📧 Sample login credentials:');
    sampleUsers.forEach(user => {
      console.log(`${user.firstName} ${user.lastName} (${user.role}): ${user.email} / password123`);
    });

    console.log('\n🔍 You can now test:');
    console.log('- AI-powered recommendations');
    console.log('- Event applications workflow');
    console.log('- User profiles with skills and interests');
    console.log('- Event management for organizers');

  } catch (error) {
    console.error('❌ Error populating database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

// Run the script
populateDatabase();