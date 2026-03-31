const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCart,
  addOrUpdateCart,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');

router.get('/', protect, getCart);
router.post('/', protect, addOrUpdateCart);
router.delete('/:productId', protect, removeCartItem);
router.delete('/', protect, clearCart);

module.exports = router;
