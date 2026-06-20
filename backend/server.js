const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./initDb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Short-it API is running' });
});

// Mount API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/urls', require('./routes/urls'));

// Mount redirection wildcard route (must be last)
app.use('/', require('./routes/redirect'));

// Initialize DB and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database. Server cannot start.', err);
    process.exit(1);
  });
