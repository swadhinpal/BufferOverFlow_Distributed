const express = require('express');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb'); // Import MongoDB client
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// MongoDB connection setup
const uri = process.env.MONGO_URI || `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@mongodb:27017`;
const dbName = process.env.DB_NAME || 'bufferOverflow'; // Replace with your database name

let db;

// Connect to MongoDB
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });

// Sign-in route
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const usersCollection = db.collection('users'); // Replace 'users' with your collection name
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    axios.post('http://post:4002/receive-token', { token })
    .then(response => {
      console.log('Token successfully sent to post container:', response.data);
    })
    .catch(error => {
      console.error('Error sending token to post container:', error);
    });

  // Send the token to the notification container (port 4003)
   axios.post('http://notification:4003/receive-token', { token })
    .then(response => {
      console.log('Token successfully sent to notification container:', response.data);
    })
    .catch(error => {
      console.error('Error sending token to notification container:', error);
    });

    return res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Error during sign-in:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify JWT token middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract the token

  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

router.post('/fetch-user', async (req, res) => {
  const { userId, email } = req.body;
  console.log(req.body);
  console.log(email);
  console.log(userId);
  if (!userId && !email) {
    return res.status(400).json({ error: 'Either userId or email is required' });
  }

  try {
    const usersCollection = db.collection('users');
    const query = userId ? { _id: new ObjectId(userId) } : { email };
    const user = await usersCollection.findOne(query);
    console.log(user);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Exclude sensitive data
    const { _id, email: userEmail, createdAt } = user;
    return res.status(200).json({ user: { _id, email: userEmail, createdAt } });
  } catch (err) {
    console.error('Error fetching user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/fetch-all-users', async (req, res) => {
  const { excludeUserId } = req.body;
  console.log(req.body);
  try {
    //const db = await getDB();

    const query = excludeUserId ? { _id: { $ne: new ObjectId(excludeUserId) } } : {};
    const users = await db.collection('users').find(query).toArray();

    res.status(200).json({ users });
  } catch (err) {
    console.error('Error fetching all users:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /verify-token
 * Verify the validity of a JWT token.
 */
router.post('/verify-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Return decoded token data (e.g., user info)
    return res.status(200).json({ message: 'Token is valid', user: decoded });
  });
});

module.exports = { router, authenticateToken };