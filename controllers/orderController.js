const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const axios = require('axios');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        const order = new Order({
            orderItems: orderItems.map((x) => ({
                name: x.title,
                qty: x.qty,
                image: x.image,
                price: x.price,
                product: x.product,
                _id: undefined
            })),
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    }
});

// @desc    Process Clover Payment
// @route   POST /api/orders/clover/pay
// @access  Private
const createCloverPayment = asyncHandler(async (req, res) => {
  const { amount, orderId, source } = req.body;

  if (!amount || !orderId || !source) {
    res.status(400);
    throw new Error('Missing payment data');
  }

  const cloverUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://api.clover.com/v1/charges'
      : 'https://sandbox.dev.clover.com/v1/charges';

  try {
      const response = await axios.post(
        cloverUrl,
        {
            amount: Math.round(amount * 100), // cents
            currency: 'USD',
            source, // token from frontend
            metadata: { orderId },
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.CLOVER_PRIVATE_KEY}`,
                'Content-Type': 'application/json',
            },
        }
      );

      if (!response.data || !response.data.id) {
        res.status(400);
        throw new Error('Clover payment failed');
      }

      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404);
        throw new Error('Order not found');
      }

      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: response.data.id,
        status: response.data.status,
      };

      await order.save();

      res.json({
        success: true,
        message: 'Payment successful',
        payment: response.data
      });
  } catch (error) {
      console.error(error.response?.data || error.message);
      res.status(400);
      throw new Error(error.response?.data?.message || 'Payment failed');
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.payer.email_address,
        };

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.status = req.body.status || order.status;
        order.tracking = {
            currentLocation: req.body.currentLocation || order.tracking.currentLocation,
            estTime: req.body.estTime || order.tracking.estTime,
        };

        if (order.status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({}).populate('user', '_id name email');
    res.json(orders);
});

module.exports = {
    addOrderItems,
    createCloverPayment,
    getOrderById,
    updateOrderToPaid,
    updateOrderStatus,
    getMyOrders,
    getOrders
};
