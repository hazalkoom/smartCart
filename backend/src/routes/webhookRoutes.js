const express = require('express');
const router = express.Router();
const { handlePaymobWebhook } = require('../controllers/webhookController');

// This route must be PUBLIC (No auth middleware)
// Paymob servers do not have a JWT token to send us.
// We rely on HMAC signature for security.
router.post('/paymob', handlePaymobWebhook);

module.exports = router;