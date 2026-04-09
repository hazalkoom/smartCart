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

console.log('⏳ [BULLMQ] Cart Expiration Queue initialized');

module.exports = { cartQueue };