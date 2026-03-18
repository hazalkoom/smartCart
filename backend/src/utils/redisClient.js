const Redis = require('ioredis');

// Initialize a single, shared Redis connection
const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null, // This MUST be null for BullMQ to work
});

redisClient.on('connect', () => {
  console.log('📦 [REDIS] Connected to Redis successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ [REDIS ERROR] Could not connect to Redis:', err.message);
});

module.exports = redisClient;