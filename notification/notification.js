const express = require('express');
const axios = require('axios');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const router = express.Router();

// MongoDB configuration
const notification_uri = process.env.NOTIFICATION_MONGO_URI || `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@notification-mongodb:27017`;
const notification_dbName = process.env.NOTIFICATION_DB_NAME || 'bufferOverflow2';

// MongoDB client
let dbClient = null;
async function getDB() {
  if (!dbClient) {
    dbClient = new MongoClient(notification_uri, { useUnifiedTopology: true });
    await dbClient.connect();
  }
  return dbClient.db(notification_dbName);
}


let storedToken = null;

async function authenticateToken(req, res, next) {
  const token = req.body.token || storedToken || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]); // Look for token in the body, storedToken, or header

  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }
  console.log(token);
  try {
    // Verify token using JWT secret and get user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded user info to the request
    next(); // Proceed to the next middleware/route handler
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
  
// POST /receive-token route to receive the token and store it temporarily
router.post('/receive-token', (req, res) => {
  const { token } = req.body;
  console.log("token koi");

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Store the token temporarily in memory
    storedToken = token;
    // Verify the token and fetch user information if needed
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Return user details or token verification success message
    res.status(200).json({ message: 'Token received successfully', user: decoded });
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

// Fetch content from Post Service by filename
async function fetchContentFromPostService(filename) {
  try {
    const response = await axios.get(`http://post:4002/fetch-file/${filename}`);
    if (response.status === 200) {
      return response.data.content;
    } else {
      console.error('Failed to fetch content from Post Service:', response.data);
      return null;
    }
  } catch (err) {
    console.error('Error fetching content from Post Service:', err.message);
    return null;
  }
}

// **GET /notification**
router.get('/notification', authenticateToken, async (req, res) => {
  const { email } = req.query;
  console.log("email received from notif");

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const db = await getDB();

    // Fetch user from Authentication Service
    const userResponse = await axios.post('http://authentication:4001/fetch-user', { email });
    const user = userResponse.data.user;
    console.log(userResponse.data);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user._id;
    console.log("userid here");
    console.log(userId);
    // Fetch notifications for the user
    const notification = await db.collection('notifications').findOne({ userId: new ObjectId(userId) });
    console.log("notification here");
    console.log(notification);
    if (!notification || !notification.postIds || notification.postIds.length === 0) {
      return res.status(200).json({ notifications: [] });
    }

    const postIds = notification.postIds;
    console.log("postids");
    console.log(postIds);
    // Fetch post details from Post Service
    const postResponse = await axios.post('http://post:4002/fetch-content', { postIds, userId });
    const posts = postResponse.data.posts || [];

    console.log("posts");
    console.log(posts);

    const notifications = posts.map(post => ({
      email: post.userEmail,
      postId: post._id,
      title: post.title,
      description: post.description,
      time: post.time,
    }));
    console.log("notifications here");
    console.log(notifications);
    res.status(200).json({ notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// **POST /notification**
router.post('/notification', authenticateToken, async (req, res) => {
  const { email, postId } = req.body;

  if (!email || !postId) {
    return res.status(400).json({ error: 'Email and Post ID are required' });
  }

  try {
    const db = await getDB();

    // Fetch user from Authentication Service
    const userResponse = await axios.post('http://authentication:4001/fetch-user', { email });
    const user = userResponse.data.user;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user._id;

    // Fetch post details from Post Service
    const postResponse = await axios.post('http://post:4002/fetch-content', { postIds: [postId] });
    const post = postResponse.data.posts?.[0];

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    let code = null;

    // If the post has a filename, fetch the code from Post Service
    if (post.filename) {
      code = await fetchContentFromPostService(post.filename);
    }
    console.log("filenm");
    console.log(code);
    // Remove the clicked post ID from notifications
    const notification = await db.collection('notifications').findOne({ userId: new ObjectId(userId) });
    console.log("postidpost");
    console.log(postId);
    console.log("notificationssss");
    console.log(notification.postIds);
    const updatedPostIds = (notification?.postIds || []).filter(id => id !== postId);
    console.log("updated post ids");
    console.log(updatedPostIds);
    await db.collection('notifications').updateOne(
      { userId: new ObjectId(userId) },
      { $set: { postIds: updatedPostIds } }
    );

    res.status(200).json({ content: post, code });
  } catch (err) {
    console.error('Error processing notification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/fetch-notifications', async (req, res) => {
    const { userId } = req.body;
  
    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }
  
    try {
      const db = await getDB();
  
      const notification = await db.collection('notifications').findOne({ userId: new ObjectId(userId) });
  
      res.status(200).json({ notifications: notification || { postIds: [] } });
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

router.post('/update-notifications', async (req, res) => {
    const { userId, postIds } = req.body;
  
    if (!userId || !postIds) {
      return res.status(400).json({ error: 'UserId and postIds are required' });
    }
  
    try {
      const db = await getDB();
  
      await db.collection('notifications').updateOne(
        { userId: new ObjectId(userId) },
        { $set: { postIds } },
        { upsert: true }
      );
  
      res.status(200).json({ message: 'Notifications updated successfully' });
    } catch (err) {
      console.error('Error updating notifications:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

// **Run Clean Notifications**
async function runCleanNotifications() {
  console.log('Running runCleanNotifications...');
  try {
    const db = await getDB();
    const notifications = await db.collection('notifications').find().toArray();
    const currentTime = new Date().getTime();

    for (const notification of notifications) {
      const postIdsArray = notification.postIds || [];

      if (postIdsArray.length > 0) {
        // Fetch post details from Post Service
        const postResponse = await axios.post('http://post:4002/fetch-content', { postIds: postIdsArray });
        const posts = postResponse.data.posts || [];

        const updatedPostIds = posts
          .filter(post => currentTime - new Date(post.time).getTime() <= 600000) // Retain posts within 10 minutes
          .map(post => post._id);

        if (updatedPostIds.length === 0) {
          await db.collection('notifications').deleteOne({ _id: notification._id });
          console.log(`Removed all notifications for user ${notification.userId}`);
        } else {
          await db.collection('notifications').updateOne(
            { _id: notification._id },
            { $set: { postIds: updatedPostIds } }
          );
          console.log(`Updated notifications for user ${notification.userId}`);
        }
      }
    }
  } catch (err) {
    console.error('Error cleaning notifications:', err);
  }
}

// Run cleanup immediately and set interval to run every 2 minutes
runCleanNotifications();
setInterval(runCleanNotifications, 120000);

module.exports = router;
