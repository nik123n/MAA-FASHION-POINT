const asyncHandler = require('express-async-handler');
const admin = require('../config/firebaseAdmin');
const { getFirestore } = require('firebase-admin/firestore');
const { deleteStoredImage, mapUploadedFiles } = require('../config/cloudinary');
const redisClient = require('../config/redis');

const CATEGORY_OPTIONS = [
  '3 Piece', '3 Piece Pair', 'Short Top', '2 Piece', 'Tunic Top',
  'Cotton Tunic Top', 'Long Top', 'Cord Set', 'Plazo Pair',
  'Kurti Plaza Dupata', 'Kurti Pent Dupata', 'Cotton Straight Pent',
];

const getDb = () => {
  if (!admin) {
    const err = new Error('Firestore is not configured on the backend');
    err.statusCode = 503;
    throw err;
  }
  return getFirestore();
};

const nowIso = () => new Date().toISOString();

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

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  if (value === undefined || value === null || value === '') return fallback;
  return Boolean(value);
};

const toNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildSku = () => `MFP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const ensureProductShape = (id, product = {}) => {
  const sizes = Array.isArray(product.sizes)
    ? product.sizes.map((size) => ({
        size: size?.size || 'Free Size',
        stock: toNumber(size?.stock, 0),
      }))
    : [];

  const reviews = Array.isArray(product.reviews)
    ? product.reviews.map((review) => ({
        id: review.id || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        user: review.user,
        name: review.name || 'Anonymous',
        rating: toNumber(review.rating, 0),
        comment: review.comment || '',
        createdAt: review.createdAt || nowIso(),
      }))
    : [];

  const price = toNumber(product.price, 0);
  const discountedPriceRaw = product.discountedPrice;
  const discountedPrice = discountedPriceRaw === undefined || discountedPriceRaw === null || discountedPriceRaw === ''
    ? null
    : toNumber(discountedPriceRaw, 0);

  const totalStock = sizes.reduce((sum, size) => sum + toNumber(size.stock, 0), 0);
  const rating = reviews.length
    ? reviews.reduce((sum, review) => sum + toNumber(review.rating, 0), 0) / reviews.length
    : toNumber(product.rating, 0);

  const images = Array.isArray(product.images) 
    ? product.images.map(img => typeof img === 'string' ? { url: img } : img)
    : [];

  return {
    _id: id,
    name: product.name || '',
    description: product.description || '',
    price,
    discountedPrice,
    discountPercent: discountedPrice && price ? Math.round(((price - discountedPrice) / price) * 100) : 0,
    category: product.category || '3 Piece',
    subcategory: product.subcategory || '',
    brand: product.brand || 'Saanjh',
    images,
    sizes,
    colors: Array.isArray(product.colors) ? product.colors : [],
    fabric: product.fabric || '',
    occasion: Array.isArray(product.occasion) ? product.occasion : [],
    tags: Array.isArray(product.tags) ? product.tags : [],
    reviews,
    rating: Number(rating.toFixed(1)),
    numReviews: reviews.length,
    isFeatured: toBoolean(product.isFeatured, false),
    isNewArrival: toBoolean(product.isNewArrival, false),
    isTrending: toBoolean(product.isTrending, false),
    totalStock,
    sold: toNumber(product.sold, 0),
    sku: product.sku || buildSku(),
    weight: toNumber(product.weight, 0),
    returnPolicy: product.returnPolicy || '7 days easy return',
    careInstructions: Array.isArray(product.careInstructions) ? product.careInstructions : [],
    viewCount: toNumber(product.viewCount, 0),
    createdAt: product.createdAt || nowIso(),
    updatedAt: product.updatedAt || nowIso(),
  };
};

const normalizeProductInput = (input = {}, existing = {}) => {
  const payload = { ...existing, ...input };

  payload.price = toNumber(payload.price, toNumber(existing.price, 0));
  payload.discountedPrice = payload.discountedPrice === '' || payload.discountedPrice === undefined
    ? existing.discountedPrice ?? null
    : payload.discountedPrice;
  payload.sizes = parseJsonField(payload.sizes, existing.sizes || []);
  payload.colors = parseJsonField(payload.colors, existing.colors || []);
  payload.occasion = parseJsonField(payload.occasion, existing.occasion || []);
  payload.tags = typeof payload.tags === 'string'
    ? payload.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : Array.isArray(payload.tags) ? payload.tags : (existing.tags || []);
  payload.isFeatured = toBoolean(payload.isFeatured, existing.isFeatured || false);
  payload.isNewArrival = toBoolean(payload.isNewArrival, existing.isNewArrival || false);
  payload.isTrending = toBoolean(payload.isTrending, existing.isTrending || false);
  payload.brand = payload.brand || existing.brand || 'Saanjh';
  payload.fabric = payload.fabric || existing.fabric || '';
  payload.category = payload.category || existing.category || '3 Piece';
  payload.name = payload.name || existing.name || '';
  payload.description = payload.description || existing.description || '';

  return payload;
};

const getProductDoc = async (id) => {
  const db = getDb();
  const doc = await db.collection('products').doc(id).get();
  if (!doc.exists) return null;
  return ensureProductShape(doc.id, doc.data());
};

const sortProducts = (products, sort) => {
  const items = [...products];
  switch (sort) {
    case 'price-asc':
      return items.sort((a, b) => (a.discountedPrice || a.price) - (b.discountedPrice || b.price));
    case 'price-desc':
      return items.sort((a, b) => (b.discountedPrice || b.price) - (a.discountedPrice || a.price));
    case 'rating':
      return items.sort((a, b) => b.rating - a.rating || b.sold - a.sold);
    case 'popular':
      return items.sort((a, b) => b.sold - a.sold || b.rating - a.rating);
    case 'newest':
    default:
      return items.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }
};

const getProducts = asyncHandler(async (req, res) => {
  const {
    category, minPrice, maxPrice, size, rating, sort,
    search, page = 1, limit = 12, isFeatured, isNewArrival, isTrending,
  } = req.query;

  // Attempt to hit Redis Cache for standard pages (without complex searches)
  const isCachableRequest = !search && !minPrice && !maxPrice && !size && !rating;
  const cacheKey = isCachableRequest ? `products:${category || 'all'}:${sort || 'newest'}:${page}:${limit}:${isFeatured}:${isNewArrival}:${isTrending}` : null;

  if (cacheKey && redisClient) {
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.json({ success: true, ...cachedData, cached: true });
      }
    } catch (_) {
      // Ignore cache errors
    }
  }

  const db = getDb();
  let query = db.collection('products');

  if (category) {
    const selected = String(category).split(',').map((item) => item.trim());
    if (selected.length === 1) {
      query = query.where('category', '==', selected[0]);
    } else if (selected.length > 1) {
      query = query.where('category', 'in', selected);
    }
  }

  if (isFeatured === 'true') query = query.where('isFeatured', '==', true);
  if (isNewArrival === 'true') query = query.where('isNewArrival', '==', true);
  if (isTrending === 'true') query = query.where('isTrending', '==', true);

  const snapshot = await query.limit(1000).get();
  let products = snapshot.docs.map((doc) => ensureProductShape(doc.id, doc.data()));

  if (search) {
    const q = String(search).toLowerCase();
    products = products.filter((product) =>
      [product.name, product.description, product.category, product.fabric, product.brand, ...(product.tags || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }

  if (minPrice || maxPrice) {
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Number.POSITIVE_INFINITY;
    products = products.filter((product) => {
      const activePrice = product.discountedPrice || product.price;
      return activePrice >= min && activePrice <= max;
    });
  }

  if (size) {
    const selectedSizes = String(size).split(',').map((item) => item.trim());
    products = products.filter((product) =>
      (product.sizes || []).some((item) => selectedSizes.includes(item.size))
    );
  }

  if (rating) {
    products = products.filter((product) => product.rating >= Number(rating));
  }

  products = sortProducts(products, sort);

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 12;
  const total = products.length;
  const start = (pageNumber - 1) * limitNumber;
  const paginatedProducts = products.slice(start, start + limitNumber);

  const responsePayload = {
    products: paginatedProducts,
    pagination: { page: pageNumber, limit: limitNumber, total, pages: Math.ceil(total / limitNumber) }
  };

  if (cacheKey && redisClient) {
    try {
      await redisClient.set(cacheKey, JSON.stringify(responsePayload), { ex: 300 }); // Cache 5 mins
    } catch (_) {}
  }

console.log('Products response:', paginatedProducts.map(p => ({id: p._id, hasImages: !!p.images?.length})));

// Log empty images products
const emptyImageProducts = paginatedProducts.filter(p => !p.images?.length);
if (emptyImageProducts.length > 0) {
  console.log('⚠️ Products without images:', emptyImageProducts.map(p => p._id));
}

res.json({ success: true, ...responsePayload });
});

const getProduct = asyncHandler(async (req, res) => {
  const db = getDb();
  const product = await getProductDoc(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await db.collection('products').doc(req.params.id).set({
    viewCount: (product.viewCount || 0) + 1,
    updatedAt: nowIso(),
  }, { merge: true });

  res.json({ success: true, product: { ...product, viewCount: (product.viewCount || 0) + 1 } });
});

const getRecommendations = asyncHandler(async (req, res) => {
  const db = getDb();
  const product = await getProductDoc(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const priceMin = (product.discountedPrice || product.price) * 0.5;
  const priceMax = (product.discountedPrice || product.price) * 2;

  let query = db.collection('products');
  if (product.category) query = query.where('category', '==', product.category);

  const snapshot = await query.limit(200).get();

  const recommendations = snapshot.docs
    .map(doc => ensureProductShape(doc.id, doc.data()))
    .filter((item) => item._id !== product._id)
    .filter((item) => {
      const activePrice = item.discountedPrice || item.price;
      const categoryMatch = item.category === product.category;
      const occasionMatch = (item.occasion || []).some((tag) => (product.occasion || []).includes(tag));
      const tagMatch = (item.tags || []).some((tag) => (product.tags || []).includes(tag));
      return activePrice >= priceMin && activePrice <= priceMax && (categoryMatch || occasionMatch || tagMatch);
    })
    .sort((a, b) => b.rating - a.rating || b.sold - a.sold)
    .slice(0, 8);

  res.json({ success: true, recommendations });
});

const autocomplete = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || String(q).length < 2) return res.json({ success: true, suggestions: [] });

  const queryText = String(q).toLowerCase();
  const db = getDb();
  const snapshot = await db.collection('products').limit(300).get(); // constrained set to prevent mem spike
  
  const products = snapshot.docs
    .map(doc => ({ _id: doc.id, ...doc.data() }))
    .filter((product) =>
      [product.name, product.description, ...(product.tags || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(queryText))
    )
    .slice(0, 8)
    .map(({ _id, name, category, price, discountedPrice, images }) => ({
      _id, name, category, price, discountedPrice, 
      images: Array.isArray(images) ? images.map(img => typeof img === 'string' ? { url: img } : img) : [],
    }));

  const categories = CATEGORY_OPTIONS.filter((item) => item.toLowerCase().includes(queryText));
  res.json({ success: true, products, categories });
});

const addReview = asyncHandler(async (req, res) => {
  const db = getDb();
  const product = await getProductDoc(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyReviewed = (product.reviews || []).find((review) => review.user === req.user._id);
  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  const reviews = [
    ...(product.reviews || []),
    {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      user: req.user._id,
      name: req.user.name,
      rating: Number(req.body.rating),
      comment: req.body.comment || '',
      createdAt: nowIso(),
    },
  ];

  const nextProduct = ensureProductShape(req.params.id, {
    ...product,
    reviews,
    updatedAt: nowIso(),
  });

  await db.collection('products').doc(req.params.id).set(nextProduct);
  res.status(201).json({ success: true, message: 'Review added' });
});

const createProduct = asyncHandler(async (req, res) => {
  const db = getDb();
  const productData = normalizeProductInput({ ...req.body });

  if (req.files?.length > 0) {
    productData.images = mapUploadedFiles(req, req.files);
  } else if (productData.imageUrls) {
    productData.images = parseImageUrls(productData.imageUrls);
  } else {
    productData.images = [];
  }
  delete productData.imageUrls;

  const docRef = db.collection('products').doc();
  const product = ensureProductShape(docRef.id, {
    ...productData,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  await docRef.set(product);
  res.status(201).json({ success: true, product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const db = getDb();
  const existing = await getProductDoc(req.params.id);

  if (!existing) {
    res.status(404);
    throw new Error('Product not found');
  }

  const updateData = normalizeProductInput({ ...req.body }, existing);

  if (req.files?.length > 0) {
    const newImages = mapUploadedFiles(req, req.files);
    updateData.images = [...(existing.images || []), ...newImages];
  } else if (updateData.imageUrls) {
    updateData.images = parseImageUrls(updateData.imageUrls);
  } else {
    updateData.images = existing.images || [];
  }
  delete updateData.imageUrls;

  const updatedProduct = ensureProductShape(req.params.id, {
    ...existing,
    ...updateData,
    reviews: existing.reviews || [],
    createdAt: existing.createdAt,
    updatedAt: nowIso(),
  });

  await db.collection('products').doc(req.params.id).set(updatedProduct);
  res.json({ success: true, product: updatedProduct });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const db = getDb();
  const product = await getProductDoc(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Make cloud deletions non-blocking
  Promise.all((product.images || []).map((img) => deleteStoredImage(img).catch(console.error)));
  
  await db.collection('products').doc(req.params.id).delete();
  res.json({ success: true, message: 'Product deleted' });
});

const getHomeProducts = asyncHandler(async (req, res) => {
  if (redisClient) {
    try {
      const cachedHome = await redisClient.get('home_products');
      if (cachedHome) {
        return res.json({ success: true, ...cachedHome, cached: true });
      }
    } catch (_) {}
  }

  const db = getDb();
  const snapshot = await db.collection('products').limit(1000).get();
  const products = snapshot.docs.map((doc) => ensureProductShape(doc.id, doc.data()));

  const featured = sortProducts(
    products.filter((product) => product.isFeatured),
    'newest'
  ).slice(0, 8);

  const newArrivals = sortProducts(
    products.filter((product) => product.isNewArrival),
    'newest'
  ).slice(0, 8);

  const trending = [...products]
    .filter((product) => product.isTrending)
    .sort((a, b) => b.sold - a.sold || String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 8);

  const categoryMap = new Map();
  for (const product of products) {
    if (!product.category) continue;
    const current = categoryMap.get(product.category) || {
      _id: product.category,
      count: 0,
      image: product.images || [],
    };
    current.count += 1;
    if ((!current.image || current.image.length === 0) && product.images?.length) {
      current.image = product.images;
    }
    categoryMap.set(product.category, current);
  }

  const responsePayload = {
    featured,
    newArrivals,
    trending,
    categories: [...categoryMap.values()],
  };

  if (redisClient) {
    try {
      await redisClient.set('home_products', JSON.stringify(responsePayload), { ex: 300 });
    } catch (_) {}
  }

  res.json({
    success: true,
    ...responsePayload
  });
});

module.exports = {
  getProducts,
  getProduct,
  getRecommendations,
  autocomplete,
  addReview,
  createProduct,
  updateProduct,
  deleteProduct,
  getHomeProducts,
};
