const asyncHandler = require('express-async-handler');
const { Cart } = require('../models/CartOrder');
const Product = require('../models/Product');

// @desc  Get user cart
// @route GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.product',
    'name images price discountedPrice totalStock sizes'
  );
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  res.json({ success: true, cart });
});

// @desc  Add item to cart
// @route POST /api/cart
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, size, color } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check stock for selected size
  const sizeObj = product.sizes.find((s) => s.size === size);
  if (!sizeObj || sizeObj.stock < quantity) {
    res.status(400);
    throw new Error('Selected size is out of stock');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const existingIdx = cart.items.findIndex(
    (item) => item.product.toString() === productId && item.size === size
  );

  const price = product.discountedPrice || product.price;

  if (existingIdx > -1) {
    cart.items[existingIdx].quantity += quantity;
    cart.items[existingIdx].price = price;
  } else {
    cart.items.push({ product: productId, quantity, size, color, price });
  }

  await cart.save();
  cart = await cart.populate('items.product', 'name images price discountedPrice totalStock sizes');
  res.json({ success: true, cart });
});

// @desc  Update cart item quantity
// @route PUT /api/cart/:itemId
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error('Cart item not found');
  }

  if (quantity <= 0) {
    item.deleteOne();
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  await cart.populate('items.product', 'name images price discountedPrice totalStock sizes');
  res.json({ success: true, cart });
});

// @desc  Remove item from cart
// @route DELETE /api/cart/:itemId
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }
  cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
  await cart.save();
  await cart.populate('items.product', 'name images price discountedPrice totalStock sizes');
  res.json({ success: true, cart });
});

// @desc  Clear cart
// @route DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], couponApplied: undefined });
  res.json({ success: true, message: 'Cart cleared' });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
