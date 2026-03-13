jest.mock('../../src/models/orderModel', () => ({
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock('../../src/utils/paymobHmac', () => ({
  validateHmac: jest.fn(),
}));

const Order = require('../../src/models/orderModel');
const { validateHmac } = require('../../src/utils/paymobHmac');

// The controller wraps the handler in asyncHandler, so we import the raw module
// and call handlePaymobWebhook(req, res, next) to test.
const { handlePaymobWebhook } = require('../../src/controllers/webhookController');

// --- Helpers ---
const makeRes = () => {
  const res = {
    statusCode: 200,
    body: undefined,
    status: jest.fn(function (code) {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn(function (data) {
      res.body = data;
      return res;
    }),
    send: jest.fn(function (data) {
      res.body = data;
      return res;
    }),
  };
  return res;
};

const makeReq = (overrides = {}) => ({
  query: { hmac: 'valid-hmac' },
  body: {
    type: 'TRANSACTION',
    obj: {
      success: true,
      merchant_order_id: 'order-123',
      id: 'txn-1',
      amount_cents: 10000,
      created_at: '2025-01-01',
      currency: 'EGP',
      error_occured: false,
      has_parent_transaction: false,
      integration_id: 123,
      is_3d_secure: true,
      is_auth: false,
      is_capture: false,
      is_refunded: false,
      is_standalone_payment: true,
      is_voided: false,
      order: 456,
      owner: 789,
      pending: false,
      source_data: { pan: '1234', sub_type: 'VISA', type: 'card' },
    },
  },
  ...overrides,
});

const next = jest.fn();

describe('webhookController — handlePaymobWebhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAYMOB_HMAC_SECRET = 'test-secret';
  });

  // --- HMAC Verification ---

  it('returns 400 when request body has no obj', async () => {
    const req = { query: { hmac: 'abc' }, body: { type: 'TRANSACTION' } };
    const res = makeRes();

    await handlePaymobWebhook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Invalid Request Body');
  });

  it('returns 403 when HMAC validation fails', async () => {
    validateHmac.mockReturnValue(false);
    const req = makeReq();
    const res = makeRes();

    await handlePaymobWebhook(req, res, next);

    expect(validateHmac).toHaveBeenCalledWith(
      req.body.obj,
      'valid-hmac',
      'test-secret'
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid HMAC signature' });
  });

  // --- Transaction Failure ---

  it('returns 200 without updating DB when transaction failed (success=false)', async () => {
    validateHmac.mockReturnValue(true);
    const req = makeReq();
    req.body.obj.success = false;
    const res = makeRes();

    await handlePaymobWebhook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(Order.findById).not.toHaveBeenCalled();
  });

  // --- Order Not Found ---

  it('returns 200 when order is not found (stops Paymob retries)', async () => {
    validateHmac.mockReturnValue(true);
    Order.findById.mockResolvedValue(null);
    const req = makeReq();
    const res = makeRes();

    await handlePaymobWebhook(req, res, next);

    expect(Order.findById).toHaveBeenCalledWith('order-123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(Order.findOneAndUpdate).not.toHaveBeenCalled();
  });

  // --- Idempotency ---

  it('returns 200 without updating when order is already paid (idempotency)', async () => {
    validateHmac.mockReturnValue(true);
    Order.findById.mockResolvedValue({ _id: 'order-123', isPaid: true });
    const req = makeReq();
    const res = makeRes();

    await handlePaymobWebhook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(Order.findOneAndUpdate).not.toHaveBeenCalled();
  });

  // --- Happy Path: Order Status Mutation ---

  it('atomically updates order to Paid on valid transaction', async () => {
    validateHmac.mockReturnValue(true);
    Order.findById.mockResolvedValue({ _id: 'order-123', isPaid: false });
    Order.findOneAndUpdate.mockResolvedValue({ _id: 'order-123', isPaid: true });
    const req = makeReq();
    const res = makeRes();

    await handlePaymobWebhook(req, res, next);

    expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'order-123' },
      {
        $set: {
          isPaid: true,
          paidAt: expect.any(Number),
          status: 'Paid',
          paymentResult: req.body.obj,
        },
      },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
