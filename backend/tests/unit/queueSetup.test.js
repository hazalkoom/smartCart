describe('queueSetup', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('initializes cart-expiration queue with shared redis connection', () => {
    jest.isolateModules(() => {
      const bullmq = require('bullmq');
      const redisClient = require('../../src/utils/redisClient');
      const { cartQueue, emailQueue } = require('../../src/workers/queueSetup');

      expect(bullmq.Queue).toHaveBeenCalledWith('cart-expiration', {
        connection: redisClient,
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
        }
      });
      expect(bullmq.Queue).toHaveBeenCalledWith('email-queue', {
        connection: redisClient,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
        }
      });
      expect(cartQueue).toBeDefined();
      expect(typeof cartQueue.add).toBe('function');
      expect(emailQueue).toBeDefined();
      expect(typeof emailQueue.add).toBe('function');
    });
  });
});
