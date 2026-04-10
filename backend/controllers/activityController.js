const asyncHandler = require('express-async-handler');
const { getFirestore } = require('firebase-admin/firestore');

/**
 * @desc    Track user activity
 * @route   POST /api/v1/activity
 * @access  Public / Private
 */
const logActivity = asyncHandler(async (req, res) => {
  const { productId, action, category } = req.body;
  const userId = req.user?.uid || 'anonymous'; // Support logged-in and guest users

  if (!productId || !action) {
    res.status(400);
    throw new Error('Product ID and action are required');
  }

  const db = getFirestore();
  const activityData = {
    userId,
    productId,
    action, // 'view', 'click', 'cart', 'purchase'
    category: category || 'unknown',
    timestamp: Date.now(),
  };

  // Store in users/{userId}/activity collection
  await db.collection('users').doc(userId).collection('activity').add(activityData);

  res.status(200).json({ success: true, message: 'Activity logged' });
});

module.exports = {
  logActivity,
};
