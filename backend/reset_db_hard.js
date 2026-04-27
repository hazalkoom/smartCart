const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 1. Force load .env from the SAME directory as this script
const envPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.log(`⚠️  Warning: Could not load .env from ${envPath}`);
  console.log('   Trying parent directory...');
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

// 2. Import Models (Using __dirname to be safe)
const User = require(path.join(__dirname, 'src/models/userModel'));
const Product = require(path.join(__dirname, 'src/models/productModel'));
const Category = require(path.join(__dirname, 'src/models/categoryModel'));
const Order = require(path.join(__dirname, 'src/models/orderModel'));
const Cart = require(path.join(__dirname, 'src/models/cartModel'));
const Review = require(path.join(__dirname, 'src/models/reviewModel'));

// 3. Robust Variable Check
const DB_URI = process.env.MONGODB_URI || process.env.DB_URI || process.env.MONGO_URI;

if (!DB_URI) {
  console.error('\n❌ CRITICAL ERROR: Database connection string is MISSING.');
  console.error('---------------------------------------------------------');
  console.error('1. Check your .env file.');
  console.error('2. Ensure you have a variable named MONGODB_URI, DB_URI or MONGO_URI.');
  console.error('3. Debug: Loaded keys start with:', Object.keys(process.env).slice(0, 5));
  console.error('---------------------------------------------------------\n');
  process.exit(1);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(DB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();

    console.log('💥 Nuking Database...');
    await Order.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();
    await Cart.deleteMany();
    await Review.deleteMany();
    console.log('✅ Database Empty.');

    console.log('🌱 Seeding Owner...');
    await User.create({
      firstName: 'Owner',
      lastName: 'User',
      email: 'owner@test.com',
      password: 'password123',
      role: 'owner',
      mobileNumber: '01000000000' // Required for wallet tests
    });

    console.log('👑 Owner Created: owner@test.com');
    console.log('✨ Ready for Tests!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

destroyData();