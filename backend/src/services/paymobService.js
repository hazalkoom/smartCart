const paymobClient = require('../utils/paymobClient');
const Order = require('../models/orderModel');
const cleanLog = (val) => (val ? String(val).replace(/\n|\r/g, "") : "");

class PaymobService {
  constructor() {
    this._cachedToken = null;
    this._tokenExpiration = null;
  }

  async _getAuthToken() {
    try {
      const now = Date.now();

      if (this._cachedToken && this._tokenExpiration && now < this._tokenExpiration - 5 * 60 * 1000) {
        return this._cachedToken;
      }

      const response = await paymobClient.post('/auth/tokens', {
        api_key: process.env.PAYMOB_API_KEY,
      });

      this._cachedToken = response.data.token;
      this._tokenExpiration = now + 3600 * 1000;

      return this._cachedToken;
    } catch (error) {
      console.error('Paymob Auth Error:', cleanLog(JSON.stringify(error.response?.data || error.message)));
      throw new Error('Payment service unavailable: Authentication failed');
    }
  }

  async _registerOrder(authToken, order) {
    try {
      const amountCents = Math.round(order.total * 100).toString();
      const merchantOrderId = `${order._id.toString()}_${Date.now()}`;

      const response = await paymobClient.post('/ecommerce/orders', {
        auth_token: authToken,
        delivery_needed: "false",
        amount_cents: amountCents,
        currency: "EGP",
        merchant_order_id: merchantOrderId,
        items: order.items.map(item => ({
            name: item.name,
            amount_cents: Math.round(item.price * 100).toString(),
            description: item.name,
            quantity: item.quantity.toString()
        })),
      });

      return response.data.id;
    } catch (error) {
      console.error('Paymob Order Registration Error:', cleanLog(JSON.stringify(error.response?.data || error.message)));
      throw new Error('Payment service unavailable: Order registration failed');
    }
  }

  async _getPaymentKey(authToken, paymobOrderId, amountCents, integrationId, billingData) {
    try {
      const sanitizedBilling = {
        email: billingData.email,
        first_name: billingData.first_name || "NA",
        last_name: billingData.last_name || "NA",
        phone_number: billingData.phone_number,
        street: billingData.street || "NA",
        building: billingData.building || "NA",
        floor: billingData.floor || "NA",
        apartment: billingData.apartment || "NA",
        city: billingData.city || "NA",
        state: billingData.state || "NA",
        country: billingData.country || "EG",
        postal_code: billingData.postal_code || "NA",
      };

      const response = await paymobClient.post('/acceptance/payment_keys', {
        auth_token: authToken,
        amount_cents: amountCents.toString(),
        expiration: 3600, 
        order_id: paymobOrderId,
        billing_data: sanitizedBilling,
        integration_id: integrationId,
        currency: "EGP",
        lock_order_when_paid: "false"
      });

      return response.data.token;
    } catch (error) {
      console.error('Paymob Payment Key Error:', cleanLog(JSON.stringify(error.response?.data || error.message)));
      throw new Error('Payment service unavailable: Key request failed');
    }
  }

  async initiatePayment(user, order, paymentMethod) {
    try {
      // 1. Get Auth Token
      const authToken = await this._getAuthToken();

      // 2. Register Order
      const paymobOrderId = await this._registerOrder(authToken, order);
      
      const amountCents = Math.round(order.total * 100);

      if (paymentMethod === 'wallet' && !user.mobileNumber) {
            throw new Error('Please save your mobile number to your profile to use Mobile Wallets.');
        }

      // 3. Select Integration ID based on method
      let integrationId;
      switch (paymentMethod) {
        case 'card':
          integrationId = process.env.PAYMOB_INTEGRATION_ID_CARD;
          break;
        case 'wallet':
          integrationId = process.env.PAYMOB_INTEGRATION_ID_WALLET;
          break;
        case 'fawry':
          integrationId = process.env.PAYMOB_INTEGRATION_ID_FAWRY;
          break;
        default:
          throw new Error(`Invalid payment method: ${paymentMethod}`);
      }

      if (!integrationId) {
        throw new Error(`Integration ID missing for method: ${paymentMethod}`);
      }

      // 4. Prepare Billing Data
      const billingData = {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        phone_number: user.mobileNumber || "01000000000", 
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        country: order.shippingAddress.country,
        state: order.shippingAddress.state,
        postal_code: order.shippingAddress.zip
      };

      // 5. Get Payment Key
      const paymentKey = await this._getPaymentKey(authToken, paymobOrderId, amountCents, integrationId, billingData);

      // 6. Generate Response based on Method
      if (paymentMethod === 'card') {
        return {
          action: 'iframe',
          url: `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`
        };
      } 
      
      else if (paymentMethod === 'wallet') {
        const walletRes = await paymobClient.post('/acceptance/payments/pay', {
          source: { 
            identifier: billingData.phone_number, 
            subtype: "WALLET" 
          },
          payment_token: paymentKey
        });

        return {
          action: 'redirect',
          url: walletRes.data.redirect_url 
        };
      } 
      
      else if (paymentMethod === 'fawry') {
        const fawryRes = await paymobClient.post('/acceptance/payments/pay', {
          source: { 
            identifier: "AGGREGATOR", 
            subtype: "AGGREGATOR" 
          },
          payment_token: paymentKey
        });

        return {
          action: 'fawry_code',
          bill_reference: fawryRes.data.data.bill_reference, 
          message: 'Go to any Fawry machine and pay using this code.'
        };
      }

    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PaymobService();