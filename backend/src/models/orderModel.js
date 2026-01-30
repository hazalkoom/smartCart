const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  // --- NEW: Historic Cost Price (For Owner Analytics) ---
  // Captures the cost at the moment of purchase.
  cost: {
    type: Number,
    required: true,
    default: 0,
  },
  // ------------------------------------------------------
  image: {
    type: String,
  },
});

const shippingAddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  zip: { type: String },
  country: { type: String, required: true },
});


const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    // --- Financials ---
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    shipping: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    // --- Status & Payment ---
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    // Track which method they used
    paymentMethod: {
      type: String,
      required: true,
      enum: ['card', 'wallet', 'fawry', 'cash'], 
    },
    // Store full details from Paymob (ID, source, etc.)
    paymentResult: {
      type: Object
    },
    // Explicit boolean for easier logic checks
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);