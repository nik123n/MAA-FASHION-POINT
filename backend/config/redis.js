const { Redis } = require('@upstash/redis');

// Fallback empty object if URLs are missing so the server doesn't crash before setup
const redisClient = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

if (!redisClient) {
  console.warn('⚠️ Redis is not configured. UPSTASH_REDIS_REST_URL is missing.');
}

module.exports = redisClient;
