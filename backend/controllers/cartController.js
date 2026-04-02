const asyncHandler = require('express-async-handler');
const { randomUUID } = require('crypto');
const admin = require('../config/firebaseAdmin');
const { getFirestore } = require('firebase-admin/firestore');

const getDb = () => {
  if (!admin) {
    const err = new Error('Firestore is not configured on the backend');
    err.statusCode = 503;
    throw err;
  }
  return getFirestore();
};

const nowIso = () => new Date().toISOString();

const normalizeProduct = (id, product = {}) => ({
  _id: id,
  name: product.name || '',
  images: Array.isArray(product.images) ? product.images : [],
  price: Number(product.price || 0),
  discountedPrice: product.discountedPrice === null || product.discountedPrice === undefined || product.discountedPrice === ''
    ? null
    : Number(product.discountedPrice || 0),
  totalStock: Number(product.totalStock || 0),
  sizes: Array.isArray(product.sizes)
    ? product.sizes.map((size) => ({
        size: size?.size || 'Free Size',
        stock: Number(size?.stock || 0),
      }))
    : [],
  category: product.category || '',
  rating: Number(product.rating || 0),
  brand: product.brand || '',
});

const loadProduct = async (productId) => {
  const db = getDb();
  const snapshot = await db.collection('products').doc(productId).get();
  if (!snapshot.exists) return null;
  return normalizeProduct(snapshot.id, snapshot.data());
};

const loadCartDoc = async (userId) => {
  const db = getDb();
  const ref = db.collection('carts').doc(userId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return {
      ref,
      cart: {
        _id: userId,
        user: userId,
        items: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    };
  }

  const data = snapshot.data() || {};
  return {
    ref,
    cart: {
      _id: snapshot.id,
      user: data.user || userId,
      items: Array.isArray(data.items) ? data.items : [],
      createdAt: data.createdAt || nowIso(),
      updatedAt: data.updatedAt || nowIso(),
    },
  };
};

const hydrateCart = async (cart) => {
  const items = await Promise.all(
    (cart.items || []).map(async (item) => {
      const product = await loadProduct(item.productId);
      return {
        _id: item._id,
        productId: item.productId,
        product,
        quantity: Number(item.quantity || 0),
        size: item.size || '',
        color: item.color || '',
        price: Number(item.price || 0),
      };
    })
  );

  return {
    _id: cart._id,
    user: cart.user,
    items: items.filter((item) => item.product),
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

const saveCart = async (ref, cart) => {
  await ref.set({
    user: cart.user,
    items: cart.items,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  });
};

const getCart = asyncHandler(async (req, res) => {
  const { ref, cart } = await loadCartDoc(req.user._id);
  if (!cart.createdAt) cart.createdAt = nowIso();
  cart.updatedAt = cart.updatedAt || nowIso();
  await saveCart(ref, cart);
  const hydratedCart = await hydrateCart(cart);
  res.json({ success: true, cart: hydratedCart });
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, size, color = '' } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error('Product id is required');
  }

  const product = await loadProduct(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const requestedQty = Math.max(1, Number(quantity || 1));
  const sizeObj = (product.sizes || []).find((entry) => entry.size === size);
  if (!sizeObj || sizeObj.stock < requestedQty) {
    res.status(400);
    throw new Error('Selected size is out of stock');
  }

  const { ref, cart } = await loadCartDoc(req.user._id);
  const existingIdx = (cart.items || []).findIndex(
    (item) => item.productId === productId && item.size === size && (item.color || '') === color
  );

  const price = product.discountedPrice || product.price;

  if (existingIdx > -1) {
    const nextQty = Number(cart.items[existingIdx].quantity || 0) + requestedQty;
    if (nextQty > sizeObj.stock) {
      res.status(400);
      throw new Error('Selected size is out of stock');
    }
    cart.items[existingIdx].quantity = nextQty;
    cart.items[existingIdx].price = price;
  } else {
    cart.items.push({
      _id: randomUUID(),
      productId,
      quantity: requestedQty,
      size,
      color,
      price,
    });
  }

  cart.updatedAt = nowIso();
  await saveCart(ref, cart);
  const hydratedCart = await hydrateCart(cart);
  res.json({ success: true, cart: hydratedCart });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const nextQty = Number(quantity || 0);

  const { ref, cart } = await loadCartDoc(req.user._id);
  const item = (cart.items || []).find((entry) => entry._id === req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error('Cart item not found');
  }

  if (nextQty <= 0) {
    cart.items = cart.items.filter((entry) => entry._id !== req.params.itemId);
  } else {
    const product = await loadProduct(item.productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    const sizeObj = (product.sizes || []).find((entry) => entry.size === item.size);
    if (!sizeObj || sizeObj.stock < nextQty) {
      res.status(400);
      throw new Error('Selected size is out of stock');
    }
    item.quantity = nextQty;
    item.price = product.discountedPrice || product.price;
  }

  cart.updatedAt = nowIso();
  await saveCart(ref, cart);
  const hydratedCart = await hydrateCart(cart);
  res.json({ success: true, cart: hydratedCart });
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { ref, cart } = await loadCartDoc(req.user._id);
  const nextItems = (cart.items || []).filter((entry) => entry._id !== req.params.itemId);

  if (nextItems.length === cart.items.length) {
    res.status(404);
    throw new Error('Cart item not found');
  }

  cart.items = nextItems;
  cart.updatedAt = nowIso();
  await saveCart(ref, cart);
  const hydratedCart = await hydrateCart(cart);
  res.json({ success: true, cart: hydratedCart });
});

const clearCart = asyncHandler(async (req, res) => {
  const { ref, cart } = await loadCartDoc(req.user._id);
  cart.items = [];
  cart.updatedAt = nowIso();
  await saveCart(ref, cart);
  res.json({ success: true, message: 'Cart cleared', cart: { ...cart, items: [] } });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
