const express = require('express');
const router = express.Router();
const db = require('../db');
const redis = require('../redis');
require('dotenv').config();

router.get('/:key', async (req, res, next) => {
  const { key } = req.params;

  // Bypass short url lookup for known React SPA paths
  const frontendRoutes = ['login', 'auth-request', 'dashboard', 'profile', 'admin', '404', 'forgot-password', 'reset-password'];
  if (frontendRoutes.includes(key)) {
    return next();
  }

  // Skip standard routes and files
  if (
    key === 'api' || 
    key === 'favicon.ico' || 
    key === 'robots.txt' || 
    key.startsWith('assets')
  ) {
    return res.status(404).send('Not Found');
  }

  try {
    // 1. Check Redis cache first
    let originalUrl = await redis.get(`url:${key}`);
    
    if (originalUrl) {
      console.log(`Cache Hit: Redis found mapping for "${key}" -> "${originalUrl}"`);
      return res.redirect(originalUrl);
    }

    console.log(`Cache Miss: Checking database for key "${key}"`);

    // 2. Fetch from database
    const result = await db.query('SELECT original_url FROM short_urls WHERE key = $1', [key]);
    
    if (result.rows.length > 0) {
      originalUrl = result.rows[0].original_url;
      console.log(`Database Found: key "${key}" -> "${originalUrl}"`);

      // 3. Store result in Redis (Cache for 24 hours - 86400 seconds)
      await redis.set(`url:${key}`, originalUrl, { ex: 86400 });
      console.log(`Cache Set: Saved mapping for "${key}" in Redis`);

      // 4. Redirect
      return res.redirect(originalUrl);
    }

    // 5. Redirect to frontend 404 page if no matching short key exists
    console.log(`Key not found: "${key}". Redirecting to 404 page.`);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/404`);
  } catch (err) {
    console.error('Redirection error:', err.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/404`);
  }
});

module.exports = router;
