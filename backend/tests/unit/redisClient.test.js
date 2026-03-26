describe('redisClient configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses REDIS_URL when provided (Upstash)', () => {
    process.env.REDIS_URL = 'redis://upstash-user:password@upstash.redis.io:6380';

    jest.isolateModules(() => {
      const Redis = require('ioredis');
      const redisClient = require('../../src/utils/redisClient');

      expect(Redis).toHaveBeenCalledWith(
        'redis://upstash-user:password@upstash.redis.io:6380',
        expect.objectContaining({
          maxRetriesPerRequest: null,
        })
      );
      expect(redisClient).toBeDefined();
      expect(redisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(redisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  it('falls back to localhost default when REDIS_URL is missing', () => {
    delete process.env.REDIS_URL;

    jest.isolateModules(() => {
      const Redis = require('ioredis');
      require('../../src/utils/redisClient');

      expect(Redis).toHaveBeenCalledWith(
        'redis://127.0.0.1:6379',
        expect.objectContaining({
          maxRetriesPerRequest: null,
        })
      );
    });
  });
});
