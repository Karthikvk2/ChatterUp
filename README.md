# ChatterUp 💬

> A modern, real-time chat application built with Node.js, Socket.IO, and MongoDB

## 🌟 Features

- ⚡ **Real-time messaging** with Socket.IO
- 👥 **Live user presence** indicators
- 💬 **Typing indicators** for enhanced UX
- 🎨 **Random avatars** using DiceBear API
- 📱 **Fully responsive** design
- 💾 **Persistent chat history** with MongoDB
- 🔒 **XSS protection** and input validation
- 🌙 **Dark mode** support
- ♿ **Accessibility** features

## 📸 Screenshots

```

![1](./screenshots/image.png)
![2](./screenshots/image-1.png)

```

## 🚀 Quick Start

### Prerequisites

- Node.js 14+
- MongoDB (local or Atlas)
- npm/yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chatterup.git
   cd chatterup
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set environment variables** (optional)
   ```bash
   # Create .env file
   MONGODB_URI=mongodb://localhost:27017/chatterup
   PORT=3000
   ```

4. **Start the application**
   ```bash
   # Development
   npm run server
   
   # Production
   npm start
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

## 🏗️ Project Structure

```
chatterup/
├── server.js              # Main server file
├── package.json           # Dependencies & scripts
├── public/                # Static files
│   ├── index.html        # Main HTML
│   ├── styles.css        # Styling
│   └── script.js         # Client-side JS
└── README.md             # Documentation
```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Server runtime |
| **Express.js** | Web framework |
| **Socket.IO** | Real-time communication |
| **MongoDB** | Database |
| **Mongoose** | ODM for MongoDB |
| **Vanilla JS** | Frontend logic |
| **CSS3** | Styling & animations |

## 📡 API Endpoints

### Socket Events

#### Client → Server
```javascript
socket.emit('user_join', { username })
socket.emit('new_message', { message })
socket.emit('typing_start')
socket.emit('typing_stop')
```

#### Server → Client
```javascript
socket.on('welcome_message', data)
socket.on('chat_history', messages)
socket.on('message_received', data)
socket.on('user_joined', data)
socket.on('user_left', data)
socket.on('user_typing', data)
```

### REST Endpoints
```
GET /api/users/count    # Current user count
GET /api/messages       # Chat history
```

## 🗄️ Database Schema

```javascript
// Message Schema
{
  username: String,
  message: String,
  profilePic: String,
  timestamp: Date
}

// User Schema
{
  username: String,
  socketId: String,
  profilePic: String,
  joinedAt: Date
}
```

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/chatterup
PORT=3000
NODE_ENV=development
```

## 🎨 Features Showcase

### Real-time Messaging
- Instant message delivery via WebSockets
- Message history persistence
- Connection status indicators

### User Experience
- Smooth animations and transitions
- Mobile-first responsive design
- Typing indicators with smart timeouts
- Auto-scroll with user control

### Security
- Input validation and sanitization
- XSS protection through HTML escaping
- Connection verification

## 📱 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers

## 🚀 Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name "chatterup"
```

### Using Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Security Features

- **Input Validation**: Server-side validation for all inputs
- **XSS Prevention**: HTML escaping for user content
- **Rate Limiting**: Message length and frequency controls
- **Connection Security**: Socket ID validation

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 📈 Performance

- **Message Limits**: Last 50 messages loaded
- **Efficient DOM**: Optimized message rendering
- **Connection Pooling**: MongoDB connection optimization
- **Memory Management**: Automatic cleanup of old data

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request


### v1.0.0
- Initial release
- Real-time messaging
- User presence indicators
- MongoDB integration
- Responsive design

## 🎯 Roadmap

- [ ] Private messaging
- [ ] File sharing
- [ ] Voice messages
- [ ] Chat rooms
- [ ] User authentication
- [ ] Push notifications
- [ ] Message reactions
- [ ] Themes support


## 🙏 Acknowledgments

- [Socket.IO](https://socket.io/) for real-time communication
- [DiceBear](https://dicebear.com/) for avatar generation
- [MongoDB](https://mongodb.com/) for database solutions

## 📞 Contact

- **GitHub**: [@Karthik V Kottary](https://github.com/Karthikvk2)
- **LinkedIn**: [Karthik V Kottary](https://www.linkedin.com/in/karthik-v-kottary/)

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/Karthikvk2">Karthik V Kottary</a></p>
  <p>⭐ Star this repository if you find it helpful!</p>
</div>