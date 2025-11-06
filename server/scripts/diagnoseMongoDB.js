const mongoose = require('mongoose');
require('dotenv').config();

async function diagnoseDatabaseConnection() {
  console.log('🔍 MongoDB Connection Diagnostics');
  console.log('=================================\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`MONGO_URI exists: ${!!process.env.MONGO_URI}`);
  console.log(`MONGO_URI type: ${typeof process.env.MONGO_URI}`);
  console.log(`MONGO_URI length: ${process.env.MONGO_URI?.length || 0}`);
  console.log(`Uses Atlas: ${process.env.MONGO_URI?.includes('mongodb+srv://') || false}`);
  
  // Partially show URI (hide sensitive parts)
  if (process.env.MONGO_URI) {
    const maskedUri = process.env.MONGO_URI.replace(/:([^:@]+)@/, ':***@');
    console.log(`MONGO_URI (masked): ${maskedUri}`);
  }

  console.log('\n🔌 Connection Test:');
  
  try {
    // Set up connection event listeners
    mongoose.connection.on('connecting', () => {
      console.log('🔄 Mongoose connecting...');
    });

    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected');
    });

    mongoose.connection.on('open', () => {
      console.log('📂 Mongoose connection opened');
    });

    mongoose.connection.on('disconnecting', () => {
      console.log('🔌 Mongoose disconnecting...');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('❌ Mongoose disconnected');
    });

    mongoose.connection.on('close', () => {
      console.log('🔒 Mongoose connection closed');
    });

    mongoose.connection.on('error', (err) => {
      console.log('💥 Mongoose connection error:', err.message);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected');
    });

    // Attempt connection
    console.log('Attempting to connect...');
    await mongoose.connect(process.env.MONGO_URI, {
      // Modern connection options for Mongoose 6+
      maxPoolSize: 10,        // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log('\n📊 Connection Status:');
    console.log(`Ready State: ${mongoose.connection.readyState}`);
    console.log('Ready State meanings:');
    console.log('  0 = disconnected');
    console.log('  1 = connected');
    console.log('  2 = connecting');
    console.log('  3 = disconnecting');
    
    console.log(`Database Name: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Port: ${mongoose.connection.port}`);

    // Test basic database operations
    console.log('\n🧪 Database Operations Test:');
    
    // Test if we can list collections
    const adminDb = mongoose.connection.db.admin();
    try {
      const serverStatus = await adminDb.serverStatus();
      console.log(`✅ Server Status: ${serverStatus.ok === 1 ? 'OK' : 'Not OK'}`);
      console.log(`MongoDB Version: ${serverStatus.version}`);
      console.log(`Uptime: ${Math.round(serverStatus.uptime / 3600)} hours`);
    } catch (err) {
      console.log(`❌ Server Status Check Failed: ${err.message}`);
    }

    // Test collections
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`✅ Collections accessible: ${collections.length} collections found`);
      collections.forEach(col => console.log(`  - ${col.name}`));
    } catch (err) {
      console.log(`❌ Collections Check Failed: ${err.message}`);
    }

    // Monitor connection for 30 seconds
    console.log('\n⏱️  Monitoring connection stability for 30 seconds...');
    console.log('(This will help detect if the connection drops unexpectedly)');
    
    let connectionDropped = false;
    const disconnectHandler = () => {
      connectionDropped = true;
      console.log('❌ Connection dropped during monitoring!');
    };
    
    mongoose.connection.on('disconnected', disconnectHandler);
    
    const startTime = Date.now();
    const monitorInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const state = mongoose.connection.readyState;
      const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      process.stdout.write(`\r⏱️  ${elapsed}s - State: ${stateNames[state] || 'unknown'} (${state})`);
      
      if (connectionDropped) {
        clearInterval(monitorInterval);
        console.log('\n💥 Connection stability test FAILED - connection dropped');
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(monitorInterval);
      mongoose.connection.off('disconnected', disconnectHandler);
      
      if (!connectionDropped) {
        console.log('\n✅ Connection stability test PASSED - no drops detected');
      }
      
      console.log('\n🏁 Diagnostics Complete');
      console.log('====================================');
      
      if (connectionDropped) {
        console.log('\n🚨 ISSUES DETECTED:');
        console.log('- Connection is unstable and dropping');
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('1. Check your internet connection');
        console.log('2. Verify MongoDB Atlas cluster is active');
        console.log('3. Check if your IP is whitelisted in Atlas');
        console.log('4. Verify credentials in connection string');
        console.log('5. Consider increasing connection timeout values');
      } else {
        console.log('\n✅ No immediate issues detected');
        console.log('If you\'re still experiencing disconnections:');
        console.log('1. Monitor server logs during normal operation');
        console.log('2. Check if disconnections happen at specific times');
        console.log('3. Consider implementing connection retry logic');
      }
      
      process.exit(connectionDropped ? 1 : 0);
    }, 30000);

  } catch (error) {
    console.log('\n💥 Connection Test Failed:');
    console.log(`Error: ${error.message}`);
    
    console.log('\n🔧 Troubleshooting Steps:');
    
    if (error.message.includes('authentication failed')) {
      console.log('❌ Authentication Issue:');
      console.log('  - Check username and password in connection string');
      console.log('  - Ensure password is URL-encoded if it contains special characters');
      console.log('  - Verify user exists in MongoDB Atlas with correct permissions');
    }
    
    if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.log('❌ DNS/Network Issue:');
      console.log('  - Check internet connection');
      console.log('  - Verify cluster hostname in connection string');
      console.log('  - Try connecting from a different network');
    }
    
    if (error.message.includes('connection timeout')) {
      console.log('❌ Timeout Issue:');
      console.log('  - Check if IP address is whitelisted in MongoDB Atlas');
      console.log('  - Verify firewall settings');
      console.log('  - Try increasing timeout values');
    }
    
    if (error.message.includes('Server selection timed out')) {
      console.log('❌ Server Selection Issue:');
      console.log('  - MongoDB cluster might be paused or down');
      console.log('  - Check MongoDB Atlas cluster status');
      console.log('  - Verify connection string format');
    }
    
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Received interrupt signal, closing connection...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run diagnostics
diagnoseDatabaseConnection();