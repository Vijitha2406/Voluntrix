const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Event = require('../models/Event');
require('dotenv').config();

async function testSchemaIntegrity() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB successfully!');

    console.log('\n=== COMPREHENSIVE SCHEMA INTEGRITY TEST ===\n');

    // Test 1: User Authentication
    console.log('🔐 Test 1: User Authentication');
    const testUser = await User.findOne({ email: 'alice@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log(`Found user: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`Has passwordHash: ${!!testUser.passwordHash}`);
    
    if (testUser.passwordHash) {
      const passwordMatch = await bcrypt.compare('password123', testUser.passwordHash);
      console.log(`Password verification: ${passwordMatch ? '✅ PASSED' : '❌ FAILED'}`);
    }

    // Test 2: Event-Volunteer Relationship
    console.log('\n📅 Test 2: Event-Volunteer Relationship');
    const events = await Event.find({ 'volunteers.0': { $exists: true } });
    console.log(`Found ${events.length} events with volunteers`);
    
    for (const event of events.slice(0, 2)) { // Test first 2 events
      console.log(`\nEvent: ${event.title}`);
      console.log(`Volunteers count: ${event.volunteers.length}`);
      
      for (const volunteer of event.volunteers) {
        if (volunteer.user) {
          const user = await User.findById(volunteer.user);
          console.log(`  - ${user?.firstName || 'Unknown'} ${user?.lastName || ''} (${volunteer.status})`);
          console.log(`    Applied: ${volunteer.appliedDate?.toISOString()?.split('T')[0]}`);
          console.log(`    Hours: ${volunteer.hoursLogged || 0}`);
        } else {
          console.log(`  - Invalid volunteer object: ${JSON.stringify(volunteer)}`);
        }
      }
    }

    // Test 3: Skills and Interests Validation
    console.log('\n🎯 Test 3: Skills and Interests Validation');
    const users = await User.find({}).limit(3);
    
    for (const user of users) {
      console.log(`\nUser: ${user.firstName} ${user.lastName}`);
      console.log(`Skills: ${user.skills?.length || 0} skills`);
      user.skills?.forEach(skill => {
        console.log(`  - ${skill.name} (${skill.level})`);
      });
      console.log(`Interests: ${user.interests?.join(', ') || 'None'}`);
      console.log(`Time commitment: ${user.preferences?.timeCommitment || 'Not set'}`);
    }

    // Test 4: Event Categories and Requirements
    console.log('\n📋 Test 4: Event Categories and Requirements');
    const allEvents = await Event.find({});
    
    const categoryCount = {};
    const invalidCategories = [];
    const validCategories = ['Environment', 'Education', 'Health', 'Community', 'Animals', 'Seniors', 'Children', 'Disaster Relief', 'Technology', 'Arts & Culture', 'Sports', 'Other'];
    
    for (const event of allEvents) {
      categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
      
      if (!validCategories.includes(event.category)) {
        invalidCategories.push({ title: event.title, category: event.category });
      }
      
      console.log(`${event.title}:`);
      console.log(`  Category: ${event.category}`);
      console.log(`  Required skills: ${event.requiredSkills?.length || 0}`);
      console.log(`  Time commitment: ${event.timeCommitment}`);
      console.log(`  Capacity: ${event.capacity}`);
    }
    
    console.log('\nCategory distribution:', categoryCount);
    console.log(`Invalid categories: ${invalidCategories.length === 0 ? 'None ✅' : JSON.stringify(invalidCategories)}`);

    // Test 5: Database Indexes
    console.log('\n🔍 Test 5: Database Indexes');
    const userIndexes = await User.collection.getIndexes();
    const eventIndexes = await Event.collection.getIndexes();
    
    console.log('User indexes:');
    Object.keys(userIndexes).forEach(index => {
      console.log(`  - ${index}`);
    });
    
    console.log('Event indexes:');
    Object.keys(eventIndexes).forEach(index => {
      console.log(`  - ${index}`);
    });

    // Test 6: Data Consistency
    console.log('\n🔄 Test 6: Data Consistency');
    
    // Check for orphaned volunteer references
    const allUserIds = await User.distinct('_id');
    const userIdStrings = allUserIds.map(id => id.toString());
    
    let orphanedVolunteers = 0;
    for (const event of allEvents) {
      for (const volunteer of event.volunteers || []) {
        const volunteerId = volunteer.user ? volunteer.user.toString() : volunteer.toString();
        if (!userIdStrings.includes(volunteerId)) {
          orphanedVolunteers++;
          console.log(`  ⚠️  Orphaned volunteer reference in event "${event.title}": ${volunteerId}`);
        }
      }
    }
    
    if (orphanedVolunteers === 0) {
      console.log('✅ No orphaned volunteer references found');
    }
    
    // Check for orphaned organizer references
    let orphanedOrganizers = 0;
    for (const event of allEvents) {
      const organizerId = event.organizer ? event.organizer.toString() : null;
      if (organizerId && !userIdStrings.includes(organizerId)) {
        orphanedOrganizers++;
        console.log(`  ⚠️  Orphaned organizer reference in event "${event.title}": ${organizerId}`);
      }
    }
    
    if (orphanedOrganizers === 0) {
      console.log('✅ No orphaned organizer references found');
    }

    // Test 7: Required Field Validation
    console.log('\n📝 Test 7: Required Field Validation');
    
    const usersWithoutEmail = await User.countDocuments({ email: { $exists: false } });
    const usersWithoutPasswordHash = await User.countDocuments({ passwordHash: { $exists: false } });
    const eventsWithoutTitle = await Event.countDocuments({ title: { $exists: false } });
    const eventsWithoutOrganizer = await Event.countDocuments({ organizer: { $exists: false } });
    
    console.log(`Users without email: ${usersWithoutEmail === 0 ? '✅ 0' : '❌ ' + usersWithoutEmail}`);
    console.log(`Users without passwordHash: ${usersWithoutPasswordHash === 0 ? '✅ 0' : '❌ ' + usersWithoutPasswordHash}`);
    console.log(`Events without title: ${eventsWithoutTitle === 0 ? '✅ 0' : '❌ ' + eventsWithoutTitle}`);
    console.log(`Events without organizer: ${eventsWithoutOrganizer === 0 ? '✅ 0' : '❌ ' + eventsWithoutOrganizer}`);

    // Final Summary
    console.log('\n🎉 SCHEMA INTEGRITY TEST SUMMARY');
    console.log('================================');
    console.log(`Total Users: ${await User.countDocuments()}`);
    console.log(`Total Events: ${await Event.countDocuments()}`);
    console.log(`Total Volunteer Applications: ${allEvents.reduce((sum, evt) => sum + (evt.volunteers?.length || 0), 0)}`);
    
    const issues = [];
    if (orphanedVolunteers > 0) issues.push(`${orphanedVolunteers} orphaned volunteer references`);
    if (orphanedOrganizers > 0) issues.push(`${orphanedOrganizers} orphaned organizer references`);
    if (invalidCategories.length > 0) issues.push(`${invalidCategories.length} invalid categories`);
    if (usersWithoutEmail > 0) issues.push(`${usersWithoutEmail} users without email`);
    if (usersWithoutPasswordHash > 0) issues.push(`${usersWithoutPasswordHash} users without passwordHash`);
    
    if (issues.length === 0) {
      console.log('🎉 All tests passed! Database schema is healthy.');
    } else {
      console.log('⚠️  Issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

  } catch (error) {
    console.error('❌ Error testing schema integrity:', error);
  } finally {
    console.log('\nDisconnected from MongoDB.');
    await mongoose.disconnect();
  }
}

// Run the test
testSchemaIntegrity();