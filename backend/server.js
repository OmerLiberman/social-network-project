const express = require('express');
const connectDB = require('./config/db');

const app = express();

connectDB();

app.use(express.json({extended: false}));

app.get('/', (req, res) => {
  res.send('API running!');
})

// Routes
app.use('/api/users', require('./routes/api/users'));

// Port
const PORT = 3000;

