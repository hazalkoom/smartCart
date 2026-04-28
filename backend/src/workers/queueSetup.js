const { Queue } = require('bullmq');
const redisClient = require('../utils/redisClient');

const cartQueue = new Queue('cart-expiration', {
  connection: redisClient,
  // --- UPSTASH QUOTA SAVERS ---
  defaultJobOptions: {
    removeOnComplete: true, 
    removeOnFail: true,     
  }
});

const emailQueue = new Queue('email-queue', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3, 
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true, 
  }
});

console.log('⏳ [BULLMQ] Cart Expiration Queue initialized');

module.exports = { cartQueue };