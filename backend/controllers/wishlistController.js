const asyncHandler = require('express-async-handler');
const { getFirestore } = require('firebase-admin/firestore');

const getDb = () => getFirestore();

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Toggle wishlist item
// @route POST /api/wishlist/toggle
// ─────────────────────────────────────────────────────────────────────────────
const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    res.status(400);
    throw new Error('productId is required');
  }

  const db = getDb();
  const ref = db.collection('users').doc(req.user._id);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('User not found');
  }

  const user = snap.data();
  const wishlist = Array.isArray(user.wishlist) ? [...user.wishlist] : [];

  const idx = wishlist.indexOf(productId);
  let added;
  if (idx > -1) {
    wishlist.splice(idx, 1);
    added = false;
  } else {
    wishlist.push(productId);
    added = true;
  }

  await ref.update({ wishlist, updatedAt: new Date().toISOString() });
  res.json({ success: true, wishlist, added });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get wishlist with product details
// @route GET /api/wishlist
// ─────────────────────────────────────────────────────────────────────────────
const getWishlist = asyncHandler(async (req, res) => {
  const db = getDb();
  const userSnap = await db.collection('users').doc(req.user._id).get();

  if (!userSnap.exists) {
    return res.json({ success: true, wishlist: [] });
  }

  const wishlistIds = Array.isArray(userSnap.data().wishlist) ? userSnap.data().wishlist : [];

  if (wishlistIds.length === 0) {
    return res.json({ success: true, wishlist: [] });
  }

  // Fetch all products in parallel (Firestore limit: 10 per in-query, so chunk if needed)
  const chunks = [];
  for (let i = 0; i < wishlistIds.length; i += 10) {
    chunks.push(wishlistIds.slice(i, i + 10));
  }

  const productDocs = await Promise.all(
    chunks.map((chunk) =>
      db.collection('products').where('__name__', 'in', chunk).get()
    )
  );

  const wishlist = productDocs.flatMap((snap) =>
    snap.docs.map((d) => ({
      _id: d.id,
      name: d.data().name,
      images: d.data().images || [],
      price: d.data().price,
      discountedPrice: d.data().discountedPrice,
      category: d.data().category,
      rating: d.data().rating,
    }))
  );

  res.json({ success: true, wishlist });
});

module.exports = { toggleWishlist, getWishlist };
