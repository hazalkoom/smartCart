jest.mock('../../src/utils/paymobClient', () => ({
  post: jest.fn(),
  interceptors: {
    response: {
      use: jest.fn(),
    },
  },
}));

const paymobClient = require('../../src/utils/paymobClient');

const paymobService = require('../../src/services/paymobService');

describe('PaymobService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    // reset internal cache between tests
    paymobService._cachedToken = null;
    paymobService._tokenExpiration = null;

    process.env.PAYMOB_API_KEY = 'api-key';
    process.env.PAYMOB_IFRAME_ID = '123';
    process.env.PAYMOB_INTEGRATION_ID_CARD = 'card-int';
    process.env.PAYMOB_INTEGRATION_ID_WALLET = 'wallet-int';
    process.env.PAYMOB_INTEGRATION_ID_FAWRY = 'fawry-int';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('Integration: calls Paymob endpoints in order (Auth -> Order -> Key) and rounds cents correctly', async () => {
    paymobClient.post
      .mockResolvedValueOnce({ data: { token: 'auth-token' } })
      .mockResolvedValueOnce({ data: { id: 999 } })
      .mockResolvedValueOnce({ data: { token: 'payment-key' } });

    const user = {
      email: 'payer@test.com',
      firstName: 'Pay',
      lastName: 'Er',
      mobileNumber: '01000000000',
    };

    const order = {
      _id: 'order-1',
      total: 10.5,
      items: [{ name: 'Item', price: 10.5, quantity: 1 }],
      shippingAddress: { street: 'S', city: 'C', country: 'EG', state: null, zip: null },
    };

    const result = await paymobService.initiatePayment(user, order, 'card');

    expect(paymobClient.post).toHaveBeenNthCalledWith(1, '/auth/tokens', {
      api_key: 'api-key',
    });

    const registerPayload = paymobClient.post.mock.calls[1][1];
    expect(paymobClient.post).toHaveBeenNthCalledWith(
      2,
      '/ecommerce/orders',
      expect.objectContaining({
        auth_token: 'auth-token',
        amount_cents: '1050',
        merchant_order_id: 'order-1',
      })
    );

    expect(registerPayload.amount_cents).toBe('1050');

    expect(paymobClient.post).toHaveBeenNthCalledWith(
      3,
      '/acceptance/payment_keys',
      expect.objectContaining({
        auth_token: 'auth-token',
        order_id: 999,
        amount_cents: '1050',
        integration_id: 'card-int',
      })
    );

    expect(result.action).toBe('iframe');
    expect(result.url).toContain('payment_token=payment-key');
  });

  it('Validation: throws if integration_id is missing in env', async () => {
    process.env.PAYMOB_INTEGRATION_ID_CARD = '';

    paymobClient.post
      .mockResolvedValueOnce({ data: { token: 'auth-token' } })
      .mockResolvedValueOnce({ data: { id: 999 } });

    const user = { email: 'a@b.com', firstName: 'A', lastName: 'B', mobileNumber: '01000000000' };
    const order = {
      _id: 'order-1',
      total: 10,
      items: [{ name: 'Item', price: 10, quantity: 1 }],
      shippingAddress: { street: 'S', city: 'C', country: 'EG' },
    };

    await expect(paymobService.initiatePayment(user, order, 'card')).rejects.toThrow(
      'Integration ID missing for method: card'
    );
  });

  it('Sanitization: replaces null/undefined billing fields with "NA" before sending to Paymob', async () => {
    paymobClient.post
      .mockResolvedValueOnce({ data: { token: 'auth-token' } })
      .mockResolvedValueOnce({ data: { id: 999 } })
      .mockResolvedValueOnce({ data: { token: 'payment-key' } });

    const user = {
      email: 'payer@test.com',
      firstName: null,
      lastName: undefined,
      mobileNumber: '01000000000',
    };

    const order = {
      _id: 'order-1',
      total: 10,
      items: [{ name: 'Item', price: 10, quantity: 1 }],
      shippingAddress: { street: null, city: undefined, country: null, state: null, zip: null },
    };

    await paymobService.initiatePayment(user, order, 'card');

    const paymentKeysPayload = paymobClient.post.mock.calls[2][1];
    expect(paymentKeysPayload).toHaveProperty('billing_data');

    const billing = paymentKeysPayload.billing_data;

    expect(billing.first_name).toBe('NA');
    expect(billing.last_name).toBe('NA');
    expect(billing.street).toBe('NA');
    expect(billing.city).toBe('NA');
    // service defaults country to EG when falsy
    expect(billing.country).toBe('EG');
    expect(billing.state).toBe('NA');
    expect(billing.postal_code).toBe('NA');
  });
});
