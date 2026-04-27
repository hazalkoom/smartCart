const crypto = require('crypto');

const validateHmac = (data, hmacSent, secret) => {
  // STRICTLY 20 KEYS. EXACTLY AS WRITTEN. Do not add orderId.
  const keys = [
    'amount_cents',
    'created_at',
    'currency',
    'error_occured',
    'has_parent_transaction',
    'id',
    'integration_id',
    'is_3d_secure',
    'is_auth',
    'is_capture',
    'is_refunded',
    'is_standalone_payment',
    'is_voided',
    'order',
    'owner',
    'pending',
    'source_data.pan',
    'source_data.sub_type',
    'source_data.type',
    'success',
  ];

  const concatenatedString = keys
    .map((key) => {
      let value;
      
      if (key === 'order') {
        value = typeof data.order === 'object' ? data.order.id : data.order;
      } else if (key.startsWith('source_data.')) {
        const subKey = key.split('.')[1];
        value = data.source_data ? data.source_data[subKey] : '';
      } else {
        value = data[key];
      }

      if (value === null || value === undefined) return '';
      
      return value.toString();
    })
    .join('');

  const calculatedHmac = crypto
    .createHmac('sha512', secret)
    .update(concatenatedString)
    .digest('hex');

  return calculatedHmac === hmacSent;
};

module.exports = { validateHmac };