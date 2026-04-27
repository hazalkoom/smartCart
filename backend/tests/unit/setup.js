const mockRedisInstance = {
  get: jest.fn(),
  set: jest.fn(),
  incrby: jest.fn(),
  decrby: jest.fn(),
  quit: jest.fn(),
  on: jest.fn(),
};

jest.mock('ioredis', () => {
  const Redis = jest.fn(() => mockRedisInstance);
  Redis.__instance = mockRedisInstance;
  return Redis;
});

const mockQueueInstance = {
  add: jest.fn(),
};

const mockQueueCtor = jest.fn(() => mockQueueInstance);

const mockWorkerInstances = [];
const mockWorkerCtor = jest.fn((queueName, processor, options) => {
  const worker = {
    queueName,
    processor,
    options,
    on: jest.fn(),
  };
  mockWorkerInstances.push(worker);
  return worker;
});

jest.mock('bullmq', () => ({
  Queue: mockQueueCtor,
  Worker: mockWorkerCtor,
  __mockQueueInstance: mockQueueInstance,
  __mockWorkerInstances: mockWorkerInstances,
}));

const mockSocketEmit = jest.fn();
const mockSocketTo = jest.fn(() => ({ emit: mockSocketEmit }));
const mockIO = {
  to: mockSocketTo,
};

jest.mock('../../src/utils/socket', () => ({
  init: jest.fn(() => mockIO),
  getIO: jest.fn(() => mockIO),
  __mockIO: mockIO,
  __mockSocketTo: mockSocketTo,
  __mockSocketEmit: mockSocketEmit,
}));

beforeEach(() => {
  mockQueueCtor.mockImplementation(() => mockQueueInstance);
  mockWorkerCtor.mockImplementation((queueName, processor, options) => {
    const worker = {
      queueName,
      processor,
      options,
      on: jest.fn(),
    };
    mockWorkerInstances.push(worker);
    return worker;
  });

  mockRedisInstance.get.mockResolvedValue('0');
  mockRedisInstance.set.mockResolvedValue('OK');
  mockRedisInstance.incrby.mockResolvedValue(0);
  mockRedisInstance.decrby.mockResolvedValue(0);
  mockRedisInstance.quit.mockResolvedValue('OK');
  mockQueueInstance.add.mockResolvedValue({ id: 'job-1' });

  mockSocketTo.mockImplementation(() => ({ emit: mockSocketEmit }));
  const socketModule = require('../../src/utils/socket');
  socketModule.init.mockReturnValue(mockIO);
  socketModule.getIO.mockReturnValue(mockIO);

  mockSocketTo.mockClear();
  mockSocketEmit.mockClear();
});
