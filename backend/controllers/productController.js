const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const { deleteStoredImage, mapUploadedFiles } = require('../config/cloudinary');

const parseJsonField = (value, fallback) => {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parseImageUrls = (value) => {
  const parsed = parseJsonField(value, []);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => (typeof item === 'string' ? item.trim() : item?.url?.trim()))
    .filter(Boolean)
    .map((url) => ({ url }));
};

// @desc  Get all products with filters
// @route GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const {
    category, minPrice, maxPrice, size, rating, sort,
    search, page = 1, limit = 12, isFeatured, isNewArrival, isTrending,
  } = req.query;

  const query = {};

  if (search) query.$text = { $search: search };
  if (category) query.category = { $in: category.split(',') };
  if (minPrice || maxPrice) {
    query.$or = [
      { discountedPrice: { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) } },
      {
        discountedPrice: { $exists: false },
        price: { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) },
      },
    ];
  }
  if (size) query['sizes.size'] = { $in: size.split(',') };
  if (rating) query.rating = { $gte: +rating };
  if (isFeatured === 'true') query.isFeatured = true;
  if (isNewArrival === 'true') query.isNewArrival = true;
  if (isTrending === 'true') query.isTrending = true;

  const sortMap = {
    'price-asc': { 'discountedPrice': 1, price: 1 },
    'price-desc': { 'discountedPrice': -1, price: -1 },
    'rating': { rating: -1 },
    'newest': { createdAt: -1 },
    'popular': { sold: -1 },
  };
  const sortBy = sortMap[sort] || { createdAt: -1 };

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(query).sort(sortBy).skip(skip).limit(+limit).select('-embedding'),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    products,
    pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc  Get single product
// @route GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .select('-embedding')
    .populate('reviews.user', 'name avatar');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Increment view count
  await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

  res.json({ success: true, product });
});

// @desc  AI-based product recommendations
// @route GET /api/products/:id/recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Multi-signal recommendation: same category + occasion + price range
  const priceMin = (product.discountedPrice || product.price) * 0.5;
  const priceMax = (product.discountedPrice || product.price) * 2;

  const recommendations = await Product.find({
    _id: { $ne: product._id },
    $or: [
      { category: product.category },
      { occasion: { $in: product.occasion } },
      { tags: { $in: product.tags } },
    ],
    $and: [
      {
        $or: [
          { discountedPrice: { $gte: priceMin, $lte: priceMax } },
          { price: { $gte: priceMin, $lte: priceMax } },
        ],
      },
    ],
  })
    .select('-embedding')
    .sort({ rating: -1, sold: -1 })
    .limit(8);

  res.json({ success: true, recommendations });
});

// @desc  Search autocomplete
// @route GET /api/products/search/autocomplete
const autocomplete = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ success: true, suggestions: [] });

  const products = await Product.find(
    { $text: { $search: q } },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(8)
    .select('name category price discountedPrice images');

  // Also suggest matching categories
  const categories = ['3 Piece', '3 Piece Pair', 'Short Top', '2 Piece', 'Tunic Top', 'Cotton Tunic Top', 'Long Top', 'Cord Set', 'Plazo Pair', 'Kurti Plaza Dupata', 'Kurti Pent Dupata', 'Cotton Straight Pent']
    .filter((c) => c.toLowerCase().includes(q.toLowerCase()));

  res.json({ success: true, products, categories });
});

// @desc  Add review
// @route POST /api/products/:id/reviews
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  product.reviews.push({ user: req.user._id, name: req.user.name, rating: +rating, comment });
  product.updateRating();
  await product.save();
  res.status(201).json({ success: true, message: 'Review added' });
});

// @desc  Create product (Admin)
// @route POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const productData = { ...req.body };

  if (req.files?.length > 0) {
    productData.images = mapUploadedFiles(req, req.files);
  } else if (productData.imageUrls) {
    productData.images = parseImageUrls(productData.imageUrls);
  }

  productData.sizes = parseJsonField(productData.sizes, []);
  productData.colors = parseJsonField(productData.colors, []);
  productData.occasion = parseJsonField(productData.occasion, []);
  productData.tags = typeof productData.tags === 'string'
    ? productData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : Array.isArray(productData.tags) ? productData.tags : [];
  delete productData.imageUrls;

  const product = await Product.create(productData);
  res.status(201).json({ success: true, product });
});

// @desc  Update product (Admin)
// @route PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const updateData = { ...req.body };
  if (req.files?.length > 0) {
    const newImages = mapUploadedFiles(req, req.files);
    updateData.images = [...(product.images || []), ...newImages];
  } else if (updateData.imageUrls) {
    updateData.images = parseImageUrls(updateData.imageUrls);
  }
  updateData.sizes = parseJsonField(updateData.sizes, product.sizes || []);
  updateData.colors = parseJsonField(updateData.colors, product.colors || []);
  updateData.occasion = parseJsonField(updateData.occasion, product.occasion || []);
  updateData.tags = typeof updateData.tags === 'string'
    ? updateData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : Array.isArray(updateData.tags) ? updateData.tags : product.tags;
  delete updateData.imageUrls;

  const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, product: updated });
});

// @desc  Delete product (Admin)
// @route DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Delete images from Cloudinary
  await Promise.all((product.images || []).map((img) => deleteStoredImage(img)));
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

// @desc  Get featured / home page products
// @route GET /api/products/home
const getHomeProducts = asyncHandler(async (req, res) => {
  const [featured, newArrivals, trending, categories] = await Promise.all([
    Product.find({ isFeatured: true }).limit(8).select('-embedding'),
    Product.find({ isNewArrival: true }).sort({ createdAt: -1 }).limit(8).select('-embedding'),
    Product.find({ isTrending: true }).sort({ sold: -1 }).limit(8).select('-embedding'),
    Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, image: { $first: '$images' } } },
    ]),
  ]);

  res.json({ success: true, featured, newArrivals, trending, categories });
});

module.exports = {
  getProducts, getProduct, getRecommendations, autocomplete,
  addReview, createProduct, updateProduct, deleteProduct, getHomeProducts,
};
