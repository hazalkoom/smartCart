const paymobClient = require('../utils/paymobClient');
const Order = require('../models/orderModel');

class PaymobService {
  constructor() {
    // Cache for the authentication token
    this._cachedToken = null;
    this._tokenExpiration = null;
  }

  async _getAuthToken() {
    try {
      const now = Date.now();

      // Check if we have a valid cached token (buffer of 5 minutes before actual expiry)
      if (this._cachedToken && this._tokenExpiration && now < this._tokenExpiration - 5 * 60 * 1000) {
        return this._cachedToken;
      }

      // Request new token
      const response = await paymobClient.post('/auth/tokens', {
        api_key: process.env.PAYMOB_API_KEY,
      });

      this._cachedToken = response.data.token;
      // Paymob tokens last 1 hour (3600 seconds). We set expiry to 1 hour from now.
      this._tokenExpiration = now + 3600 * 1000;

      return this._cachedToken;
    } catch (error) {
      console.error('Paymob Auth Error:', error.response?.data || error.message);
      throw new Error('Payment service unavailable: Authentication failed');
    }
  }

  async _registerOrder(authToken, merchantOrderId, amountCents) {
    try {
      const response = await paymobClient.post('/ecommerce/orders', {
        auth_token: authToken,
        delivery_needed: "false",
        amount_cents: amountCents.toString(), // Paymob expects string for cents
        currency: "EGP",
        merchant_order_id: merchantOrderId.toString(),
        items: order.items.map(item => ({
            name: item.name,
            amount_cents: Math.round(item.price * 100).toString(),
            description: item.name,
            quantity: item.quantity.toString()
        })),
      });

      return response.data.id;
    } catch (error) {
      console.error('Paymob Order Registration Error:', error.response?.data || error.message);
      throw new Error('Payment service unavailable: Order registration failed');
    }
  }

  async _getPaymentKey(authToken, paymobOrderId, amountCents, integrationId, billingData) {
    try {
      // Data Sanitization: Paymob rejects requests if specific fields are missing or empty strings.
      // We default strictly required address fields to "NA" if they are missing in our DB.
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
        expiration: 3600, // Payment key valid for 1 hour
        order_id: paymobOrderId,
        billing_data: sanitizedBilling,
        integration_id: integrationId,
        currency: "EGP",
        lock_order_when_paid: "false"
      });

      return response.data.token;
    } catch (error) {
      console.error('Paymob Payment Key Error:', error.response?.data || error.message);
      throw new Error('Payment service unavailable: Key request failed');
    }
  }

  async initiatePayment(user, order, paymentMethod) {
    try {
      // 1. Get Auth Token
      const authToken = await this._getAuthToken();

      // 2. Calculate Amount in Cents (Security: Always use backend data)
      const amountCents = Math.round(order.total * 100);

      // 3. Register Order on Paymob
      const paymobOrderId = await this._registerOrder(authToken, order._id, amountCents);


      if (paymentMethod === 'wallet' && !user.mobileNumber) {
            throw new Error('Please save your mobile number to your profile to use Mobile Wallets.');
        }
      // 4. Select Integration ID based on method
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

      // 5. Prepare Billing Data
      const billingData = {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        // Use user.mobileNumber, fallback to a dummy number for testing if missing
        phone_number: user.mobileNumber || "01000000000", 
        // Map shipping address
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        country: order.shippingAddress.country,
        state: order.shippingAddress.state,
        postal_code: order.shippingAddress.zip
      };

      // 6. Get Payment Key
      const paymentKey = await this._getPaymentKey(authToken, paymobOrderId, amountCents, integrationId, billingData);

      // 7. Generate Response based on Method
      if (paymentMethod === 'card') {
        return {
          action: 'iframe',
          url: `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`
        };
      } 
      
      else if (paymentMethod === 'wallet') {
        // Wallet requires an extra step: "Pay" request to get the redirect URL
        const walletRes = await paymobClient.post('/acceptance/payments/pay', {
          source: { 
            identifier: billingData.phone_number, 
            subtype: "WALLET" 
          },
          payment_token: paymentKey
        });

        return {
          action: 'redirect',
          url: walletRes.data.redirect_url // Redirect user to this URL (e.g., Vodafone Cash page)
        };
      } 
      
      else if (paymentMethod === 'fawry') {
        // Fawry requires an extra step: "Pay" request to get the Ref Code
        const fawryRes = await paymobClient.post('/acceptance/payments/pay', {
          source: { 
            identifier: "AGGREGATOR", 
            subtype: "AGGREGATOR" 
          },
          payment_token: paymentKey
        });

        return {
          action: 'fawry_code',
          bill_reference: fawryRes.data.data.bill_reference, // The number to show on screen
          message: 'Go to any Fawry machine and pay using this code.'
        };
      }

    } catch (error) {
      // Pass the specific error message up
      throw error;
    }
  }
}

module.exports = new PaymobService();