describe('queueSetup', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('initializes cart-expiration queue with shared redis connection', () => {
    jest.isolateModules(() => {
      const bullmq = require('bullmq');
      const redisClient = require('../../src/utils/redisClient');
      const { cartQueue } = require('../../src/workers/queueSetup');

      expect(bullmq.Queue).toHaveBeenCalledWith('cart-expiration', {
        connection: redisClient,
        defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      }
      });
      expect(cartQueue).toBeDefined();
      expect(typeof cartQueue.add).toBe('function');
    });
  });
});
