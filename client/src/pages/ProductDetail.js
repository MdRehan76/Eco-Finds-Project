import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MessageCircle, 
  ShoppingCart,
  User,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart, isInCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchProduct();
    if (isAuthenticated) {
      fetchMessages();
    }
  }, [id, isAuthenticated]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/api/products/${id}`);
      setProduct(response.data.product);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!product || !isAuthenticated) return;
    
    try {
      const response = await axios.get(`/api/messages/${product.seller_id}?productId=${id}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (product.seller_id === user.id) {
      toast.error('You cannot add your own product to cart');
      return;
    }

    const result = await addToCart(product.id);
    if (result.success) {
      toast.success('Item added to cart!');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setSendingMessage(true);
    try {
      await axios.post('/api/messages/send', {
        receiver_id: product.seller_id,
        product_id: product.id,
        message: chatMessage
      });
      
      setChatMessage('');
      await fetchMessages();
      toast.success('Message sent!');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to buy products');
      navigate('/login');
      return;
    }

    if (product.seller_id === user.id) {
      toast.error('You cannot buy your own product');
      return;
    }

    try {
      const response = await axios.post('/api/orders', {
        product_id: product.id,
        quantity: 1
      });
      
      toast.success('Order created successfully!', {
        duration: 4000,
        icon: <CheckCircle className="w-6 h-6 text-green-500" />
      });
      
      navigate('/orders');
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Product not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = isAuthenticated && product.seller_id === user?.id;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Images */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <img
                src={product.image_url || 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800'}
                alt={product.title}
                className="w-full h-96 object-cover"
              />
            </motion.div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              {/* Product Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full">
                    {product.category_name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {product.title}
                </h1>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    <span>by {product.seller_name}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-3xl font-bold text-primary-600">
                  ${product.price}
                </span>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Description
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Action Buttons */}
              {!isOwner ? (
                <div className="space-y-3">
                  <button
                    onClick={handleBuyNow}
                    className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Buy Now</span>
                  </button>
                  
                  <button
                    onClick={handleAddToCart}
                    disabled={isInCart(product.id)}
                    className={`w-full btn-secondary flex items-center justify-center space-x-2 py-3 ${
                      isInCart(product.id) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{isInCart(product.id) ? 'In Cart' : 'Add to Cart'}</span>
                  </button>

                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="w-full flex items-center justify-center space-x-2 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Message Seller</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    to={`/edit-product/${product.id}`}
                    className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
                  >
                    <span>Edit Product</span>
                  </Link>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    This is your product
                  </p>
                </div>
              )}
            </motion.div>

            {/* Seller Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Seller Information
              </h3>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {product.seller_name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    EcoFinds Member
                  </p>
                </div>
              </div>

              <Link
                to={`/user/${product.seller_id}`}
                className="btn-secondary w-full text-center"
              >
                View Profile
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Chat Section */}
        {showChat && isAuthenticated && !isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Chat with {product.seller_name}
            </h3>

            {/* Messages */}
            <div className="h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-900">
              {messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user.id
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 input-field"
                disabled={sendingMessage}
              />
              <button
                type="submit"
                disabled={sendingMessage || !chatMessage.trim()}
                className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
