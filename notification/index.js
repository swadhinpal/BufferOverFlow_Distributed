const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const notification = require('./notification');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(notification);
  

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
