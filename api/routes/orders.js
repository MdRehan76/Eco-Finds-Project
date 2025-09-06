const express = require('express');
const { dbHelpers } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const buyer_id = req.user.id;

    // Validation
    if (!product_id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Get product details
    const product = await dbHelpers.get(`
      SELECT p.*, u.username as seller_name
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = ? AND p.status = 'active'
    `, [product_id]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found or not available' });
    }

    // Check if user is trying to buy their own product
    if (product.seller_id === buyer_id) {
      return res.status(400).json({ message: 'You cannot buy your own product' });
    }

    const total_price = product.price * quantity;

    // Create order
    const result = await dbHelpers.run(`
      INSERT INTO orders (buyer_id, seller_id, product_id, quantity, total_price)
      VALUES (?, ?, ?, ?, ?)
    `, [buyer_id, product.seller_id, product_id, quantity, total_price]);

    // Get created order with details
    const order = await dbHelpers.get(`
      SELECT 
        o.*,
        p.title as product_title,
        p.price as product_price,
        p.image_url as product_image,
        buyer.username as buyer_name,
        seller.username as seller_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      WHERE o.id = ?
    `, [result.id]);

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's orders (as buyer)
router.get('/purchases', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const buyer_id = req.user.id;

    const orders = await dbHelpers.all(`
      SELECT 
        o.*,
        p.title as product_title,
        p.description as product_description,
        p.image_url as product_image,
        seller.username as seller_name,
        seller.email as seller_email
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users seller ON o.seller_id = seller.id
      WHERE o.buyer_id = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [buyer_id, parseInt(limit), parseInt(offset)]);

    const countResult = await dbHelpers.get(
      'SELECT COUNT(*) as total FROM orders WHERE buyer_id = ?',
      [buyer_id]
    );

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's sales (as seller)
router.get('/sales', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const seller_id = req.user.id;

    const orders = await dbHelpers.all(`
      SELECT 
        o.*,
        p.title as product_title,
        p.description as product_description,
        p.image_url as product_image,
        buyer.username as buyer_name,
        buyer.email as buyer_email
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users buyer ON o.buyer_id = buyer.id
      WHERE o.seller_id = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [seller_id, parseInt(limit), parseInt(offset)]);

    const countResult = await dbHelpers.get(
      'SELECT COUNT(*) as total FROM orders WHERE seller_id = ?',
      [seller_id]
    );

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update order status (seller only)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user_id = req.user.id;

    // Validation
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get order and verify seller
    const order = await dbHelpers.get(`
      SELECT o.*, p.title as product_title
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `, [id]);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.seller_id !== user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update order status
    await dbHelpers.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    res.json({
      message: 'Order status updated successfully',
      order: { ...order, status }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single order details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const order = await dbHelpers.get(`
      SELECT 
        o.*,
        p.title as product_title,
        p.description as product_description,
        p.image_url as product_image,
        buyer.username as buyer_name,
        buyer.email as buyer_email,
        seller.username as seller_name,
        seller.email as seller_email
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      WHERE o.id = ? AND (o.buyer_id = ? OR o.seller_id = ?)
    `, [id, user_id, user_id]);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
