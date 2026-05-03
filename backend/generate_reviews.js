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
  'Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Benjamin', 'Lucas',
  'Henry', 'Theodore', 'Jack', 'Levi', 'Alexander', 'Jackson', 'Mateo', 'Daniel',
  'Michael', 'Mason', 'Sebastian', 'Ethan', 'Logan', 'Owen', 'Samuel', 'Jacob',
  'Asher', 'Aiden', 'John', 'Joseph', 'Wyatt', 'David', 'Leo', 'Luke', 'Julian',
  'Hudson', 'Grayson', 'Matthew', 'Ezra', 'Gabriel', 'Carter', 'Isaac', 'Jayden',
  'Luca', 'Anthony', 'Dylan', 'Lincoln', 'Thomas', 'Maverick', 'Elias', 'Josiah',
  'Charles', 'Caleb', 'Christopher', 'Ezekiel', 'Miles', 'Jaxon', 'Isaiah', 'Andrew',
  'Olivia', 'Emma', 'Charlotte', 'Amelia', 'Ava', 'Sophia', 'Isabella', 'Mia',
  'Evelyn', 'Luna', 'Camila', 'Gianna', 'Elizabeth', 'Eleanor', 'Ella',
  'Abigail', 'Sofia', 'Mila', 'Aria', 'Scarlett', 'Penelope', 'Layla',
  'Chloe', 'Victoria', 'Madison', 'Grace', 'Nora', 'Zoey'
];

const LAST_NAMES = [
  'Stone', 'Reed', 'Cole', 'Perry', 'Brooks', 'Hayes', 'Fisher', 'Mason',
  'Turner', 'Frost', 'Ellis', 'Bennett', 'Parker', 'Lane', 'Bailey', 'Scott',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Diaz',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson'
];

const TITLES_BY_RATING = {
  5: [
    'Excellent value', 'Top tier pick', 'Exceeded expectations', 'Highly recommended',
    'Absolutely love it!', 'Best purchase I\'ve made', 'Five stars aren\'t enough', 'Perfect in every way',
    'Outstanding quality', 'Incredible performance', 'Exactly what I needed', 'A game changer',
    'Superb craftsmanship', 'Brilliant design', 'Unbeatable for the price', 'My new favorite thing'
  ],
  4: [
    'Very good product', 'Solid choice', 'Great overall', 'Happy with purchase',
    'Almost perfect', 'Really good quality', 'Worth the money', 'I like it a lot',
    'Good, but has minor flaws', 'Very satisfied', 'Performs well', 'A reliable option',
    'Better than most', 'Would buy again', 'Great, with one small issue', 'Impressive'
  ],
  3: [
    'Good with caveats', 'Decent option', 'Works as expected', 'Mixed but okay',
    'Just average', 'Nothing special', 'It\'s alright', 'Gets the job done',
    'Okay for the price', 'Has some annoying quirks', 'Middle of the road', 'Neither good nor bad',
    'Functional but not amazing', 'Somewhat underwhelming', 'Met basic expectations', 'Fair'
  ],
  2: [
    'Below expectations', 'Needs improvement', 'Not ideal', 'Could be better',
    'Disappointed', 'Has some major flaws', 'I wouldn\'t recommend it', 'Fell short',
    'Overpriced for what it is', 'Frustrating to use', 'Poorly designed', 'Barely acceptable',
    'Quality control issues', 'Not what was advertised', 'Regret buying this', 'Two stars is generous'
  ],
  1: [
    'Disappointing experience', 'Would not recommend', 'Poor quality', 'Not worth it',
    'Absolute garbage', 'Terrible product', 'Complete waste of money', 'Do not buy this',
    'Broke immediately', 'Awful customer service', 'A total scam', 'Worst purchase ever',
    'Defective out of the box', 'Useless', 'Horrible design', 'Zero stars if I could'
  ],
};

