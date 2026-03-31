const Cart = require('../models/Cart');
const Product = require('../models/Product');

// GET /api/cart
exports.getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  res.json(cart ? cart.cartItems : []);
};

// POST /api/cart
exports.addOrUpdateCart = async (req, res) => {
  const { product, qty } = req.body;
  if (!product || !qty) return res.status(400).json({ message: 'Product and qty required' });
  let cart = await Cart.findOne({ user: req.user._id });
  const prod = await Product.findById(product);
  if (!prod) return res.status(404).json({ message: 'Product not found' });
  const item = {
    product: prod._id,
    qty,
    title: prod.title,
    image: prod.images && prod.images.length > 0 ? prod.images[0] : '',
    price: prod.price,
    slug: prod.slug,
  };
  if (!cart) {
    cart = new Cart({ user: req.user._id, cartItems: [item] });
  } else {
    const existIdx = cart.cartItems.findIndex((x) => x.product.toString() === product);
    if (existIdx > -1) {
      cart.cartItems[existIdx] = item;
    } else {
      cart.cartItems.push(item);
    }
  }
  await cart.save();
  res.json(cart.cartItems);
};

// DELETE /api/cart/:productId
exports.removeCartItem = async (req, res) => {
  const { productId } = req.params;
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.json([]);
  cart.cartItems = cart.cartItems.filter((x) => x.product.toString() !== productId);
  await cart.save();
  res.json(cart.cartItems);
};

// DELETE /api/cart
exports.clearCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.cartItems = [];
    await cart.save();
  }
  res.json([]);
};
