const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Event = require('../models/Event');
require('dotenv').config();

async function fixDatabaseSchema() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB successfully!');

    console.log('\n=== FIXING DATABASE SCHEMA ISSUES ===');

    // Fix 1: Handle password/passwordHash field inconsistency
    console.log('\n--- Fixing password field issues ---');
    const usersWithPassword = await User.find({ password: { $exists: true } });
    console.log(`Found ${usersWithPassword.length} users with 'password' field`);

    for (const user of usersWithPassword) {
      if (user.password && !user.passwordHash) {
        // Hash the existing password and move it to passwordHash
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await User.updateOne(
          { _id: user._id },
          { 
            $set: { passwordHash: hashedPassword },
            $unset: { password: 1 }
          }
        );
        console.log(`Fixed password for user: ${user.email}`);
      }
    }

    // Fix 2: Add missing passwordHash for users without it
    const usersWithoutPasswordHash = await User.find({ 
      passwordHash: { $exists: false },
      email: { $exists: true }
    });
    console.log(`Found ${usersWithoutPasswordHash.length} users without passwordHash`);

    for (const user of usersWithoutPasswordHash) {
      // Set a default password hash for users missing it
      const defaultPassword = 'password123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await User.updateOne(
        { _id: user._id },
        { $set: { passwordHash: hashedPassword } }
      );
      console.log(`Added default passwordHash for user: ${user.email}`);
    }

    // Fix 3: Ensure all users have required fields
    console.log('\n--- Ensuring required fields ---');
    const usersToFix = await User.find({});
    
    for (const user of usersToFix) {
      const updates = {};
      
      // Ensure email is present
      if (!user.email) {
        updates.email = `user${user._id}@example.com`;
      }
      
      // Ensure role is valid
      if (!['volunteer', 'organizer', 'both', 'admin'].includes(user.role)) {
        updates.role = 'volunteer';
      }
      
      // Ensure required nested objects exist
      if (!user.preferences) {
        updates.preferences = {
          timeCommitment: '3-5 hours',
          remoteWork: false,
          availabilityDays: ['Saturday', 'Sunday'],
          travelDistance: 25
        };
      }
      
      if (!user.volunteerStats) {
        updates.volunteerStats = {
          totalHours: 0,
          eventsCompleted: 0,
          averageRating: 0,
          totalRatings: 0,
          badges: [],
          certificates: []
        };
      }
      
      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        console.log(`Updated required fields for user: ${user.email || user._id}`);
      }
    }

    // Fix 4: Check and fix Event schema issues
    console.log('\n--- Checking Event schema issues ---');
    const eventsWithoutOrganizer = await Event.find({ organizer: { $exists: false } });
    console.log(`Found ${eventsWithoutOrganizer.length} events without organizer`);

    if (eventsWithoutOrganizer.length > 0) {
      // Find a default organizer
      const defaultOrganizer = await User.findOne({ 
        $or: [{ role: 'organizer' }, { role: 'both' }] 
      });
      
      if (defaultOrganizer) {
        for (const event of eventsWithoutOrganizer) {
          await Event.updateOne(
            { _id: event._id },
            { $set: { organizer: defaultOrganizer._id } }
          );
          console.log(`Assigned default organizer to event: ${event.title}`);
        }
      }
    }

    // Fix 5: Ensure proper volunteer application structure
    console.log('\n--- Fixing volunteer application structure ---');
    const eventsWithVolunteers = await Event.find({ 'volunteers.0': { $exists: true } });
    
    for (const event of eventsWithVolunteers) {
      let needsUpdate = false;
      const updatedVolunteers = event.volunteers.map(volunteer => {
        // Ensure all required fields exist in volunteer applications
        const updatedVolunteer = { ...volunteer.toObject() };
        
        if (!updatedVolunteer.status) {
          updatedVolunteer.status = 'applied';
          needsUpdate = true;
        }
        
        if (!updatedVolunteer.appliedDate) {
          updatedVolunteer.appliedDate = new Date();
          needsUpdate = true;
        }
        
        if (!updatedVolunteer.statusUpdatedDate) {
          updatedVolunteer.statusUpdatedDate = updatedVolunteer.appliedDate || new Date();
          needsUpdate = true;
        }
        
        if (typeof updatedVolunteer.hoursLogged !== 'number') {
          updatedVolunteer.hoursLogged = 0;
          needsUpdate = true;
        }
        
        return updatedVolunteer;
      });
      
      if (needsUpdate) {
        await Event.updateOne(
          { _id: event._id },
          { $set: { volunteers: updatedVolunteers } }
        );
        console.log(`Fixed volunteer structure for event: ${event.title}`);
      }
    }

    // Fix 6: Validate and fix enum values
    console.log('\n--- Validating enum values ---');
    
    // Check User roles
    const usersWithInvalidRole = await User.find({ 
      role: { $nin: ['volunteer', 'organizer', 'both', 'admin'] } 
    });
    
    for (const user of usersWithInvalidRole) {
      await User.updateOne(
        { _id: user._id },
        { $set: { role: 'volunteer' } }
      );
      console.log(`Fixed invalid role for user: ${user.email}`);
    }

    // Check Event categories
    const validCategories = ['Environment', 'Education', 'Health', 'Community', 'Animals', 'Seniors', 'Children', 'Disaster Relief', 'Technology', 'Arts & Culture', 'Sports', 'Other'];
    const eventsWithInvalidCategory = await Event.find({ 
      category: { $nin: validCategories } 
    });
    
    for (const event of eventsWithInvalidCategory) {
      await Event.updateOne(
        { _id: event._id },
        { $set: { category: 'Other' } }
      );
      console.log(`Fixed invalid category for event: ${event.title}`);
    }

    console.log('\n✅ Schema fixes completed successfully!');
    
    // Final validation check
    console.log('\n=== FINAL VALIDATION ===');
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const usersWithPasswordHash = await User.countDocuments({ passwordHash: { $exists: true } });
    const eventsWithOrganizer = await Event.countDocuments({ organizer: { $exists: true } });
    
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with passwordHash: ${usersWithPasswordHash}`);
    console.log(`Total events: ${totalEvents}`);
    console.log(`Events with organizer: ${eventsWithOrganizer}`);
    
    if (usersWithPasswordHash === totalUsers && eventsWithOrganizer === totalEvents) {
      console.log('🎉 All schema issues have been resolved!');
    } else {
      console.log('⚠️  Some issues may still exist. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
  } finally {
    console.log('\nDisconnected from MongoDB.');
    await mongoose.disconnect();
  }
}

// Run the function
fixDatabaseSchema();