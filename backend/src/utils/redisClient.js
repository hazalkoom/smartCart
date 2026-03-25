const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  family: 4 // 🚀 FIX: Force IPv4 for AWS EC2
});

redisClient.on('connect', () => {
  console.log('📦 [REDIS] Connected to Redis successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ [REDIS ERROR] Could not connect to Redis:', err.message);
});

module.exports = redisClient;