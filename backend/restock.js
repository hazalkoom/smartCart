// restock.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const restock = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔌 Connected to DB...");

    // This updates EVERY product to have 50,000 items
    // If your collection name is 'products' (plural)
    const result = await mongoose.connection.collection('products').updateMany(
      {}, 
      { $set: { quantity: 50000, stock: 50000 } } // Setting both common names just in case
    );

    console.log(`✅ Restocked ${result.modifiedCount} products with 50,000 items each.`);
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

restock();