import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], summary: { total: 0, itemCount: 0 } });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], summary: { total: 0, itemCount: 0 } });
      return;
    }

    try {
      setLoading(true);
      const response = await cartService.get();
      if (response.data && response.data.items) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart({ items: [], summary: { total: 0, itemCount: 0 } });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await cartService.add({ productId, quantity });
      await fetchCart();
      return true;
    } catch (error) {
      throw error;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      await cartService.update(itemId, { quantity });
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await cartService.remove(itemId);
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clear();
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
