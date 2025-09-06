import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Load cart items when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      setCartItems([]);
      setCartTotal(0);
    }
  }, [isAuthenticated]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cart');
      setCartItems(response.data.cartItems);
      setCartTotal(response.data.total);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return { success: false };
    }

    try {
      await axios.post('/api/cart/add', {
        product_id: productId,
        quantity
      });
      
      await loadCart(); // Reload cart
      toast.success('Item added to cart!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add to cart';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      await axios.put(`/api/cart/${productId}`, { quantity });
      await loadCart(); // Reload cart
      toast.success('Cart updated!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update cart';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`/api/cart/${productId}`);
      await loadCart(); // Reload cart
      toast.success('Item removed from cart!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove from cart';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete('/api/cart');
      setCartItems([]);
      setCartTotal(0);
      toast.success('Cart cleared!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to clear cart';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const checkout = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/cart/checkout');
      
      if (response.data.orders && response.data.orders.length > 0) {
        setCartItems([]);
        setCartTotal(0);
        toast.success(`Checkout successful! ${response.data.orders.length} orders created.`);
        return { success: true, orders: response.data.orders };
      } else {
        toast.error('No items to checkout');
        return { success: false };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Checkout failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const isInCart = (productId) => {
    return cartItems.some(item => item.product_id === productId);
  };

  const value = {
    cartItems,
    cartTotal,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    checkout,
    loadCart,
    getCartItemCount,
    isInCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
