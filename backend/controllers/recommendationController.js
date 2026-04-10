const asyncHandler = require('express-async-handler');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');
const Redis = require('@upstash/redis').Redis;

let redis;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * @desc    Get product recommendations for a user
 * @route   GET /api/v1/recommendations
 * @access  Public / Private
 */
const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user?.uid || req.query.userId || 'anonymous';
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  
  const cacheKey = `recommendations:${userId}:${page}:${limit}`;
  
  // 1. Check Redis Cache
  if (redis) {
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json({ success: true, fromCache: true, data: cachedData });
      }
    } catch (err) {
      console.error('Redis cache error:', err);
    }
  }

  let productIds = [];
  const db = getFirestore();

  try {
    // 2. Call Python ML Service (default port 8000)
    const pythonUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
    const response = await axios.get(`${pythonUrl}/recommendations?userId=${userId}&limit=${limit}&page=${page}`);
    
    if (response.data && response.data.recommendations) {
      productIds = response.data.recommendations;
    }
  } catch (err) {
    console.error('Failed to get recommendations from ML service, falling back to trending:', err.message);
    // Cold start / Fallback: get random or newest products
  }

  let products = [];
  
  // 3. Fetch products from Firestore
  if (productIds.length > 0) {
    const productsRef = db.collection('products');
    
    // Firestore 'in' query supports max 10 elements. Chunk it if needed.
    const chunks = [];
    for (let i = 0; i < productIds.length; i += 10) {
      chunks.push(productIds.slice(i, i + 10));
    }
    
    for (const chunk of chunks) {
      const snapshot = await productsRef.where('__name__', 'in', chunk).get();
      snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
      });
    }
  } else {
    // Fallback if ML service failed or returned empty: get trending/new products
    const snapshot = await db.collection('products').orderBy('createdAt', 'desc').offset(skip).limit(limit).get();
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
  }

  // 4. Cache response in Redis for 1 hour (3600 seconds)
  if (redis && products.length > 0) {
    try {
      await redis.setx(cacheKey, 3600, products); 
    } catch(err) {
      // ignore
    }
  }

  res.status(200).json({
    success: true,
    data: products
  });
});

module.exports = {
  getRecommendations,
};
