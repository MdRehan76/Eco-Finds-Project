import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  ShoppingBag, 
  Calendar, 
  User, 
  DollarSign,
  Eye,
  MessageCircle,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Orders = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('purchases');
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [purchasesRes, salesRes] = await Promise.all([
        axios.get('/api/orders/purchases'),
        axios.get('/api/orders/sales')
      ]);
      
      setPurchases(purchasesRes.data.orders);
      setSales(salesRes.data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'shipped':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200';
    }
  };

  const OrderCard = ({ order, type }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex gap-4">
        <img
          src={order.product_image || 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'}
          alt={order.product_title}
          className="w-20 h-20 object-cover rounded-lg"
        />
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {order.product_title}
            </h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </span>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            {type === 'purchase' ? `from ${order.seller_name}` : `to ${order.buyer_name}`}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Package className="w-4 h-4 mr-1" />
                <span>Qty: {order.quantity}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-primary-600">
                ${order.total_price}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            <button className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
              <Eye className="w-4 h-4" />
              <span>View Details</span>
            </button>
            <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 text-sm font-medium">
              <MessageCircle className="w-4 h-4" />
              <span>Message</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentOrders = activeTab === 'purchases' ? purchases : sales;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your purchases and sales
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('purchases')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'purchases'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Purchases ({purchases.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('sales')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sales'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>Sales ({sales.length})</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Orders List */}
        {currentOrders.length > 0 ? (
          <div className="space-y-6">
            {currentOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                type={activeTab === 'purchases' ? 'purchase' : 'sale'}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 dark:text-gray-600 mb-6">
              {activeTab === 'purchases' ? (
                <ShoppingBag className="w-24 h-24 mx-auto" />
              ) : (
                <Package className="w-24 h-24 mx-auto" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No {activeTab} yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {activeTab === 'purchases' 
                ? 'Your purchase history will appear here when you buy products.'
                : 'Your sales history will appear here when someone buys your products.'
              }
            </p>
            <a
              href="/products"
              className="btn-primary"
            >
              {activeTab === 'purchases' ? 'Start Shopping' : 'List Products'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
