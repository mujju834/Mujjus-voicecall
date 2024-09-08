const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Allow CORS from Vite frontend
app.use(cors({
  origin: "http://localhost:5173", // Frontend URL
  methods: ["GET", "POST"],
  credentials: true,
}));

// Store user emails and their associated socket IDs
const users = new Map();

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO connection logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user registration and update the socket ID for the same user
socket.on('register-user', (email) => {
  users.set(email, socket.id);  // Overwrites the previous socket ID
  console.log(`Registered ${email} with socket ID ${socket.id}`);
});

// Handle calling functionality (no change needed here)
socket.on('call-user', (data) => {
  const { userToCall, offer, from } = data;
  const toSocketId = users.get(userToCall);  // Get the latest socket ID of the user to be called

  if (toSocketId) {
    console.log(`Calling user ${userToCall} from ${from}`);
    io.to(toSocketId).emit('call-made', { offer, from });
  } else {
    console.error(`No socket ID found for user ${userToCall}`);
  }
});


  // Handle answer call functionality
  socket.on('answer-call', (data) => {
    const { to, answer } = data;
    const toSocketId = users.get(to);

    if (toSocketId) {
      console.log(`Answering call to ${to}`);
      io.to(toSocketId).emit('call-answered', { answer });
    } else {
      console.error(`No socket ID found for user ${to}`);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Optionally remove the user from the map if needed
  });
});

// Listen on port 5000
server.listen(5000, () => {
  console.log('Server is running on port 5000');
});
