const express = require('express');
const { dbHelpers } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await dbHelpers.get(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's product count
    const productCount = await dbHelpers.get(
      'SELECT COUNT(*) as count FROM products WHERE seller_id = ? AND status = "active"',
      [id]
    );

    // Get user's order count (as buyer)
    const orderCount = await dbHelpers.get(
      'SELECT COUNT(*) as count FROM orders WHERE buyer_id = ?',
      [id]
    );

    res.json({
      user: {
        ...user,
        productCount: productCount.count,
        orderCount: orderCount.count
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's public profile with recent activity
router.get('/:id/public', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await dbHelpers.get(
      'SELECT id, username, created_at FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's active products (limited to 6)
    const products = await dbHelpers.all(`
      SELECT 
        p.id,
        p.title,
        p.price,
        p.image_url,
        p.created_at,
        c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = ? AND p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT 6
    `, [id]);

    // Get user's recent reviews/ratings (if we had a reviews table)
    // For now, we'll just return basic info

    res.json({
      user: {
        id: user.id,
        username: user.username,
        memberSince: user.created_at
      },
      products,
      stats: {
        totalProducts: products.length,
        // Add more stats as needed
      }
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search users by username
router.get('/search/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const users = await dbHelpers.all(`
      SELECT 
        u.id,
        u.username,
        u.created_at,
        COUNT(p.id) as product_count
      FROM users u
      LEFT JOIN products p ON u.id = p.seller_id AND p.status = 'active'
      WHERE u.username LIKE ?
      GROUP BY u.id
      ORDER BY u.username
      LIMIT ? OFFSET ?
    `, [`%${username}%`, parseInt(limit), parseInt(offset)]);

    const countResult = await dbHelpers.get(
      'SELECT COUNT(*) as total FROM users WHERE username LIKE ?',
      [`%${username}%`]
    );

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's dashboard stats
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get product stats
    const productStats = await dbHelpers.get(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_products
      FROM products 
      WHERE seller_id = ?
    `, [user_id]);

    // Get order stats (as buyer)
    const buyerStats = await dbHelpers.get(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
        SUM(total_price) as total_spent
      FROM orders 
      WHERE buyer_id = ?
    `, [user_id]);

    // Get sales stats (as seller)
    const sellerStats = await dbHelpers.get(`
      SELECT 
        COUNT(*) as total_sales,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_sales,
        SUM(total_price) as total_earned
      FROM orders 
      WHERE seller_id = ?
    `, [user_id]);

    // Get recent activity
    const recentProducts = await dbHelpers.all(`
      SELECT 
        p.id,
        p.title,
        p.price,
        p.status,
        p.created_at
      FROM products p
      WHERE p.seller_id = ?
      ORDER BY p.created_at DESC
      LIMIT 5
    `, [user_id]);

    const recentOrders = await dbHelpers.all(`
      SELECT 
        o.id,
        o.status,
        o.total_price,
        o.created_at,
        p.title as product_title
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.buyer_id = ? OR o.seller_id = ?
      ORDER BY o.created_at DESC
      LIMIT 5
    `, [user_id, user_id]);

    res.json({
      productStats,
      buyerStats,
      sellerStats,
      recentActivity: {
        products: recentProducts,
        orders: recentOrders
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
