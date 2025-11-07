const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Links to the Product model
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [itemSchema], // An array of cart items
    
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model('Cart', cartSchema);