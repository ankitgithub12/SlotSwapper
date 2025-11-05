const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);

// Enhanced CORS configuration
const allowedOrigins = process.env.CLIENT_URLS ? 
  process.env.CLIENT_URLS.split(',') : 
  ['http://localhost:3000', 'http://localhost:3001'];

console.log('Allowed CORS origins:', allowedOrigins);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling']
});

// Enhanced CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware
app.use(express.json());

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user to their own room for personalized notifications
  socket.on('join-user', (userId) => {
    // Add validation to prevent crashes
    if (userId === null || userId === undefined) {
      console.error('❌ Invalid userId (null/undefined) received for join-user from socket:', socket.id);
      return;
    }
    
    try {
      const roomId = userId.toString();
      socket.join(roomId);
      console.log(`✅ User ${userId} joined room: ${roomId}`);
    } catch (error) {
      console.error('❌ Error joining room for userId:', userId, 'Error:', error.message);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
  });

  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/swap', require('./routes/swap'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'SlotSwapper API is running!',
    timestamp: new Date().toISOString(),
    cors: {
      allowedOrigins: allowedOrigins,
      status: 'Active'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    console.log('Process terminated');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server initialized`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;