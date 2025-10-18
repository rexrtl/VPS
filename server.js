const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Minecraft Bedrock AFK Bot is running on rexrtl.progamer.me',
    version: '1.0.0',
    domain: 'rexrtl.progamer.me',
    port: 22504
  });
});

app.post('/api/bot/start', (req, res) => {
  const { duration = 120, movementDelay = 30 } = req.body;
  
  io.emit('bot-status', { 
    status: 'started', 
    duration,
    movementDelay,
    timestamp: new Date().toISOString()
  });
  
  res.json({ 
    success: true, 
    message: `AFK Bot started for ${duration} minutes`,
    domain: 'rexrtl.progamer.me'
  });
});

app.post('/api/bot/stop', (req, res) => {
  io.emit('bot-status', { 
    status: 'stopped', 
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true, message: 'AFK Bot stopped' });
});

// Get bot configuration
app.get('/api/bot/config', (req, res) => {
  res.json({
    domain: 'rexrtl.progamer.me',
    port: 22504,
    features: [
      'Anti-AFK movements',
      'Random actions',
      'Web-based control',
      'Real-time status'
    ],
    supportedActions: ['jump', 'move', 'look', 'sneak', 'sprint']
  });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.emit('welcome', { 
    message: 'Connected to Minecraft AFK Bot - rexrtl.progamer.me',
    domain: 'rexrtl.progamer.me',
    port: 22504,
    controls: {
      start: 'POST /api/bot/start',
      stop: 'POST /api/bot/stop',
      status: 'GET /api/status',
      config: 'GET /api/bot/config'
    }
  });
  
  socket.on('start-bot', (data) => {
    console.log('Bot start requested:', data);
    io.emit('bot-activity', { action: 'started', ...data });
  });
  
  socket.on('stop-bot', () => {
    console.log('Bot stop requested');
    io.emit('bot-activity', { action: 'stopped' });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 22504;
server.listen(PORT, () => {
  console.log(`🚀 Minecraft AFK Bot Server running on port ${PORT}`);
  console.log(`📱 Access via: http://rexrtl.progamer.me:${PORT}`);
  console.log(`🌐 Domain: rexrtl.progamer.me`);
});
