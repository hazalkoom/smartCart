const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/mongoDataBaseConnection');
const helmet = require('helmet');
const { errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');

dotenv.config({ path: '.env' });

connectDB();

const app = express();

app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Body parser with payload limit

if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  });
  
  app.use('/api', limiter); 
}

// our routers
app.use('/api/v1/auth', authRoutes);


// Simple health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});

app.use(errorHandler);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode at: http://localhost:${PORT}`);
});
