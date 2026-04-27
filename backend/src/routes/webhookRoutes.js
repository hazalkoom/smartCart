const express = require('express');
const router = express.Router();
const { handlePaymobWebhook } = require('../controllers/webhookController');

// This route must be PUBLIC (No auth middleware)
// Paymob servers do not have a JWT token to send us.
// We rely on HMAC signature for security.
router.post('/paymob', handlePaymobWebhook);

router.get('/paymob/redirect', (req, res) => {
    const queryString = new URLSearchParams(req.query).toString();
    
    // The code blindly trusts the environment variable. 
    // If you forget to set it, it falls back to localhost just to avoid crashing.
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    
    res.redirect(`${frontendUrl}/payment-callback?${queryString}`);
});

module.exports = router;

// =========================================================================
//  SWAGGER DOCUMENTATION
// =========================================================================

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: External service integrations (Public/Secure)
 */

/**
 * @swagger
 * /webhook/paymob:
 *   post:
 *     summary: Paymob Payment Webhook
 *     description: Receives payment transaction updates from Paymob servers. Validates security via HMAC signature.
 *     tags: [Webhooks]
 *     parameters:
 *       - in: query
 *         name: hmac
 *         schema:
 *           type: string
 *         required: true
 *         description: HMAC signature provided by Paymob for security verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: The full transaction object from Paymob
 *             example:
 *               type: "TRANSACTION"
 *               obj:
 *                 id: 123456
 *                 success: true
 *                 amount_cents: 10000
 *     responses:
 *       200:
 *         description: Webhook received and processed
 *       400:
 *         description: Invalid HMAC signature (Security violation)
 */