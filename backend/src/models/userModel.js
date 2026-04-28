const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require("validator");
const { COUNTRY_NAMES } = require('../constants/countries');

const addressSchema = new mongoose.Schema({
  alias: {
    type: String,
    required: [true, 'Alias (e.g., Home, Work) is required'],
  },
  street: {
    type: String,
    required: [true, 'Street is required'],
  },
  city: {
    type: String,
    required: [true, 'City is required'],
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    enum: COUNTRY_NAMES,
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});


const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email address']
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, 
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'owner'],
      default: 'customer',
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
    },
    mobileNumber: {
      type: String,
      required: [false, 'Mobile number is required for Wallet payments'], 
    },
    addresses: [addressSchema],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
  },
    
  
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);