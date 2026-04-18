const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const mongoose = require('mongoose');

const connectDB = require('./config/mongoDataBaseConnection');      
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorMiddleware');   
const User = require('./models/userModel');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const swaggerSpec = require('./config/swagger');
const socket = require('./utils/socket');
const redisClient = require('./utils/redisClient');
const cartWorker = require('./workers/cartWorker');
const { cartQueue } = require('./workers/queueSetup');

const requiredEnvVars = ['JWT_SECRET', 'JWT_EXPIRE', 'MONGODB_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error('FATAL: Environment variable ' + envVar + ' is not set. Exiting.');
    process.exit(1);
  }
}

const app = express();

app.set('trust proxy', 1);

app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  })
);

app.use(express.json({ limit: '50kb' }));

if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  });
  app.use('/api', limiter);
}

if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/webhook', webhookRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const safeCloseRedis = async () => {
  try {
    if (!redisClient) return;

    const status = redisClient.status;
    if (status === 'ready' || status === 'connect' || status === 'reconnecting') {
      await redisClient.quit();
    } else {
      redisClient.disconnect();
    }
  } catch (err) {
    logger.error('Redis shutdown error: ' + err.message);
  }
};

const safeCloseBullMQ = async () => {
  try {
    if (cartWorker && typeof cartWorker.close === 'function') {
      await cartWorker.close();
    }
  } catch (err) {
    logger.error('BullMQ worker shutdown error: ' + err.message);
  }

  try {
    if (cartQueue && typeof cartQueue.close === 'function') {
      await cartQueue.close();
    }
  } catch (err) {
    logger.error('BullMQ queue shutdown error: ' + err.message);
  }
};

const safeCloseMongo = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (err) {
    logger.error('MongoDB shutdown error: ' + err.message);
  }
};

const startServer = async () => {
  await connectDB();

  if (process.env.NODE_ENV !== 'production') {
    const ownerEmail = 'owner@test.com';
    const ownerPassword = 'password123';
    const owner = await User.findOne({ email: ownerEmail }).select('+password');

    if (!owner) {
      await User.create({
        firstName: 'Owner',
        lastName: 'User',
        email: ownerEmail,
        password: ownerPassword,
        role: 'owner',
        mobileNumber: '01000000000',
      });
      logger.info('Seeded default owner account for local testing.');
    } else {
      let needsSave = false;

      if (owner.role !== 'owner') {
        owner.role = 'owner';
        needsSave = true;
      }

      const passwordMatches = await owner.matchPassword(ownerPassword).catch(() => false);
      if (!passwordMatches) {
        owner.password = ownerPassword;
        needsSave = true;
      }

      if (needsSave) {
        await owner.save();
        logger.info('Refreshed default owner account for local testing.');
      }
    }
  }

  const server = app.listen(PORT, () => {
    logger.info('Server running in ' + process.env.NODE_ENV + ' mode at: http://localhost:' + PORT);
  });

  const io = socket.init(server);

  io.on('connection', (clientSocket) => {
    logger.info('A client connected via WebSocket: ' + clientSocket.id);

    clientSocket.on('joinRoom', (userId) => {
      clientSocket.join(String(userId));
      logger.info('User ' + userId + ' joined their private notification room.');
    });

    clientSocket.on('disconnect', () => {
      logger.info('Client disconnected: ' + clientSocket.id);
    });
  });

  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(signal + ' received. Shutting down gracefully...');

    const forceExitTimer = setTimeout(() => {
      logger.error('Forced shutdown — could not close connections in time.');
      process.exit(1);
    }, 15000);

    try {
      await new Promise((resolve) => server.close(resolve));

      await Promise.allSettled([
        safeCloseBullMQ(),
        safeCloseMongo(),
        safeCloseRedis(),
      ]);

      logger.info('Graceful shutdown completed.');
      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (err) {
      logger.error('Shutdown error: ' + err.message);
      clearTimeout(forceExitTimer);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();