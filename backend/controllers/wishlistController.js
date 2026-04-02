const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc  Toggle wishlist item
// @route POST /api/wishlist/toggle
const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const user = await User.findById(req.user._id);

  const idx = user.wishlist.indexOf(productId);
  if (idx > -1) {
    user.wishlist.splice(idx, 1);
  } else {
    user.wishlist.push(productId);
  }
  await user.save();
  res.json({ success: true, wishlist: user.wishlist, added: idx === -1 });
});

// @desc  Get wishlist
// @route GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    'wishlist',
    'name images price discountedPrice category rating'
  );
  res.json({ success: true, wishlist: user.wishlist });
});

module.exports = { toggleWishlist, getWishlist };
