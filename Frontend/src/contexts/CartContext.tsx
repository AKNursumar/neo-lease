import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  dailyRate: number;
  startDate: string;
  endDate: string;
  quantity: number;
  totalDays: number;
  totalAmount: number;
  category: string;
  location: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateDates: (itemId: string, startDate: string, endDate: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('leaselink_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('leaselink_cart', JSON.stringify(items));
  }, [items]);

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays); // Minimum 1 day
  };

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    const id = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const totalDays = calculateDays(newItem.startDate, newItem.endDate);
    const totalAmount = newItem.dailyRate * totalDays * newItem.quantity;

    const cartItem: CartItem = {
      ...newItem,
      id,
      totalDays,
      totalAmount,
    };

    setItems(prevItems => {
      // Check if the same product with same dates already exists
      const existingIndex = prevItems.findIndex(
        item => item.productId === newItem.productId && 
                item.startDate === newItem.startDate && 
                item.endDate === newItem.endDate
      );

      if (existingIndex > -1) {
        // Update existing item quantity
        const updatedItems = [...prevItems];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + newItem.quantity,
          totalAmount: updatedItems[existingIndex].dailyRate * totalDays * (updatedItems[existingIndex].quantity + newItem.quantity),
        };
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, cartItem];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              totalAmount: item.dailyRate * item.totalDays * quantity,
            }
          : item
      )
    );
  };

  const updateDates = (itemId: string, startDate: string, endDate: string) => {
    const totalDays = calculateDays(startDate, endDate);

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              startDate,
              endDate,
              totalDays,
              totalAmount: item.dailyRate * totalDays * item.quantity,
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalAmount = (): number => {
    return items.reduce((total, item) => total + item.totalAmount, 0);
  };

  const getTotalItems = (): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateDates,
    clearCart,
    getTotalAmount,
    getTotalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
