const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../../../src/models/userModel');

// MongoMemoryServer startup can exceed Jest's default 5s timeout on CI runners.
jest.setTimeout(30000);

describe('User Model Security', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    await User.deleteMany({});
  });

  it("hashes the password in the pre('save') hook", async () => {
    const hashSpy = jest.spyOn(bcrypt, 'hash');

    const user = new User({
      email: 'hash@test.com',
      password: 'password123',
      firstName: 'Hash',
      lastName: 'Tester',
    });

    await user.save();

    expect(hashSpy).toHaveBeenCalled();

    const saved = await User.findOne({ email: 'hash@test.com' }).select('+password');

    expect(saved).toBeTruthy();
    expect(saved.password).not.toBe('password123');
  });

  it('matchPassword compares plain text to hashed password correctly', async () => {
    const compareSpy = jest.spyOn(bcrypt, 'compare');

    await User.create({
      email: 'compare@test.com',
      password: 'password123',
      firstName: 'Compare',
      lastName: 'Tester',
    });

    const saved = await User.findOne({ email: 'compare@test.com' }).select('+password');

    const isMatch = await saved.matchPassword('password123');
    expect(isMatch).toBe(true);

    expect(compareSpy).toHaveBeenCalledWith('password123', saved.password);
  });
});
