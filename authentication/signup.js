const express = require('express');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb'); // MongoDB client
require('dotenv').config();

const router = express.Router();

// MongoDB connection setup
const uri = process.env.MONGO_URI || `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@mongodb:27017`;//'mongodb://localhost:27017';
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

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const usersCollection = db.collection('users'); // Replace 'users' with your collection name
    const notificationsCollection = db.collection('notifications'); // Replace 'notifications' with your collection name

    // Check if the email already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // If user does not exist, proceed to register
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the users collection
    const userResult = await usersCollection.insertOne({
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    const userId = userResult.insertedId; // Get the ID of the newly registered user

    // Insert a notification entry for the newly registered user
    await notificationsCollection.insertOne({
      userId,
      notifications: [],
      createdAt: new Date(),
    });

    res.status(200).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error during user registration:', err);
    res.status(500).json({ error: 'User registration failed', err });
  }
});

module.exports = router;