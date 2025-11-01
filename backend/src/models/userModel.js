const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: [true, 'Street is required'],
  },
  city: {
    type: String,
    required: [true, 'City is required'],
  },
  state: {
    type: String, 
  },
  zip: {
    type: String,
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
  },
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Prevents password from being sent in queries
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
    phone: {
      type: String,
    },
    addresses: [addressSchema],
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10); // A salt is a random string of data. bcrypt generates this random string and adds it to your plain-text password before it gets hashed.
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);