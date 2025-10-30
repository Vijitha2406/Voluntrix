const mongoose = require('mongoose');

// middleware: ensure mongoose is connected
module.exports = function checkDb(req, res, next) {
  // readyState 1 = connected
  if (mongoose.connection && mongoose.connection.readyState === 1) return next();
  return res.status(503).json({ message: 'Database unavailable. Try again later.' });
};
