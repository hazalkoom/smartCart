const { Worker } = require('bullmq');
const redisClient = require('../utils/redisClient');
const emailService = require('../services/emailService');

const emailWorker = new Worker('email-queue', async (job) => {
  const { type, email, token, resetUrl } = job.data;

  console.log(`✉️ [EMAIL WORKER] Processing job ${job.id} -> ${type} for ${email}`);

  if (type === 'verification') {
    await emailService.sendVerificationEmail(email, token);
  } else if (type === 'reset-password') {
    await emailService.sendPasswordResetEmail(email, resetUrl);
  } else {
    throw new Error(`Unknown job type: ${type}`);
  }
}, { 
  connection: redisClient , 
  skipStalledCheck: true, // MUST HAVE
  drainDelay: 300
});

emailWorker.on('completed', (job) => {
  console.log(`✅ [EMAIL WORKER] Job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`❌ [EMAIL WORKER] Job ${job.id} FAILED:`, err.message);
});

module.exports = emailWorker;