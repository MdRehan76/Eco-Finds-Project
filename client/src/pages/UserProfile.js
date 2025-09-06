import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  Package, 
  ShoppingBag,
  MessageCircle,
  Mail,
  MapPin,
  Star
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [id]);

  const fetchUserProfile = async () => {
    try {
      const [profileRes, productsRes] = await Promise.all([
        axios.get(`/api/users/${id}/public`),
        axios.get(`/api/products/user/${id}?limit=12`)
      ]);
      
      setProfile(profileRes.data);
      setProducts(productsRes.data.products);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            User not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The user you're looking for doesn't exist.
          </p>
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === parseInt(id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-primary-600" />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {profile.user.username}
              </h1>
              <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Member since {new Date(profile.user.memberSince).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  <span>{profile.stats.totalProducts} products</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                {!isOwnProfile && (
                  <>
                    <button className="btn-primary flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                    <button className="btn-secondary flex items-center space-x-2">
                      <Star className="w-4 h-4" />
                      <span>Follow</span>
                    </button>
                  </>
                )}
                {isOwnProfile && (
                  <Link to="/dashboard" className="btn-primary">
                    Go to Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Products by {profile.user.username}
            </h2>
            {products.length > 0 && (
              <Link
                to={`/products?seller=${id}`}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all
              </Link>
            )}
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link to={`/products/${product.id}`} className="product-card">
                    <div className="aspect-w-16 aspect-h-12 mb-4">
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'}
                        alt={product.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-600">
                        ${product.price}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {product.category_name}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No products yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {isOwnProfile 
                  ? "You haven't listed any products yet."
                  : `${profile.user.username} hasn't listed any products yet.`
                }
              </p>
              {isOwnProfile && (
                <Link to="/create-product" className="btn-primary mt-4">
                  List Your First Product
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default UserProfile;
