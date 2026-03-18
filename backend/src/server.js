const rateLimit = require('express-rate-limit');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/mongoDataBaseConnection');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const userRoutes = require('./routes/userRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const socket = require('./utils/socket');
const redisClient = require('./utils/redisClient');

dotenv.config({ path: '.env' });

// Fix #8: Validate critical env vars at startup — fail fast instead of cryptic runtime errors
const requiredEnvVars = ['JWT_SECRET', 'JWT_EXPIRE', 'MONGODB_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`FATAL: Environment variable ${envVar} is not set. Exiting.`);
    process.exit(1);
  }
}

const app = express();

app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);
app.use(helmet());

// Fix #7: CORS — allow frontend origin
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true,
}));

app.use(express.json({ limit: '50kb' })); // Body parser with payload limit

if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  });
  
  app.use('/api', limiter); 
}

// Fix #10: Only expose API docs in non-production
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
// Simple health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});

app.use(errorHandler);
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode at: http://localhost:${PORT}`);
  });

  // --- NEW SOCKET.IO INJECTION ---
  const io = socket.init(server);
  
  io.on('connection', (socketConn) => {
    logger.info(`A client connected via WebSocket: ${socketConn.id}`);

    // Listen for the Angular app telling us which user just logged in
    socketConn.on('joinRoom', (userId) => {
      socketConn.join(userId.toString());
      logger.info(`User ${userId} joined their private notification room.`);
    });

    socketConn.on('disconnect', () => {
      logger.info(`Client disconnected: ${socketConn.id}`);
    });
  });
  // -------------------------------

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      const mongoose = require('mongoose');
      await mongoose.disconnect();
      await redisClient.quit();
      logger.info('MongoDB disconnected. Process exiting.');
      process.exit(0);
    });
    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown — could not close connections in time.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
