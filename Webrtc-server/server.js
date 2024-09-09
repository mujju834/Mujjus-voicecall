const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Allow CORS from Vite frontend
app.use(cors({
  origin: "*", // Allows requests from any domain
  methods: ["GET", "POST"],
  credentials: true,
}));


// Store user emails and their associated socket IDs
const users = new Map();
const socketToEmail = new Map(); // Map for tracking socket to email

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
  origin: "*", // Allows requests from any domain
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
    socketToEmail.set(socket.id, email);  // Track socket by email
    console.log(`Registered ${email} with socket ID ${socket.id}`);
  });

  // Handle calling functionality
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

  socket.on('cancel-call', (data) => {
    const { to } = data;
    const toSocketId = users.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('call-cancelled');
      console.log(`Call cancelled by ${data.from}`);
    }
  });
  

  // Handle user disconnect and remove socket ID
  socket.on('disconnect', () => {
    const email = socketToEmail.get(socket.id);
    if (email) {
      console.log(`User with email ${email} disconnected.`);
      socketToEmail.delete(socket.id);
      users.delete(email);  // Remove the user from the map when disconnected
    }
  });
});



// Listen on port 5000
server.listen(5000, () => {
  console.log('Server is running on port 5000');
});
