const createChainableQuery = () => {
  const query = {
    _resolvedValue: undefined,
    _rejectedError: undefined,
  };

  const chainReturnSelf = (fnName) => {
    query[fnName] = jest.fn(() => query);
  };

  [
    'select',
    'sort',
    'skip',
    'limit',
    'populate',
    'where',
    'lean',
    'session',
  ].forEach(chainReturnSelf);

  query.exec = jest.fn(async () => {
    if (query._rejectedError) throw query._rejectedError;
    return query._resolvedValue;
  });

  query.then = (onFulfilled, onRejected) =>
    query.exec().then(onFulfilled, onRejected);

  query.catch = (onRejected) => query.exec().catch(onRejected);

  query.mockResolvedValue = (value) => {
    query._resolvedValue = value;
    query._rejectedError = undefined;
    return query;
  };

  query.mockRejectedValue = (error) => {
    query._rejectedError = error;
    return query;
  };

  return query;
};

const mockMongooseSession = () => {
  const session = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(async () => undefined),
    abortTransaction: jest.fn(async () => undefined),
    endSession: jest.fn(),
  };

  return session;
};

const mockModel = () => {
  const query = createChainableQuery();

  const makeQueryMethod = () => {
    const fn = jest.fn(() => query);

    fn.mockResolvedValue = (value) => {
      query.mockResolvedValue(value);
      return fn;
    };

    fn.mockRejectedValue = (error) => {
      query.mockRejectedValue(error);
      return fn;
    };

    return fn;
  };

  const model = {
    _query: query,

    find: makeQueryMethod(),
    findOne: makeQueryMethod(),
    findById: makeQueryMethod(),
    findByIdAndUpdate: makeQueryMethod(),
    findByIdAndDelete: makeQueryMethod(),
    deleteOne: makeQueryMethod(),
    countDocuments: makeQueryMethod(),
    bulkWrite: makeQueryMethod(),

    create: jest.fn(async (...args) => {
      return model.create._resolvedValue;
    }),
  };

  model.create._resolvedValue = undefined;

  model.create.mockResolvedValue = (value) => {
    model.create._resolvedValue = value;
    return model.create;
  };

  model.create.mockRejectedValue = (err) => {
    model.create.mockImplementationOnce(async () => {
      throw err;
    });
    return model.create;
  };

  model.resetQuery = () => {
    query._resolvedValue = undefined;
    query._rejectedError = undefined;
  };

  return model;
};

const mockMongoose = () => {
  const session = mockMongooseSession();
  return {
    startSession: jest.fn(async () => session),
    __session: session,
  };
};

module.exports = {
  mockModel,
  mockMongoose,
  mockMongooseSession,
};
