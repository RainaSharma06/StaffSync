require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api');
const User = require('./models/User');
const seedData = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend clients
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Express JSON body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'StaffSync HRMS REST API',
    uptime: process.uptime(),
  });
});

// Manual seed trigger endpoint (useful for demo testing or resetting data)
app.post('/api/seed', async (req, res) => {
  try {
    await seedData();
    res.json({ success: true, message: 'Database reseeded successfully with demo data' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Main API Routes
app.use('/api', apiRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error Unhandled]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error occurred',
  });
});

// Start server after establishing database connection
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is freshly initialized or empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Automatically executing seedData()...');
      await seedData();
    } else {
      console.log(`[Server] Database ready with ${userCount} existing users.`);
    }

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  🚀 StaffSync HRMS Server Running on Port ${PORT} `);
      console.log(`  🔗 REST API URL: http://localhost:${PORT}/api      `);
      console.log(`  🩺 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[Fatal Error] Failed to start StaffSync server:', err);
    process.exit(1);
  }
};

startServer();
