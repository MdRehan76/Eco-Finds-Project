const express = require('express');
const { dbHelpers } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get conversations for a user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get all conversations where user is either sender or receiver
    const conversations = await dbHelpers.all(`
      SELECT DISTINCT
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id
          ELSE m.sender_id
        END as other_user_id,
        u.username as other_username,
        u.email as other_email,
        p.id as product_id,
        p.title as product_title,
        p.image_url as product_image,
        MAX(m.created_at) as last_message_time,
        COUNT(CASE WHEN m.receiver_id = ? AND m.is_read = 0 THEN 1 END) as unread_count
      FROM messages m
      JOIN users u ON (
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id
          ELSE m.sender_id
        END = u.id
      )
      LEFT JOIN products p ON m.product_id = p.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY other_user_id, p.id
      ORDER BY last_message_time DESC
    `, [user_id, user_id, user_id, user_id, user_id]);

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get messages between two users (optionally for a specific product)
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.query;
    const current_user_id = req.user.id;

    // Verify the other user exists
    const otherUser = await dbHelpers.get(
      'SELECT id, username, email FROM users WHERE id = ?',
      [userId]
    );

    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let sql = `
      SELECT 
        m.*,
        p.title as product_title,
        p.image_url as product_image
      FROM messages m
      LEFT JOIN products p ON m.product_id = p.id
      WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
    `;
    const params = [current_user_id, userId, userId, current_user_id];

    if (productId) {
      sql += ' AND m.product_id = ?';
      params.push(productId);
    }

    sql += ' ORDER BY m.created_at ASC';

    const messages = await dbHelpers.all(sql, params);

    // Mark messages as read
    await dbHelpers.run(
      'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
      [userId, current_user_id]
    );

    res.json({
      messages,
      otherUser: {
        id: otherUser.id,
        username: otherUser.username,
        email: otherUser.email
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send a message
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { receiver_id, product_id, message, message_type = 'text' } = req.body;
    const sender_id = req.user.id;

    // Validation
    if (!receiver_id || !message) {
      return res.status(400).json({ message: 'Receiver ID and message are required' });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Verify receiver exists
    const receiver = await dbHelpers.get(
      'SELECT id, username FROM users WHERE id = ?',
      [receiver_id]
    );

    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Verify product exists if provided
    if (product_id) {
      const product = await dbHelpers.get(
        'SELECT id, title FROM products WHERE id = ?',
        [product_id]
      );

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
    }

    // Create message
    const result = await dbHelpers.run(`
      INSERT INTO messages (sender_id, receiver_id, product_id, message, message_type)
      VALUES (?, ?, ?, ?, ?)
    `, [sender_id, receiver_id, product_id, message, message_type]);

    // Get created message with details
    const newMessage = await dbHelpers.get(`
      SELECT 
        m.*,
        p.title as product_title,
        p.image_url as product_image
      FROM messages m
      LEFT JOIN products p ON m.product_id = p.id
      WHERE m.id = ?
    `, [result.id]);

    res.status(201).json({
      message: 'Message sent successfully',
      newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark messages as read
router.put('/read', authenticateToken, async (req, res) => {
  try {
    const { sender_id, product_id } = req.body;
    const receiver_id = req.user.id;

    let sql = 'UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND is_read = 0';
    const params = [receiver_id];

    if (sender_id) {
      sql += ' AND sender_id = ?';
      params.push(sender_id);
    }

    if (product_id) {
      sql += ' AND product_id = ?';
      params.push(product_id);
    }

    const result = await dbHelpers.run(sql, params);

    res.json({
      message: 'Messages marked as read',
      updatedCount: result.changes
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get unread message count
router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await dbHelpers.get(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0',
      [user_id]
    );

    res.json({ unreadCount: result.count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Customer service chatbot endpoint
router.post('/chatbot', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const lowerMessage = message.toLowerCase();
    let response = '';

    // Simple chatbot responses
    if (lowerMessage.includes('sell') || lowerMessage.includes('selling')) {
      response = 'To sell items on EcoFinds, you need to create an account and then click the "Sell" button. You can list your eco-friendly items with descriptions, prices, and photos.';
    } else if (lowerMessage.includes('buy') || lowerMessage.includes('buying')) {
      response = 'You can browse products by category or search for specific items. Click on any product to view details and contact the seller.';
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      response = 'Prices are set by individual sellers. You can negotiate prices by messaging the seller directly on the product page.';
    } else if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
      response = 'Shipping arrangements are made directly between buyers and sellers. Contact the seller to discuss delivery options.';
    } else if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
      response = 'Return policies vary by seller. Please contact the seller directly to discuss return or refund options.';
    } else if (lowerMessage.includes('eco') || lowerMessage.includes('environment')) {
      response = 'EcoFinds promotes sustainable living by connecting people to buy and sell eco-friendly products, reducing waste and supporting the circular economy.';
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      response = 'I can help with questions about selling, buying, pricing, shipping, returns, and our eco-friendly mission. What would you like to know?';
    } else {
      response = 'I can help you with questions about selling, buying, pricing, shipping, returns, and EcoFinds\' eco-friendly mission. Please ask me something specific!';
    }

    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