const COMMENTS_BY_RATING = {
  5: [
    'Build quality is excellent and setup was straightforward. I would buy this again.',
    'Performance is fantastic for the price and it fits my workflow perfectly.',
    'Great packaging, great finish, and works exactly as described.',
    'One of the best purchases I made this year. Reliable and fast.',
    'I was skeptical at first, but this absolutely blew me away. The attention to detail is remarkable.',
    'This product has completely transformed the way I work. I cannot recommend it highly enough!',
    'Arrived much faster than expected and the quality is premium. Definitely worth every penny.',
    'I\'ve tried several alternatives before this one, and nothing even comes close. Truly exceptional.',
    'Flawless execution. It does exactly what it claims to do without any hiccups or complicated setup.',
    'I bought this as a gift for a friend and they won\'t stop raving about it. I might have to buy one for myself.',
    'The customer support was amazing when I had a quick question, and the product itself is phenomenal.',
    'It\'s rare to find something that perfectly matches the marketing hype, but this definitely does.',
    'Sleek, modern, and incredibly durable. I\'ve been using it daily for weeks and it still looks brand new.',
    'Honestly, I couldn\'t be happier. It exceeds all my expectations in every single category.',
    'If you\'re on the fence about buying this, just do it. You won\'t regret the investment.'
  ],
  4: [
    'Very good overall with only minor things I would tweak.',
    'Does what I needed and feels dependable for daily use.',
    'Nice quality and solid performance. Worth considering.',
    'Good product, just not perfect. Still happy with it.',
    'I really like this, but I took off one star because the instructions were slightly confusing.',
    'Solid build and reliable. I just wish it came in more color options.',
    'It works great 95% of the time, occasionally it has a tiny glitch but nothing deal-breaking.',
    'Great value for the price point. It\'s not luxury tier, but it definitely punches above its weight.',
    'I\'m satisfied with my purchase. It arrived quickly and functions exactly as intended.',
    'Almost a perfect score. If they improve the battery life in the next version, it\'ll be a 5-star product.',
    'Very intuitive to use. I didn\'t even need to read the manual to get started.',
    'It\'s sturdy and looks nice on my desk. Overall a very positive experience.',
    'Good quality materials used. It feels substantial and not cheap at all.',
    'I\'ve recommended this to a few colleagues. It\'s a very safe and reliable choice.',
    'Meets my expectations well. It\'s a good, honest product without any deceptive marketing.'
  ],
  3: [
    'It is acceptable, but there are trade-offs you should know about.',
    'Works okay for light use. Expected a little more for the price.',
    'Not bad, not amazing. Gets the job done.',
    'Average experience so far. Might be better after updates.',
    'It\'s functional, but you can definitely tell where they cut corners to save money.',
    'I\'ll keep using it because it works, but I wouldn\'t necessarily go out of my way to buy it again.',
    'It\'s just okay. Nothing about it stands out, but it doesn\'t completely fail either.',
    'Setup was a bit of a hassle, and the final result is merely adequate.',
    'It does the bare minimum of what was promised. Don\'t expect to be blown away.',
    'It\'s a classic case of "you get what you pay for". It\'s cheap and it feels cheap.',
    'I have mixed feelings. Some features are great, but others feel like an afterthought.',
    'It works fine for occasional use, but I wouldn\'t rely on it for heavy, daily tasks.',
    'The design is nice but the execution leaves a bit to be desired in terms of durability.',
    'It\'s right down the middle. Not the worst thing I\'ve bought, but far from the best.',
    'I think there are better options out there for a similar price, but this isn\'t terrible.'
  ],
  2: [
    'Had a few issues during setup and day-to-day use.',
    'Performance is inconsistent and the value feels low.',
    'I expected better quality and polish at this price point.',
    'There are better alternatives in the same range.',
    'I really wanted to like this, but it just frustrates me every time I try to use it.',
    'The build quality is remarkably flimsy. I feel like I\'m going to break it just by holding it.',
    'It looks nice in the pictures, but in person it looks and feels like cheap plastic.',
    'It technically works, but the user experience is incredibly clunky and unintuitive.',
    'I\'ve had to contact support twice already to get it working properly. Not worth the headache.',
    'It arrived with a small scratch, which is annoying, but even worse, it underperforms terribly.',
    'The marketing for this is incredibly misleading. It doesn\'t do half the things it claims.',
    'Battery life is abysmal compared to what was advertised. I constantly have to charge it.',
    'I regret spending my money on this. I should have gone with the more expensive, reputable brand.',
    'It completely failed on me after just two weeks of light use. Very disappointing.',
    'The software integration is a nightmare. It constantly disconnects and crashes.'
  ],
  1: [
    'Ran into repeated issues and could not rely on it.',
    'Poor experience overall. I would avoid this model.',
    'Did not match the product description in practice.',
    'Not satisfied with quality or performance.',
    'Absolute trash. It broke within five minutes of taking it out of the box.',
    'I would give this zero stars if I could. A complete and utter waste of money.',
    'Do not buy this under any circumstances. It is a terrible product.',
    'Customer service is nonexistent. They completely ignored my emails when I asked for a refund.',
    'This is essentially a scam. The product looks nothing like the photos and barely functions.',
    'It actually caused damage to my other equipment. I am furious with this purchase.',
    'The worst thing I have ever bought online. Quality control clearly does not exist at this company.',
    'It never worked from day one. Completely dead on arrival and unable to be fixed.',
    'It feels incredibly unsafe to use. I\'m honestly worried it might catch fire.',
    'Save yourself the time, money, and frustration. Look literally anywhere else.',
    'I threw it straight into the garbage. Not even worth the effort to package it up for a return.'
  ],
};

function parseArgs(argv) {
  const defaults = {
    min: 5,
    max: 10,
    dryRun: false,
    targetUsers: 150,
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
  if (!options.dryRun) {
    console.log('Deleting all existing reviews...');
    const deleteResult = await Review.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount || 0} existing reviews.`);
  }

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

  if (!options.dryRun) {
    console.log(`Recalculating product ratings for ${products.length} products...`);
    for (const product of products) {
      await Review.calcAverageRatings(product._id);
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
