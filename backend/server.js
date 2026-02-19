const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const teamRoutes = require('./routes/teams');
const activityRoutes = require('./routes/activities');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');

// Middleware imports
const errorHandler = require('./middlewares/errorHandler');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   ✅ CORS CONFIGURATION
========================= */

const allowedOrigins = [
  'https://opulent-winner-g4rj7ppxpqxvc9vpg-5173.app.github.dev',
  'http://localhost:5173',
  'https://task-flow-eta-ten.vercel.app'   // ✅ Production Frontend
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser tools (Postman / curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle OPTIONS preflight globally (safer)
app.options('*', cors());

/* ========================= */

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150
});
app.use('/api/', limiter);

// Debug logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Root route (prevents Cannot GET / confusion)
app.get('/', (req, res) => {
  res.send('✅ TaskFlow Backend API Running');
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    environment: process.env.NODE_ENV
  });
});

// MongoDB status
app.get('/api/db-status', (req, res) => {
  const status = mongoose.connection.readyState;

  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({ status: statusMap[status] });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
