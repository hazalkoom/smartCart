const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Product = require('./src/models/productModel');
const Review = require('./src/models/reviewModel');
const User = require('./src/models/userModel');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const DB_URI = process.env.MONGODB_URI || process.env.DB_URI || process.env.MONGO_URI;

if (!DB_URI) {
  console.error('Missing database URI. Set MONGODB_URI (or DB_URI / MONGO_URI) in backend/.env');
  process.exit(1);
}

const FIRST_NAMES = [
  'Alex', 'Sam', 'Jordan', 'Riley', 'Taylor', 'Morgan', 'Casey', 'Jamie',
  'Avery', 'Reese', 'Parker', 'Drew', 'Blake', 'Cameron', 'Quinn', 'Harper',
];

const LAST_NAMES = [
  'Stone', 'Reed', 'Cole', 'Perry', 'Brooks', 'Hayes', 'Fisher', 'Mason',
  'Turner', 'Frost', 'Ellis', 'Bennett', 'Parker', 'Lane', 'Bailey', 'Scott',
];

const TITLES_BY_RATING = {
  5: ['Excellent value', 'Top tier pick', 'Exceeded expectations', 'Highly recommended'],
  4: ['Very good product', 'Solid choice', 'Great overall', 'Happy with purchase'],
  3: ['Good with caveats', 'Decent option', 'Works as expected', 'Mixed but okay'],
  2: ['Below expectations', 'Needs improvement', 'Not ideal', 'Could be better'],
  1: ['Disappointing experience', 'Would not recommend', 'Poor quality', 'Not worth it'],
};

const COMMENTS_BY_RATING = {
  5: [
    'Build quality is excellent and setup was straightforward. I would buy this again.',
    'Performance is fantastic for the price and it fits my workflow perfectly.',
    'Great packaging, great finish, and works exactly as described.',
    'One of the best purchases I made this year. Reliable and fast.',
  ],
  4: [
    'Very good overall with only minor things I would tweak.',
    'Does what I needed and feels dependable for daily use.',
    'Nice quality and solid performance. Worth considering.',
    'Good product, just not perfect. Still happy with it.',
  ],
  3: [
    'It is acceptable, but there are trade-offs you should know about.',
    'Works okay for light use. Expected a little more for the price.',
    'Not bad, not amazing. Gets the job done.',
    'Average experience so far. Might be better after updates.',
  ],
  2: [
    'Had a few issues during setup and day-to-day use.',
    'Performance is inconsistent and the value feels low.',
    'I expected better quality and polish at this price point.',
    'There are better alternatives in the same range.',
  ],
  1: [
    'Ran into repeated issues and could not rely on it.',
    'Poor experience overall. I would avoid this model.',
    'Did not match the product description in practice.',
    'Not satisfied with quality or performance.',
  ],
};

function parseArgs(argv) {
  const defaults = {
    min: 2,
    max: 6,
    dryRun: false,
    targetUsers: 24,
  };

  const options = { ...defaults };

  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    const [rawKey, rawValue] = arg.split('=');
    const key = rawKey.replace(/^--/, '');
    const value = Number(rawValue);

    if (key === 'min' && Number.isFinite(value)) options.min = Math.max(1, Math.floor(value));
    if (key === 'max' && Number.isFinite(value)) options.max = Math.max(1, Math.floor(value));
    if (key === 'target-users' && Number.isFinite(value)) options.targetUsers = Math.max(6, Math.floor(value));
  }

  if (options.min > options.max) {
    const temp = options.min;
    options.min = options.max;
    options.max = temp;
  }

  return options;
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function deterministicTarget(productName, min, max) {
  const span = max - min + 1;
  return min + (hashString(productName) % span);
}

function weightedRating(productName) {
  const roll = hashString(`${productName}-rating`) % 100;
  if (roll < 4) return 1;
  if (roll < 12) return 2;
  if (roll < 32) return 3;
  if (roll < 70) return 4;
  return 5;
}

function pickFrom(arr, seedText) {
  return arr[hashString(seedText) % arr.length];
}

async function ensureSyntheticCustomers(targetUsers, dryRun) {
  const existingUsers = await User.find({}, '_id email firstName lastName').lean();

  if (existingUsers.length >= targetUsers) {
    return {
      users: existingUsers,
      createdCount: 0,
    };
  }

  const needed = targetUsers - existingUsers.length;
  const toCreate = [];

  for (let i = 0; i < needed; i += 1) {
    const idx = existingUsers.length + i;
    const firstName = FIRST_NAMES[idx % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(idx * 3) % LAST_NAMES.length];
    toCreate.push({
      firstName,
      lastName,
      email: `review.bot.${idx + 1}@seed.local`,
      password: 'password123',
      role: 'customer',
      mobileNumber: `010${String(10000000 + idx).slice(-8)}`,
    });
  }

  if (!dryRun) {
    for (const userData of toCreate) {
      const exists = await User.findOne({ email: userData.email }, '_id').lean();
      if (!exists) {
        await User.create(userData);
      }
    }
  }

  const users = dryRun ? [...existingUsers, ...toCreate.map((u, i) => ({ _id: `dry-${i}`, ...u }))] : await User.find({}, '_id email firstName lastName').lean();

  return {
    users,
    createdCount: dryRun ? toCreate.length : Math.max(0, users.length - existingUsers.length),
  };
}

