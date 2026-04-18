const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer = null;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }

    console.warn(`MongoDB primary connection failed (${error.message}). Falling back to in-memory MongoDB for local development/testing.`);

    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();
    const conn = await mongoose.connect(memoryUri, {
      serverSelectionTimeoutMS: 5000,
    });
    process.env.MONGODB_URI = memoryUri;
    console.log(`MongoDB Connected (memory): ${conn.connection.host}`);
  }
};

module.exports = connectDB;