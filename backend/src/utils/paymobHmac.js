const crypto = require('crypto');

const validateHmac = (data, hmacSent, secret) => {
  // The exact keys required by Paymob, strictly sorted lexicographically
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
      // Handle nested source_data keys
      if (key.startsWith('source_data.')) {
        const subKey = key.split('.')[1];
        value = data.source_data ? data.source_data[subKey] : '';
      } else {
        value = data[key];
      }

      // Sanitize: Treat null/undefined as empty string, convert others to string
      if (value === null || value === undefined) return '';
      
      // Convert booleans (true -> "true") and numbers to string
      return value.toString();
    })
    .join('');

  // Create SHA512 Hash
  const calculatedHmac = crypto
    .createHmac('sha512', secret)
    .update(concatenatedString)
    .digest('hex');

  // Compare
  return calculatedHmac === hmacSent;
};

module.exports = { validateHmac };