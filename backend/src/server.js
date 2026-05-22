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
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// All backend API routes will start with /api.
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/streams', streamRoutes);

setupChatSocket(io);

server.listen(PORT, () => {
  console.log(`StreamForge backend running on port ${PORT}`);
});
