const express = require('express');
const multer = require('multer');
const axios = require('axios'); // For making HTTP requests to the Authentication Service
const { MongoClient, ObjectId } = require('mongodb');
const { minioClient, bucketName } = require('./minio');
const jwt = require('jsonwebtoken'); // For token verification

const router = express.Router();
const upload = multer();

// MongoDB connection URIs for the Post Service
const postDbUri = process.env.POST_MONGO_URI || `mongodb://${process.env.MONGO_USER1}:${process.env.MONGO_PASSWORD1}@post-mongodb:27017`;
const postDbName = process.env.POST_DB_NAME || 'bufferOverflow1'; // Posts DB name

let postDb;

// Temporary in-memory storage for token
let storedToken = null;

// Connect to posts database
MongoClient.connect(postDbUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    postDb = client.db(postDbName);
    console.log('Connected to posts MongoDB');
  })
  .catch(err => console.error('Failed to connect to posts MongoDB', err));

// Middleware for verifying JWT token
async function authenticateToken(req, res, next) {
  const token = req.body.token || storedToken || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]); // Look for token in the body, storedToken, or header

  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  try {
    // Verify token using JWT secret and get user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded user info to the request
    next(); // Proceed to the next middleware/route handler
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
async function fetchUserFromAuthService(email) {
    try {
      console.log('Fetching user with email:', email);  // Add logging to check the email
      const response = await axios.post('http://authentication:4001/fetch-user', { email });
      
      console.log('User fetched successfully:', response.data); // Log the response from the authentication service
      
      return response.data.user;
    } catch (err) {
      console.log(email);
      console.error('Error fetching user from authentication service:', err);
      throw new Error('Error fetching user from authentication service');
    }
  }
  
// POST /receive-token route to receive the token and store it temporarily
router.post('/receive-token', (req, res) => {
  const { token } = req.body;

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

// GET /post route to fetch posts (authenticate the token)
/*router.get('/post', authenticateToken, async (req, res) => {
  try {
    const { email } = req.query;
    console.log(email);
    //const email='bsse1@iit.du.ac.bd';
    // Fetch user details from authentication service using token
    console.log("now inside get.post");
    const user = await fetchUserFromAuthService(email);

    // Access the posts collection from the posts DB
    const posts = await postDb
      .collection('content')
      .aggregate([
        { $match: { userId: { $ne: user._id } } }, // Exclude user's own posts
        { $sort: { time: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        { $unwind: '$userDetails' },
        {
          $project: {
            text: 1,
            filename: 1,
            time: 1,
            email: '$userDetails.email',
          },
        },
      ])
      .toArray();
    console.log("posts here");
    console.log(posts);
    const contents = await fetchContentWithCode(posts);
    res.status(200).json({ contents });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching posts here', err });
  }
});*/

router.get('/post', authenticateToken, async (req, res) => {
  try {
    const { email } = req.query;
    console.log('Fetching posts for email:', email);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Fetch user details
    const user = await fetchUserFromAuthService(email);
    console.log('User fetched successfully:', user);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User ID to exclude:', user._id.toString());

    // Fetch posts
    const posts = await postDb
      .collection('content')
      .aggregate([
        { $match: { userId: { $ne: user._id.toString() } } },
        { $sort: { time: -1 } },
        {
          $lookup: {
            from: 'users',
            let: { userId: { $toObjectId: '$userId' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$userId'] } } }
            ],
            as: 'userDetails',
          },
        },
        { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            text: 1,
            filename: 1,
            time: 1,
            email: { $ifNull: ['$userDetails.email', null] },
          },
        },
      ])
      .toArray();

    console.log('Posts:', posts);

    const contents = await fetchContentWithCode(posts);
    console.log('Contents:', contents);

    res.status(200).json({ contents });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Error fetching posts', details: err.message });
  }
});


// POST /post route to upload a post (authenticate the token)
router.post('/post',authenticateToken, upload.single('file'), async (req, res) => {
  try {

    const { email, text, code, language } = JSON.parse(req.body.data);
    
    //const email='bsse1@iit.du.ac.bd';
    // Fetch user details from authentication service using token
    const user = await fetchUserFromAuthService(email);
    console.log(user);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let filename = null;

    if (req.file) {
      filename = req.file.originalname;
      await uploadToMinIO(filename, req.file.buffer);
    } else if (code) {
      filename = generateFilename(language, user._id);
      await uploadToMinIO(filename, code);
    }

    const content = {
      userId: user._id,
      text,
      filename,
      time: new Date(),
    };
    // Ensure the connection is valid
    console.log('Database connection status:', postDb ? 'Connected' : 'Not connected');
    console.log('Inserting content:', content);  // Log content object


    // Access the posts collection from the posts DB
    const result = await postDb.collection('content').insertOne(content);
    updateNotifications(user._id, result.insertedId);
    res.status(201).json({ message: 'Content uploaded successfully', postId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Error uploading post', err: err.message || err });
  }
});

// Helper functions (same as before)
async function fetchContentWithCode(posts) {
  return Promise.all(
    posts.map(async post => {
      if (post.filename) {
        const code = await fetchCodeFromMinIO(post.filename);
        return { ...post, code };
      }
      return { ...post, code: null };
    })
  );
}


router.get('/fetch-file/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      if (!filename) return res.status(400).json({ error: 'Filename is required' });
  
      const fileContent = await fetchCodeFromMinIO(filename);
      if (!fileContent) return res.status(404).json({ error: 'File not found or error fetching file' });
  
      res.status(200).json({ filename, content: fileContent });
    } catch (err) {
      console.error('Error fetching file:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });


async function fetchCodeFromMinIO(filename) {
  return new Promise((resolve, reject) => {
    minioClient.getObject(bucketName, filename, (err, dataStream) => {
      if (err) return reject(err);

      let code = '';
      dataStream.on('data', chunk => {
        code += chunk.toString();
      });
      dataStream.on('end', () => resolve(code));
      dataStream.on('error', reject);
    });
  });
}

function generateFilename(language, userId) {
  const extensions = { C: '.c', 'C++': '.cpp', 'C#': '.cs', Java: '.java', Python: '.py', JavaScript: '.js' };
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
  return `${timestamp}_${userId}${extensions[language]}`;
}

async function uploadToMinIO(filename, code) {
  return new Promise((resolve, reject) => {
    minioClient.putObject(bucketName, filename, code, code.length, (err) => {
        if (err) {
            console.error('Error uploading to MinIO:', err);  // Log the MinIO error
            reject(err);
          }
          else {
            resolve();
          }
    });
  });
}


/*router.post('/fetch-content', async (req, res) => {
    const { postIds } = req.body;
    console.log("postids inside fetch-content");
    console.log(postIds);
  
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: 'Invalid or missing postIds' });
    }
  
    try {
      const db = postDb;
  
      // Fetch posts based on postIds
      const posts = await db.collection('content')
        .aggregate([
          { $match: { _id: { $in: postIds.map(id => new ObjectId(id)) } } },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: '$user' },
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              time: 1,
              filename: 1,
              userEmail: '$user.email',
            },
          },
        ])
        .toArray();
  
      res.status(200).json({ posts });
    } catch (err) {
      console.error('Error fetching content:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });*/

  router.post('/fetch-content', authenticateToken, async (req, res) => {
    const { postIds, userId } = req.body;  // Assuming userId is passed in the request body
    console.log("postids inside fetch-content");
    console.log(postIds);
    console.log(req.body);
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: 'Invalid or missing postIds' });
    }

    try {
      // Step 1: Fetch posts from the 'content' collection based on postIds
      const posts = await postDb.collection('content')
        .find({ _id: { $in: postIds.map(id => new ObjectId(id)) } })
        .toArray();

      console.log("Fetched posts:", posts);

      // Step 2: Fetch users from the authentication service
      const usersResponse = await axios.post('http://authentication:4001/fetch-all-users', {
        excludeUserId: userId  // Assuming this API requires the userId to exclude
      });

      console.log('Users fetched from authentication service:', usersResponse.data);
      const users = usersResponse.data.users || [];

      console.log("Fetched users:", users);

      // Step 3: Merge posts with users
      const postsWithUserData = posts.map(post => {
        // Find user for the current post
        const user = users.find(u => u._id === post.userId);
        
        return {
          ...post,
          userEmail: user ? user.email : 'No Email',  // Handle missing email
        };
      });

      console.log("Posts with merged user data:", postsWithUserData);

      // Step 4: Return the merged posts with user information
      res.status(200).json({ posts: postsWithUserData });
    } catch (err) {
      console.error('Error fetching content:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
});


  // Function to update notifications using Notification Service and Authentication Service
  async function updateNotifications(userId, postId) {
    try {
      // Fetch all users except the one who created the post
      const authResponse = await axios.post('http://authentication:4001/fetch-user', {
        userId
      });
  
      if (!authResponse.data || !authResponse.data.user) {
        throw new Error('Failed to fetch users from Authentication Service');
      }
  
      const usersResponse = await axios.post('http://authentication:4001/fetch-all-users', {
        excludeUserId: userId // Assuming such an API exists
      });
  
      const users = usersResponse.data.users || [];
  
      await Promise.all(
        users.map(async user => {
          const notificationResponse = await axios.post(
            'http://notification:4003/fetch-notifications',
            { userId: user._id }
          );
  
          const notifications = notificationResponse.data.notifications || [];
          const postIds = notifications.postIds || [];
  
          if (!postIds.includes(postId.toString())) {
            postIds.unshift(postId.toString());
            if (postIds.length > 10) postIds.pop();
  
            await axios.post('http://notification:4003/update-notifications', {
              userId: user._id,
              postIds
            });
          }
        })
      );
    } catch (err) {
      console.error('Error updating notifications:', err.message);
    }
  }
  

module.exports = router;
