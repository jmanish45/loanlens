const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  const uri = config.mongodbUri;

  if (!uri) {
    if (config.nodeEnv === 'production') {
      throw new Error('MONGODB_URI is required in production');
    }
    console.warn('[DB] MONGODB_URI not set — skipping database connection in development');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (config.nodeEnv === 'production') {
      console.error(`[DB] MongoDB connection error: ${error.message}`);
      throw error;
    }
    console.warn(`[DB] MongoDB unavailable — server starting without database (${error.message})`);
    return null;
  }
};

module.exports = connectDB;
