const { Redis } = require('@upstash/redis');
require('dotenv').config();

let redis;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log("Upstash Redis connection configured successfully.");
  } catch (err) {
    console.error("Failed to initialize Upstash Redis:", err.message);
  }
}

// Fallback in-memory cache if Upstash is not configured or fails
if (!redis) {
  console.warn("Upstash Redis credentials missing or failed to load. Falling back to in-memory caching.");
  const memoryCache = new Map();
  redis = {
    get: async (key) => {
      const entry = memoryCache.get(key);
      if (!entry) return null;
      if (entry.expiry && entry.expiry < Date.now()) {
        memoryCache.delete(key);
        return null;
      }
      return entry.value;
    },
    set: async (key, value, options) => {
      let expiry = null;
      if (options && options.ex) {
        expiry = Date.now() + options.ex * 1000;
      }
      memoryCache.set(key, { value, expiry });
      return 'OK';
    },
    del: async (key) => {
      const existed = memoryCache.has(key);
      memoryCache.delete(key);
      return existed ? 1 : 0;
    }
  };
}

module.exports = redis;
