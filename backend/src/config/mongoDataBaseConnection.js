const mongoose = require('mongoose');
const logger = require('../utils/logger');

let MongoMemoryServer = null;

const getMongoMemoryServer = () => {
  if (MongoMemoryServer) {
    return MongoMemoryServer;
  }

  try {
    ({ MongoMemoryServer } = require('mongodb-memory-server'));
    return MongoMemoryServer;
  } catch (error) {
    throw new Error(
      'mongodb-memory-server is required for local fallback when MONGODB_URI is unavailable. Install dev dependencies or provide a reachable MONGODB_URI.'
    );
  }
};

let memoryServer = null;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('MongoDB Connected: ' + conn.connection.host);
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('MongoDB connection failed in production: ' + error.message);
      process.exit(1);
    }

    logger.warn('MongoDB primary connection failed (' + error.message + '). Falling back to in-memory MongoDB for local development/testing.');

    const InMemoryMongoServer = getMongoMemoryServer();

    memoryServer = await InMemoryMongoServer.create();
    const memoryUri = memoryServer.getUri();
    const conn = await mongoose.connect(memoryUri, {
      serverSelectionTimeoutMS: 5000,
    });
    process.env.MONGODB_URI = memoryUri;
    logger.info('MongoDB Connected (memory): ' + conn.connection.host);
  }
};

module.exports = connectDB;