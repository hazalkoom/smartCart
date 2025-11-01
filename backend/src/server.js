const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/mongoDataBaseConnection');
const { errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');

dotenv.config({ path: '.env' });

connectDB();

const app = express();

// Body parser
app.use(express.json());

// Simple health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});
app.use('/api/v1/auth', authRoutes);

app.use(errorHandler);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode at: http://localhost:${PORT}`);
});