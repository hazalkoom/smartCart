const express = require('express');
const {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  toggleWishlist,
  getWishlist,
  addAddress,
  deleteAddress,
  verifyEmail,       // ---> IMPORT THE NEW CONTROLLER <---
  resendVerification
} = require('../controllers/authController');

const { protect, requireEmailVerification } = require('../middleware/authMiddleware');
const { validate, addressValidationRules } = require('../middleware/validationMiddleware');

const router = express.Router();






router.post('/register', registerUser);


router.post('/login', loginUser);


router.post('/forgot-password', forgotPassword);


router.post('/reset-password/:token', resetPassword);


router.get('/me', protect, getMe);


router.put('/updatedetails', protect, requireEmailVerification, updateDetails);

// Wishlist Routes
router.post('/wishlist', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);

// Address Routes
router.post('/addresses', protect, requireEmailVerification, addressValidationRules, validate, addAddress);
router.delete('/addresses/:id', protect, requireEmailVerification, deleteAddress);

// ---> NEW: Email Verification Routes <---
router.post('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerification);

module.exports = router;

// =========================================================================
//  SWAGGER DOCUMENTATION
// =========================================================================

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, admin]
 *     RegisterInput:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         firstName:
 *           type: string
 *           example: Mohamed
 *         lastName:
 *           type: string
 *           example: Ahmed
 *         email:
 *           type: string
 *           format: email
 *           example: mohamed@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: password123
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: mohamed@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: password123
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     WishlistToggleInput:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         productId:
 *           type: string
 *           description: Product ID to add/remove from wishlist
 *           example: 66a1234567890abc12345678
 *     AddressInput:
 *       type: object
 *       required:
 *         - alias
 *         - street
 *         - city
 *         - postalCode
 *         - country
 *       properties:
 *         alias:
 *           type: string
 *           example: Home
 *         street:
 *           type: string
 *           example: 123 Main St
 *         city:
 *           type: string
 *           example: Cairo
 *         postalCode:
 *           type: string
 *           example: 11511
 *         country:
 *           type: string
 *           example: Egypt
 *         isDefault:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and User Management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input or Email already exists
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user & get token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The reset token received via email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid token
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /auth/updatedetails:
 *   put:
 *     summary: Update user details (Name, Email)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /auth/wishlist:
 *   post:
 *     summary: Toggle a product in the authenticated user's wishlist
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WishlistToggleInput'
 *     responses:
 *       200:
 *         description: Wishlist updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: productId is missing
 *       401:
 *         description: Not authorized
 *   get:
 *     summary: Get authenticated user's wishlist
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /auth/addresses:
 *   post:
 *     summary: Add a new shipping address for the authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       201:
 *         description: Address added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AddressInput'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /auth/addresses/{id}:
 *   delete:
 *     summary: Delete one saved address for the authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AddressInput'
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   post:
 *     summary: Verify User Email
 *     description: Verifies a user's email using the JWT token sent to their inbox.
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The JWT verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Email verified successfully. You now have full access.
 *       400:
 *         description: Invalid or expired token
 */

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend Verification Email
 *     description: Generates a new verification token and queues a new email to the logged-in user.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email resent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Verification email resent. Please check your inbox.
 *       401:
 *         description: Not authorized (Must be logged in)
 *       400:
 *         description: Email is already verified
 */