function buildReviewDoc({ product, userId, seq }) {
  const rating = weightedRating(`${product.name}-${userId}-${seq}`);
  const title = pickFrom(TITLES_BY_RATING[rating], `${product.name}-${userId}-title`);
  const comment = pickFrom(COMMENTS_BY_RATING[rating], `${product.name}-${userId}-comment`);

  return {
    productId: product._id,
    userId,
    rating,
    title,
    comment,
  };
}

function parseInsertedCount(result) {
  if (!result) return 0;

  if (Array.isArray(result)) {
    return result.length;
  }

  if (typeof result.insertedCount === 'number') {
    return result.insertedCount;
  }

  if (result.result && typeof result.result.nInserted === 'number') {
    return result.result.nInserted;
  }

  return 0;
}

async function generateReviews(options) {
  const products = await Product.find({}, '_id name slug').lean();

  if (products.length === 0) {
    console.log('No products found. Seed products first, then run this script.');
    return;
  }

  const { users, createdCount } = await ensureSyntheticCustomers(options.targetUsers, options.dryRun);

  if (users.length < 2) {
    throw new Error('Not enough users available to generate realistic reviews.');
  }

  let createdReviews = 0;
  let skippedProducts = 0;
  let attemptedReviews = 0;
  let duplicateReviews = 0;
  const productsNeedingRecalc = new Set();

  console.log(`Scanning ${products.length} products for review targets...`);

  for (let productIndex = 0; productIndex < products.length; productIndex += 1) {
    const product = products[productIndex];
    const target = deterministicTarget(product.name, options.min, options.max);

    const existingReviews = await Review.find({ productId: product._id }, '_id userId').lean();
    const existingUserIds = new Set(existingReviews.map((r) => String(r.userId)));

    if (existingReviews.length >= target) {
      skippedProducts += 1;
      continue;
    }

    const needed = target - existingReviews.length;

    const candidateUsers = users
      .filter((u) => !existingUserIds.has(String(u._id)))
      .sort((a, b) => hashString(`${product.name}-${a.email}`) - hashString(`${product.name}-${b.email}`));

    const selected = candidateUsers.slice(0, needed);

    const reviewDocs = [];
    for (let i = 0; i < selected.length; i += 1) {
      reviewDocs.push(buildReviewDoc({
        product,
        userId: selected[i]._id,
        seq: i,
      }));
    }

    attemptedReviews += reviewDocs.length;

    if (options.dryRun) {
      createdReviews += reviewDocs.length;
    } else if (reviewDocs.length > 0) {
      try {
        const insertResult = await Review.insertMany(reviewDocs, { ordered: false });
        const inserted = parseInsertedCount(insertResult);
        createdReviews += inserted;
        if (inserted > 0) {
          productsNeedingRecalc.add(String(product._id));
        }
      } catch (err) {
        if (err && err.name === 'BulkWriteError') {
          const inserted = typeof err.insertedDocs?.length === 'number'
            ? err.insertedDocs.length
            : parseInsertedCount(err.result);
          createdReviews += inserted;
          const writeErrors = Array.isArray(err.writeErrors) ? err.writeErrors : [];
          const dupCount = writeErrors.filter((e) => e && e.code === 11000).length;
          duplicateReviews += dupCount;
          if (inserted > 0) {
            productsNeedingRecalc.add(String(product._id));
          }
        } else {
          throw err;
        }
      }
    }

    if ((productIndex + 1) % 10 === 0 || productIndex === products.length - 1) {
      console.log(
        `Progress: ${productIndex + 1}/${products.length} products | ` +
        `attempted ${attemptedReviews} | ${options.dryRun ? 'planned' : 'created'} ${createdReviews}`
      );
    }
  }

  if (!options.dryRun && productsNeedingRecalc.size > 0) {
    console.log(`Recalculating product ratings for ${productsNeedingRecalc.size} touched products...`);
    for (const productId of productsNeedingRecalc) {
      await Review.calcAverageRatings(productId);
    }
  }

  console.log('Review generation summary:');
  console.log(`- Products scanned: ${products.length}`);
  console.log(`- Products already at/above target: ${skippedProducts}`);
  console.log(`- New synthetic users created: ${createdCount}`);
  console.log(`- Reviews attempted: ${attemptedReviews}`);
  if (!options.dryRun) {
    console.log(`- Duplicate reviews skipped: ${duplicateReviews}`);
  }
  console.log(`- Reviews ${options.dryRun ? 'planned' : 'created'}: ${createdReviews}`);
}

async function run() {
  const options = parseArgs(process.argv);

  try {
    const conn = await mongoose.connect(DB_URI);
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
    console.log(`Options: min=${options.min}, max=${options.max}, targetUsers=${options.targetUsers}, dryRun=${options.dryRun}`);

    await generateReviews(options);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Failed to generate reviews:', error.message);
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore disconnect errors
    }
    process.exit(1);
  }
}

run();
