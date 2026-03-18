describe('redisClient configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses docker-friendly env host/port when provided', () => {
    process.env.REDIS_HOST = 'redis-service';
    process.env.REDIS_PORT = '6380';

    jest.isolateModules(() => {
      const Redis = require('ioredis');
      const redisClient = require('../../src/utils/redisClient');

      expect(Redis).toHaveBeenCalledWith({
        host: 'redis-service',
        port: '6380',
        maxRetriesPerRequest: null,
      });
      expect(redisClient).toBeDefined();
      expect(redisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(redisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  it('falls back to localhost defaults when env vars are missing', () => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;

    jest.isolateModules(() => {
      const Redis = require('ioredis');
      require('../../src/utils/redisClient');

      expect(Redis).toHaveBeenCalledWith({
        host: '127.0.0.1',
        port: 6379,
        maxRetriesPerRequest: null,
      });
    });
  });
});
