const Redis = require('ioredis');

// If REDIS_URL exists (Production), use it. Otherwise, fallback to local docker (Development)
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

redisClient.on('connect', () => {
  console.log('📦 [REDIS] Connected to Redis successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ [REDIS ERROR] Could not connect to Redis:', err.message);
});

module.exports = redisClient;