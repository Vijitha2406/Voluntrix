require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Routes
const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const checkDb = require('./middlewares/checkDb');

// apply DB check middleware to API routes that require DB
app.use('/api/auth', checkDb, authRoutes);
app.use('/api/events', checkDb, eventsRoutes);

// simple health endpoint
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Enhanced MongoDB connection with better error handling and reconnection logic
async function connectToDatabase() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/voluntrix';
  
  // Enhanced connection options for stability
  const options = {
    maxPoolSize: 10,              // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 30000, // Increased timeout to 30 seconds
    socketTimeoutMS: 45000,       // Close sockets after 45 seconds of inactivity
    connectTimeoutMS: 30000,      // Give up initial connection after 30 seconds
    heartbeatFrequencyMS: 10000,  // Check server status every 10 seconds
    retryWrites: true,            // Retry writes on replica set primary failure
  };

  // Set up connection event listeners for better monitoring
  mongoose.connection.on('connecting', () => {
    console.log('🔄 Connecting to MongoDB...');
  });

  mongoose.connection.on('connected', () => {
    console.log('✅ Connected to MongoDB successfully');
  });

  mongoose.connection.on('open', () => {
    console.log('📂 MongoDB connection opened');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
  });

  mongoose.connection.on('close', () => {
    console.log('🔒 MongoDB connection closed');
  });

  // Handle process termination gracefully
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  });

  try {
    await mongoose.connect(uri, options);
    console.log('🎉 Database connection established successfully');
    return true;
  } catch (err) {
    console.error('💥 Failed to connect to MongoDB:', err.message);
    
    // Provide specific troubleshooting advice based on error type
    if (err.message.includes('authentication failed')) {
      console.error('🔐 Authentication Issue: Check username/password in connection string');
    } else if (err.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('🌐 Network Issue: Check internet connection and cluster hostname');
    } else if (err.message.includes('Server selection timed out')) {
      console.error('⏱️  Timeout Issue: Check if cluster is active and IP is whitelisted');
    }
    
    return false;
  }
}

async function start() {
  try {
    console.log('🚀 Starting Voluntrix Server...');
    
    // Attempt database connection
    const dbConnected = await connectToDatabase();
    
    if (!dbConnected) {
      console.log('⚠️  Server will start without database connection');
      console.log('   Database-backed routes will return 503 errors');
    }

    // Start the Express server regardless of database connection status
    app.listen(PORT, () => {
      console.log(`🌟 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      
      if (dbConnected) {
        console.log('💾 Database: Connected and ready');
      } else {
        console.log('💾 Database: Disconnected (routes will return 503)');
      }
    });

  } catch (err) {
    console.error('💥 Failed to start server:', err);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});

start();