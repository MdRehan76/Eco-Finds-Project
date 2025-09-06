const express = require('express');
const { dbHelpers } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    const cartItems = await dbHelpers.all(`
      SELECT 
        ci.*,
        p.title,
        p.description,
        p.price,
        p.image_url,
        p.status as product_status,
        c.name as category_name,
        u.username as seller_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `, [user_id]);

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({
      cartItems,
      total: parseFloat(total.toFixed(2))
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add item to cart
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const user_id = req.user.id;

    // Validation
    if (!product_id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Check if product exists and is available
    const product = await dbHelpers.get(`
      SELECT p.*, u.username as seller_name
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = ? AND p.status = 'active'
    `, [product_id]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found or not available' });
    }

    // Check if user is trying to add their own product
    if (product.seller_id === user_id) {
      return res.status(400).json({ message: 'You cannot add your own product to cart' });
    }

    // Check if item already exists in cart
    const existingItem = await dbHelpers.get(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );

    if (existingItem) {
      // Update quantity
      await dbHelpers.run(
        'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, user_id, product_id]
      );
    } else {
      // Add new item
      await dbHelpers.run(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [user_id, product_id, quantity]
      );
    }

    res.json({ message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update cart item quantity
router.put('/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const user_id = req.user.id;

    // Validation
    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Check if item exists in cart
    const cartItem = await dbHelpers.get(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [user_id, productId]
    );

    if (!cartItem) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Update quantity
    await dbHelpers.run(
      'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [quantity, user_id, productId]
    );

    res.json({ message: 'Cart item updated successfully' });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove item from cart
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const user_id = req.user.id;

    // Check if item exists in cart
    const cartItem = await dbHelpers.get(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [user_id, productId]
    );

    if (!cartItem) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Remove item
    await dbHelpers.run(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [user_id, productId]
    );

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Clear entire cart
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    await dbHelpers.run('DELETE FROM cart_items WHERE user_id = ?', [user_id]);

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Checkout cart (create orders for all items)
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get all cart items
    const cartItems = await dbHelpers.all(`
      SELECT 
        ci.*,
        p.title,
        p.price,
        p.seller_id
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ? AND p.status = 'active'
    `, [user_id]);

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const orders = [];
    const errors = [];

    // Create orders for each cart item
    for (const item of cartItems) {
      try {
        // Check if user is trying to buy their own product
        if (item.seller_id === user_id) {
          errors.push(`Cannot buy your own product: ${item.title}`);
          continue;
        }

        const total_price = item.price * item.quantity;

        const result = await dbHelpers.run(`
          INSERT INTO orders (buyer_id, seller_id, product_id, quantity, total_price)
          VALUES (?, ?, ?, ?, ?)
        `, [user_id, item.seller_id, item.product_id, item.quantity, total_price]);

        orders.push({
          order_id: result.id,
          product_title: item.title,
          quantity: item.quantity,
          total_price
        });
      } catch (error) {
        errors.push(`Failed to create order for ${item.title}: ${error.message}`);
      }
    }

    // Clear cart if any orders were created
    if (orders.length > 0) {
      await dbHelpers.run('DELETE FROM cart_items WHERE user_id = ?', [user_id]);
    }

    res.json({
      message: `Checkout completed. ${orders.length} orders created.`,
      orders,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
