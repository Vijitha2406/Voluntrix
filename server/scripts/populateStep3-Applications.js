const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
require('dotenv').config();

async function populateApplications() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Get existing users and events
    const users = await User.find({});
    const events = await Event.find({});
    
    console.log(`Found ${users.length} users and ${events.length} events.`);
    
    if (users.length === 0 || events.length === 0) {
      console.log('❌ No users or events found! Please run steps 1 and 2 first.');
      return;
    }

    // Filter volunteers (users who can apply to events)
    const volunteers = users.filter(user => user.role === 'volunteer' || user.role === 'both');
    console.log(`Found ${volunteers.length} potential volunteers.`);

    console.log('Creating sample applications...');
    let applicationCount = 0;

    // Create applications between volunteers and events
    for (let i = 0; i < volunteers.length && i < events.length; i++) {
      const volunteer = volunteers[i];
      const event = events[i];
      
      // Skip if volunteer is the organizer of this event
      if (event.organizer.toString() === volunteer._id.toString()) {
        console.log(`Skipping: ${volunteer.firstName} is the organizer of ${event.title}`);
        continue;
      }

      const statuses = ['applied', 'accepted', 'completed'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const application = {
        user: volunteer._id,
        status: status,
        appliedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
        applicationMessage: `I'm very interested in this ${event.category.toLowerCase()} opportunity and believe my skills in ${volunteer.skills[0]?.name || 'general volunteering'} would be valuable.`
      };

      // Add dates based on status
      if (status === 'accepted' || status === 'completed') {
        application.respondedDate = new Date(application.appliedDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      }

      if (status === 'completed') {
        application.completedDate = new Date(application.respondedDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000);
        application.hoursVolunteered = Math.floor(Math.random() * 8) + 2; // 2-10 hours
      }

      event.volunteers.push(application);
      await event.save();
      
      console.log(`Added application: ${volunteer.firstName} → ${event.title} (${status})`);
      applicationCount++;
    }

    // Add a few more random applications for better testing
    console.log('\nAdding additional random applications...');
    for (let i = 0; i < 3; i++) {
      const randomVolunteer = volunteers[Math.floor(Math.random() * volunteers.length)];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      
      // Skip if volunteer is the organizer or already applied
      if (randomEvent.organizer.toString() === randomVolunteer._id.toString()) {
        console.log(`Skipping: ${randomVolunteer.firstName} is the organizer of ${randomEvent.title}`);
        continue;
      }
      
      const alreadyApplied = randomEvent.volunteers.some(v => v.user.toString() === randomVolunteer._id.toString());
      if (alreadyApplied) {
        console.log(`Skipping: ${randomVolunteer.firstName} already applied to ${randomEvent.title}`);
        continue;
      }

      const application = {
        user: randomVolunteer._id,
        status: 'applied',
        appliedDate: new Date(),
        applicationMessage: `I would love to contribute to this ${randomEvent.category.toLowerCase()} initiative!`
      };

      randomEvent.volunteers.push(application);
      await randomEvent.save();
      
      console.log(`Added application: ${randomVolunteer.firstName} → ${randomEvent.title} (applied)`);
      applicationCount++;
    }

    console.log(`\n✅ Successfully created ${applicationCount} applications!`);
    
    // Show summary
    console.log('\nApplication Summary:');
    for (const event of events) {
      const updatedEvent = await Event.findById(event._id).populate('volunteers.user', 'firstName lastName');
      console.log(`\n${updatedEvent.title}:`);
      if (updatedEvent.volunteers.length === 0) {
        console.log('  - No applications yet');
      } else {
        updatedEvent.volunteers.forEach(volunteer => {
          console.log(`  - ${volunteer.user.firstName} ${volunteer.user.lastName} (${volunteer.status})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error populating applications:', error);
  } finally {
    console.log('\nDisconnected from MongoDB.');
    await mongoose.disconnect();
  }
}

// Run the function
populateApplications();