const mongoose = require('mongoose');
require('dotenv').config();

async function extendedDatabaseDiagnostics() {
  console.log('🔍 Extended MongoDB Connection Diagnostics');
  console.log('==========================================\n');

  console.log('📋 Connection String Analysis:');
  const uri = process.env.MONGO_URI;
  
  if (uri) {
    console.log(`✅ MONGO_URI found`);
    console.log(`📏 Length: ${uri.length} characters`);
    
    // Parse connection string components
    try {
      const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
      console.log(`🏠 Host: ${url.hostname}`);
      console.log(`👤 Username: ${url.username || 'Not specified'}`);
      console.log(`🔐 Password: ${url.password ? '***' : 'Not specified'}`);
      console.log(`💾 Database: ${uri.split('/').pop()?.split('?')[0] || 'Not specified'}`);
      
      // Check for common issues
      if (url.password && /[!@#$%^&*()+=\[\]{}|\\:";'<>?,./]/.test(url.password)) {
        console.log('⚠️  Password contains special characters - ensure they are URL-encoded');
      }
    } catch (err) {
      console.log('❌ Could not parse connection string - it may be malformed');
    }
  } else {
    console.log('❌ MONGO_URI not found in environment variables');
    return;
  }

  console.log('\n🔌 Extended Connection Test (30 second timeout):');
  
  try {
    // Set up comprehensive event monitoring
    const events = [];
    
    const eventHandlers = {
      connecting: () => events.push({ time: new Date(), event: 'connecting' }),
      connected: () => events.push({ time: new Date(), event: 'connected' }),
      open: () => events.push({ time: new Date(), event: 'open' }),
      disconnecting: () => events.push({ time: new Date(), event: 'disconnecting' }),
      disconnected: () => events.push({ time: new Date(), event: 'disconnected' }),
      close: () => events.push({ time: new Date(), event: 'close' }),
      error: (err) => events.push({ time: new Date(), event: 'error', message: err.message }),
      reconnected: () => events.push({ time: new Date(), event: 'reconnected' }),
    };

    // Register all event handlers
    Object.keys(eventHandlers).forEach(event => {
      mongoose.connection.on(event, eventHandlers[event]);
    });

    console.log('⏱️  Attempting connection with 30-second timeout...');
    const startTime = Date.now();
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,  // 30 second timeout
      connectTimeoutMS: 30000,          // 30 second connection timeout
      socketTimeoutMS: 60000,           // 60 second socket timeout
      maxPoolSize: 5,                   // Smaller pool for testing
      retryWrites: true,
      heartbeatFrequencyMS: 10000,      // Check every 10 seconds
    });

    const connectionTime = Date.now() - startTime;
    console.log(`✅ Connection successful in ${connectionTime}ms`);

    console.log('\n📊 Connection Details:');
    console.log(`Ready State: ${mongoose.connection.readyState} (1 = connected)`);
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    
    // Test database operations
    console.log('\n🧪 Testing Database Operations:');
    
    try {
      // Test 1: Admin command
      const adminDb = mongoose.connection.db.admin();
      const serverStatus = await adminDb.serverStatus();
      console.log(`✅ Server Status: OK (v${serverStatus.version})`);
      console.log(`⏱️  Server Uptime: ${Math.round(serverStatus.uptime / 3600)} hours`);
    } catch (err) {
      console.log(`❌ Server Status Test Failed: ${err.message}`);
    }

    try {
      // Test 2: List collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`✅ Collections: ${collections.length} found`);
      if (collections.length > 0) {
        console.log(`   ${collections.map(c => c.name).join(', ')}`);
      }
    } catch (err) {
      console.log(`❌ Collection List Test Failed: ${err.message}`);
    }

    try {
      // Test 3: Simple query
      const testCollection = mongoose.connection.db.collection('users');
      const userCount = await testCollection.countDocuments();
      console.log(`✅ User Count Query: ${userCount} users`);
    } catch (err) {
      console.log(`❌ User Count Test Failed: ${err.message}`);
    }

    // Connection stability test
    console.log('\n⏱️  Running 60-second stability test...');
    console.log('(Monitoring for unexpected disconnections)');
    
    let disconnectionDetected = false;
    const disconnectMonitor = () => {
      disconnectionDetected = true;
      console.log('\n❌ DISCONNECTION DETECTED during stability test!');
    };
    
    mongoose.connection.on('disconnected', disconnectMonitor);
    
    // Progress indicator
    const progressInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const state = mongoose.connection.readyState;
      const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      process.stdout.write(`\r⏱️  ${elapsed}s - State: ${stateNames[state]} - ${disconnectionDetected ? 'UNSTABLE' : 'Stable'}`);
    }, 2000);

    setTimeout(async () => {
      clearInterval(progressInterval);
      mongoose.connection.off('disconnected', disconnectMonitor);
      
      console.log('\n\n📋 Connection Event Timeline:');
      events.forEach(event => {
        const time = event.time.toISOString().split('T')[1].split('.')[0];
        console.log(`${time} - ${event.event}${event.message ? ': ' + event.message : ''}`);
      });

      console.log('\n🏁 Extended Diagnostics Summary:');
      console.log('=====================================');
      
      if (disconnectionDetected) {
        console.log('❌ UNSTABLE CONNECTION - Disconnections detected');
        console.log('\n🔧 Recommended Actions:');
        console.log('1. Check MongoDB Atlas cluster status');
        console.log('2. Verify IP whitelist in Atlas Network Access');
        console.log('3. Test from different network/location');
        console.log('4. Contact Atlas support if cluster issues persist');
      } else {
        console.log('✅ STABLE CONNECTION - No disconnections detected');
        console.log('\nIf you\'re still experiencing issues:');
        console.log('1. The problem may be intermittent');
        console.log('2. Check server logs during normal operation');
        console.log('3. Monitor connection over longer periods');
      }

      console.log('\n💡 Next Steps:');
      console.log('1. Use the improved server configuration (index-improved.js)');
      console.log('2. Implement connection retry logic in production');
      console.log('3. Set up monitoring/alerts for connection issues');
      
      await mongoose.connection.close();
      process.exit(disconnectionDetected ? 1 : 0);
    }, 60000); // 60 second test

  } catch (error) {
    console.log(`\n💥 Connection Failed: ${error.message}`);
    
    // Detailed error analysis
    console.log('\n🔍 Error Analysis:');
    
    if (error.message.includes('Server selection timed out')) {
      console.log('❌ SERVER SELECTION TIMEOUT');
      console.log('Most likely causes:');
      console.log('  1. 🚫 IP address not whitelisted in Atlas');
      console.log('  2. 🌐 Network connectivity issues');
      console.log('  3. ⏸️  Atlas cluster is paused/stopped');
      console.log('  4. 🔧 Incorrect connection string');
      
      console.log('\n🎯 IMMEDIATE ACTIONS:');
      console.log('1. Visit https://cloud.mongodb.com/');
      console.log('2. Go to Network Access → Add your IP');
      console.log('3. Or temporarily add 0.0.0.0/0 for testing');
      console.log('4. Ensure cluster is in RUNNING state');
      
    } else if (error.message.includes('authentication failed')) {
      console.log('❌ AUTHENTICATION FAILED');
      console.log('Check:');
      console.log('  1. Username/password in connection string');
      console.log('  2. User exists in Atlas Database Access');
      console.log('  3. Password special characters are URL-encoded');
      
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.log('❌ DNS RESOLUTION FAILED');
      console.log('Check:');
      console.log('  1. Internet connection');
      console.log('  2. DNS settings');
      console.log('  3. Corporate firewall/proxy');
      
    } else {
      console.log(`❌ UNKNOWN ERROR: ${error.message}`);
      console.log('Try:');
      console.log('  1. Check Atlas dashboard for issues');
      console.log('  2. Test with a simple MongoDB client');
      console.log('  3. Contact MongoDB Atlas support');
    }
    
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

extendedDatabaseDiagnostics();