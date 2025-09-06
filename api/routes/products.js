const express = require('express');
const { dbHelpers } = require('../database');
const { authenticateToken, checkOwnership, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all products with optional filtering
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12, sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        p.*,
        c.name as category_name,
        u.username as seller_name,
        u.email as seller_email
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'active'
    `;
    
    const params = [];

    // Add category filter
    if (category) {
      sql += ' AND c.name = ?';
      params.push(category);
    }

    // Add search filter
    if (search) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add sorting
    const allowedSorts = ['created_at', 'price', 'title'];
    const allowedOrders = ['ASC', 'DESC'];
    if (allowedSorts.includes(sort) && allowedOrders.includes(order.toUpperCase())) {
      sql += ` ORDER BY p.${sort} ${order.toUpperCase()}`;
    } else {
      sql += ' ORDER BY p.created_at DESC';
    }

    // Add pagination
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const products = await dbHelpers.all(sql, params);

    // Get total count for pagination
    let countSql = `
      SELECT COUNT(*) as total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
    `;
    const countParams = [];

    if (category) {
      countSql += ' AND c.name = ?';
      countParams.push(category);
    }

    if (search) {
      countSql += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await dbHelpers.get(countSql, countParams);
    const total = countResult.total;

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single product by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await dbHelpers.get(`
      SELECT 
        p.*,
        c.name as category_name,
        u.username as seller_name,
        u.email as seller_email
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = ? AND p.status = 'active'
    `, [id]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, price, category_id, image_url } = req.body;
    const seller_id = req.user.id;

    // Validation
    if (!title || !description || !price || !category_id) {
      return res.status(400).json({ message: 'Title, description, price, and category are required' });
    }

    if (price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    // Verify category exists
    const category = await dbHelpers.get('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Create product
    const result = await dbHelpers.run(`
      INSERT INTO products (title, description, price, category_id, seller_id, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [title, description, price, category_id, seller_id, image_url]);

    // Get created product with details
    const product = await dbHelpers.get(`
      SELECT 
        p.*,
        c.name as category_name,
        u.username as seller_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?
    `, [result.id]);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update product
router.put('/:id', authenticateToken, checkOwnership('products'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category_id, image_url, status } = req.body;

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({ message: 'Price must be greater than 0' });
      }
      updates.push('price = ?');
      params.push(price);
    }

    if (category_id !== undefined) {
      // Verify category exists
      const category = await dbHelpers.get('SELECT id FROM categories WHERE id = ?', [category_id]);
      if (!category) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      updates.push('category_id = ?');
      params.push(category_id);
    }

    if (image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(image_url);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await dbHelpers.run(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated product
    const product = await dbHelpers.get(`
      SELECT 
        p.*,
        c.name as category_name,
        u.username as seller_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?
    `, [id]);

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, checkOwnership('products'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product has any orders
    const orders = await dbHelpers.all('SELECT id FROM orders WHERE product_id = ?', [id]);
    if (orders.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete product with existing orders. Mark as inactive instead.' 
      });
    }

    await dbHelpers.run('DELETE FROM products WHERE id = ?', [id]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's products
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const products = await dbHelpers.all(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);

    const countResult = await dbHelpers.get(
      'SELECT COUNT(*) as total FROM products WHERE seller_id = ?',
      [userId]
    );

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get user products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await dbHelpers.all('SELECT * FROM categories ORDER BY name');
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
