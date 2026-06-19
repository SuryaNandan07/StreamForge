const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const streamRoutes = require('./routes/streamRoutes');
const setupChatSocket = require('./socket/chatSocket');

dotenv.config();

const app = express();
//console.log("port = ", process.env.PORT)
const PORT = process.env.PORT || 5000;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [
  "http://localhost:5173",
  "https://stream-forge-nine.vercel.app",
];

function isAllowedOrigin(origin) {
  // Requests from tools like curl may not send an Origin header.
  if (!origin) {
    return true;
  }

  return (
    allowedOrigins.includes(origin) ||
    origin.endsWith('.trycloudflare.com')
  );
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
const server = http.createServer(app);
const io = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: corsOptions.origin,
    credentials: true,
    methods: corsOptions.methods,
    allowedHeaders: corsOptions.allowedHeaders,
  },
});

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'StreamForge backend is running',
  });
});

// All backend API routes will start with /api.
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/streams', streamRoutes);

setupChatSocket(io);
console.log('Socket.io server attached');

async function startServer() {
  try {
    // Start the API only after MongoDB is ready.
    await connectDB();

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use.`);
        console.log('Fix: stop the old backend terminal or change PORT in backend/.env.');
        process.exit(1);
      }

      console.log('Backend server error:', error.message);
      process.exit(1);
    });

    server.listen(PORT, () => {
      console.log(`StreamForge backend running on port ${PORT}`);
      console.log(`Frontend allowed by CORS: ${FRONTEND_URL}`);
    });
  } catch (error) {
    console.log('Backend failed to start because MongoDB is not connected.');
    console.log('Startup error:', error.message);
    process.exit(1);
  }
}

startServer();
