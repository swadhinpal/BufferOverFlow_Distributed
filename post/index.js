const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const post = require('./post');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(post);
  

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
