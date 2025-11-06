const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
require('dotenv').config();

async function checkDatabaseSchema() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Check current data in database
    console.log('\n=== DATABASE CONTENT ANALYSIS ===');
    
    const users = await User.find({}).limit(3);
    const events = await Event.find({}).limit(3);
    
    console.log(`\nFound ${await User.countDocuments()} users and ${await Event.countDocuments()} events in database.`);
    
    if (users.length > 0) {
      console.log('\n--- SAMPLE USER DOCUMENT ---');
      console.log('User fields present:', Object.keys(users[0].toObject()));
      console.log('Sample user:', JSON.stringify(users[0].toObject(), null, 2));
    }
    
    if (events.length > 0) {
      console.log('\n--- SAMPLE EVENT DOCUMENT ---');
      console.log('Event fields present:', Object.keys(events[0].toObject()));
      console.log('Sample event:', JSON.stringify(events[0].toObject(), null, 2));
    }

    // Check for schema validation errors
    console.log('\n=== SCHEMA VALIDATION CHECK ===');
    
    // Test User schema validation
    try {
      const testUser = new User({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role: 'volunteer'
      });
      await testUser.validate();
      console.log('✅ User schema validation: PASSED');
    } catch (error) {
      console.log('❌ User schema validation: FAILED');
      console.log('Error:', error.message);
    }

    // Test Event schema validation
    try {
      const testEvent = new Event({
        title: 'Test Event',
        description: 'Test Description',
        date: new Date(),
        location: {
          address: 'Test Address',
          isRemote: false
        },
        capacity: 10,
        category: 'Community',
        organizer: new mongoose.Types.ObjectId(),
        timeCommitment: '3-5 hours'
      });
      await testEvent.validate();
      console.log('✅ Event schema validation: PASSED');
    } catch (error) {
      console.log('❌ Event schema validation: FAILED');
      console.log('Error:', error.message);
    }

    // Check for common schema issues
    console.log('\n=== COMMON SCHEMA ISSUES CHECK ===');
    
    // Check password vs passwordHash issue
    const usersWithPassword = await User.find({ password: { $exists: true } });
    const usersWithPasswordHash = await User.find({ passwordHash: { $exists: true } });
    
    console.log(`Users with 'password' field: ${usersWithPassword.length}`);
    console.log(`Users with 'passwordHash' field: ${usersWithPasswordHash.length}`);
    
    if (usersWithPassword.length > 0) {
      console.log('⚠️  ISSUE: Some users have "password" field instead of "passwordHash"');
    }

    // Check for missing required fields
    const usersWithoutEmail = await User.find({ email: { $exists: false } });
    const eventsWithoutOrganizer = await Event.find({ organizer: { $exists: false } });
    
    console.log(`Users missing email: ${usersWithoutEmail.length}`);
    console.log(`Events missing organizer: ${eventsWithoutOrganizer.length}`);

    // Check indexes
    console.log('\n=== INDEXES CHECK ===');
    const userIndexes = await User.collection.getIndexes();
    const eventIndexes = await Event.collection.getIndexes();
    
    console.log('User indexes:', Object.keys(userIndexes));
    console.log('Event indexes:', Object.keys(eventIndexes));

  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  } finally {
    console.log('\nDisconnected from MongoDB.');
    await mongoose.disconnect();
  }
}

// Run the function
checkDatabaseSchema();