const redisClient = require('../config/redis');

const deleteKeys = async (keys = []) => {
  if (!redisClient || keys.length === 0) return;

  try {
    await redisClient.del(...keys);
  } catch (error) {
    console.warn('[Redis] Failed to delete cache keys:', error.message);
  }
};

const clearProductCaches = async () => {
  if (!redisClient) return;

  const keys = ['home_products'];

  try {
    const productKeys = await redisClient.keys('products:*');
    if (Array.isArray(productKeys) && productKeys.length > 0) {
      keys.push(...productKeys);
    }
  } catch (error) {
    console.warn('[Redis] Failed to list product cache keys:', error.message);
  }

  await deleteKeys([...new Set(keys)]);
};

module.exports = {
  clearProductCaches,
};
