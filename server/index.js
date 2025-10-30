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

async function start() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/voluntrix';
    try {
      await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('Warning: Failed to connect to MongoDB. Server will start but DB-backed routes will return 503.', err && err.message);
    }

    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
