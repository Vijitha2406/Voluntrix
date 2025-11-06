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

// Enhanced MongoDB connection configuration
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  heartbeatFrequencyMS: 30000,
};

// Connection event handlers
mongoose.connection.on('connecting', () => {
  console.log('🔄 Connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB successfully');
});

mongoose.connection.on('open', () => {
  console.log('📂 MongoDB connection opened');
});

mongoose.connection.on('disconnecting', () => {
  console.log('⚠️  MongoDB disconnecting...');
});

mongoose.connection.on('disconnected', () => {
  console.log('💔 MongoDB disconnected');
  console.log('🔄 Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
  if (err.name === 'MongooseServerSelectionError') {
    console.log('💡 This is likely a network/Atlas connectivity issue');
    console.log('📝 Check: IP whitelist, cluster status, network connection');
  }
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down...');
  try {
    await mongoose.connection.close();
    console.log('📂 MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

async function start() {
  try {
    console.log('🚀 Starting Voluntrix Server...');
    
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/voluntrix';
    
    try {
      await mongoose.connect(uri, mongoOptions);
      console.log('🎉 Database connection established successfully');
    } catch (err) {
      console.error('⚠️  Warning: Failed to connect to MongoDB. Server will start but DB-backed routes will return 503.');
      console.error('❌ Connection error:', err && err.message);
      
      if (err.message.includes('Server selection timed out')) {
        console.log('\n🔧 TROUBLESHOOTING STEPS:');
        console.log('1. Check MongoDB Atlas cluster status');
        console.log('2. Verify IP whitelist in Network Access');
        console.log('3. Ensure cluster is not paused');
        console.log('4. Test with: node scripts/diagnoseMongoDB-extended.js');
      }
    }

    app.listen(PORT, () => {
      console.log(`🌐 Server running on http://localhost:${PORT}`);
      console.log('📊 Endpoints available:');
      console.log('   GET  /health - Health check');
      console.log('   POST /api/auth/* - Authentication routes');
      console.log('   GET  /api/events/* - Events routes');
    });
  } catch (err) {
    console.error('💥 Failed to start server:', err);
    process.exit(1);
  }
}

start();
