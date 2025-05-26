import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatterup';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Message Schema
const messageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  message: { type: String, required: true },
  profilePic: { type: String, default: 'default-avatar.png' },
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// User Schema for tracking online users
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  socketId: { type: String, required: true },
  profilePic: { type: String, default: 'default-avatar.png' },
  joinedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users and typing users
let connectedUsers = new Map();
let typingUsers = new Set();

// Default profile pictures array
const defaultProfilePics = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=5'
];

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user joining
  socket.on('user_join', async (data) => {
    const { username } = data;
    
    // Assign random profile picture
    const profilePic = defaultProfilePics[Math.floor(Math.random() * defaultProfilePics.length)];
    
    // Store user info
    connectedUsers.set(socket.id, { username, profilePic });
    
    try {
      // Save user to database
      await User.findOneAndUpdate(
        { username },
        { socketId: socket.id, profilePic },
        { upsert: true, new: true }
      );

      // Send welcome message to the user
      socket.emit('welcome_message', {
        message: `Welcome to ChatterUp, ${username}!`,
        username: username
      });

      // Send chat history to the new user
      const messages = await Message.find().sort({ timestamp: 1 }).limit(50);
      socket.emit('chat_history', messages);

      // Get current user count and list
      const userList = Array.from(connectedUsers.values());
      
      // Notify all users about the new user
      io.emit('user_joined', {
        username,
        profilePic,
        userCount: connectedUsers.size,
        userList: userList
      });

      console.log(`${username} joined the chat`);
    } catch (error) {
      console.error('Error handling user join:', error);
    }
  });

  // Handle new messages
  socket.on('new_message', async (data) => {
    const userInfo = connectedUsers.get(socket.id);
    if (!userInfo) return;

    const { username, profilePic } = userInfo;
    const { message } = data;

    try {
      // Save message to database
      const newMessage = new Message({
        username,
        message,
        profilePic,
        timestamp: new Date()
      });
      
      await newMessage.save();

      // Broadcast message to all users
      io.emit('message_received', {
        username,
        message,
        profilePic,
        timestamp: newMessage.timestamp
      });

      console.log(`Message from ${username}: ${message}`);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing_start', () => {
    const userInfo = connectedUsers.get(socket.id);
    if (!userInfo) return;

    typingUsers.add(userInfo.username);
    socket.broadcast.emit('user_typing', {
      username: userInfo.username,
      isTyping: true
    });
  });

  socket.on('typing_stop', () => {
    const userInfo = connectedUsers.get(socket.id);
    if (!userInfo) return;

    typingUsers.delete(userInfo.username);
    socket.broadcast.emit('user_typing', {
      username: userInfo.username,
      isTyping: false
    });
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    const userInfo = connectedUsers.get(socket.id);
    
    if (userInfo) {
      const { username } = userInfo;
      
      // Remove user from connected users
      connectedUsers.delete(socket.id);
      typingUsers.delete(username);

      try {
        // Remove user from database
        await User.deleteOne({ socketId: socket.id });

        // Get updated user list
        const userList = Array.from(connectedUsers.values());

        // Notify remaining users
        socket.broadcast.emit('user_left', {
          username,
          userCount: connectedUsers.size,
          userList: userList
        });

        console.log(`${username} left the chat`);
      } catch (error) {
        console.error('Error handling user disconnect:', error);
      }
    }
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get current user count
app.get('/api/users/count', (req, res) => {
  res.json({ count: connectedUsers.size });
});

// API endpoint to get chat history
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 }).limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`ChatterUp server running on http://localhost:${PORT}`);
});

export default app;