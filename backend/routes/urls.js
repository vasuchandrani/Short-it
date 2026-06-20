const express = require('express');
const router = express.Router();
const db = require('../db');
const redis = require('../redis');
const { authenticateToken } = require('../middleware/auth');

// Helper to normalize URL for matching
function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    // Strip trailing slashes and normalize host/pathname
    let normalized = parsed.origin + parsed.pathname.replace(/\/+$/, '');
    if (parsed.search) normalized += parsed.search;
    if (parsed.hash) normalized += parsed.hash;
    return normalized;
  } catch (e) {
    // If URL parsing fails, return stripped string
    return url.trim().replace(/\/+$/, '');
  }
}

// 1. Shorten a URL
router.post('/', authenticateToken, async (req, res) => {
  const { originalUrl, key } = req.body;

  if (!originalUrl || !key) {
    return res.status(400).json({ message: 'Original URL and custom key are required.' });
  }

  // Validate custom key format (alphanumeric, dash, underscore)
  const keyRegex = /^[a-zA-Z0-9_-]+$/;
  if (!keyRegex.test(key)) {
    return res.status(400).json({ message: 'Custom key can only contain letters, numbers, hyphens, and underscores.' });
  }

  // Validate URL format
  try {
    new URL(originalUrl);
  } catch (err) {
    return res.status(400).json({ message: 'Please provide a valid absolute URL (e.g. https://google.com).' });
  }

  const normalizedOriginalUrl = normalizeUrl(originalUrl);

  try {
    // A. Validate Key uniqueness
    const keyCheck = await db.query('SELECT * FROM short_urls WHERE key = $1', [key]);
    if (keyCheck.rows.length > 0) {
      return res.status(400).json({ message: 'This key is already taken. Please choose another.' });
    }

    // B. Validate URL duplication for this user
    // "Same user cannot shorten the same URL twice."
    // Check if the user already shortened this original URL.
    const urlCheck = await db.query(
      'SELECT * FROM short_urls WHERE user_id = $1 AND (original_url = $2 OR original_url = $3)',
      [req.user.id, originalUrl, normalizedOriginalUrl]
    );
    if (urlCheck.rows.length > 0) {
      return res.status(400).json({ message: 'You have already shortened this URL. Check your profile.' });
    }

    // C. Save short URL details
    const insertRes = await db.query(
      'INSERT INTO short_urls (user_id, original_url, key) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, originalUrl, key]
    );

    const newUrl = insertRes.rows[0];

    // Lazy load or cache immediately. Let's seed Redis cache
    // Cache for 24 hours (86400 seconds)
    await redis.set(`url:${key}`, originalUrl, { ex: 86400 });

    const host = req.get('host');
    const protocol = req.protocol;
    const shortUrl = `${protocol}://${host}/${key}`;

    res.status(201).json({
      ...newUrl,
      shortUrl
    });
  } catch (err) {
    console.error('Error shortening URL:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 2. List all URLs for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, original_url, key, created_at FROM short_urls WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    const host = req.get('host');
    const protocol = req.protocol;

    const urls = result.rows.map(row => ({
      ...row,
      shortUrl: `${protocol}://${host}/${row.key}`
    }));

    res.json(urls);
  } catch (err) {
    console.error('Error fetching user URLs:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
