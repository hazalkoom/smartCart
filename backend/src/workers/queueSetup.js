const { Queue } = require('bullmq');
const redisClient = require('../utils/redisClient');

// We create a specific queue just for handling cart expirations
// We pass it our existing Redis connection so it doesn't create a new one and leak memory
const cartQueue = new Queue('cart-expiration', {
  connection: redisClient,
});

console.log('⏳ [BULLMQ] Cart Expiration Queue initialized');

module.exports = { cartQueue };