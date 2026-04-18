const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((error) => {
    console.log('MongoDB connection failed:', error.message);
  });
  // Direct test route
app.post('/test', (req, res) => {
  res.json({ message: 'Direct post route works' });
});

// Routes
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('Auth routes loaded successfully');
} catch (error) {
  console.log('Error loading auth routes:', error.message);
}
// Bus routes
try {
  const busRoutes = require('./routes/buses');
  app.use('/api/buses', busRoutes);
  console.log('Bus routes loaded successfully');
} catch (error) {
  console.log('Error loading bus routes:', error.message);
}
// Route routes
try {
  const routeRoutes = require('./routes/routes');
  app.use('/api/routes', routeRoutes);
  console.log('Route routes loaded successfully');
} catch (error) {
  console.log('Error loading route routes:', error.message);
}
const authMiddleware = require('./middleware/auth');
const protect = authMiddleware.protect;
app.get('/api/protected', protect, (req, res) => {
  res.json({ 
    message: 'You accessed a protected route',
    user:    req.user
  });
});
console.log('Protected route registered')
// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Bus Forecasting System API is running',
    status:  'success',
    version: '1.0.0'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
