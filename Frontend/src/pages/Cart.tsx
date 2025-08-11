import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  dailyRate: number;
  startDate: string;
  endDate: string;
  quantity: number;
  totalDays: number;
  subtotal: number;
}

const mockCartItems: CartItem[] = [
  {
    id: 1,
    productId: 1,
    productName: "Professional Camera Kit",
    productImage: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=150&h=100&fit=crop",
    dailyRate: 6500, // Updated to Indian market rate
    startDate: "2025-08-15",
    endDate: "2025-08-20",
    quantity: 1,
    totalDays: 5,
    subtotal: 32500 // 6500 × 5 days
  },
  {
    id: 2,
    productId: 7,
    productName: "MacBook Pro",
    productImage: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=150&h=100&fit=crop",
    dailyRate: 12000, // Updated to Indian market rate
    startDate: "2025-08-18",
    endDate: "2025-08-22",
    quantity: 1,
    totalDays: 4,
    subtotal: 48000 // 12000 × 4 days
  }
];

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems);

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity, subtotal: item.totalDays * item.dailyRate * newQuantity }
          : item
      )
    );
  };

  const removeItem = (itemId: number) => {
    setCartItems(items => items.filter(item => item.id !== itemId));
  };

  const updateDates = (itemId: number, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (totalDays > 0) {
      setCartItems(items =>
        items.map(item =>
          item.id === itemId
            ? {
                ...item,
                startDate,
                endDate,
                totalDays,
                subtotal: totalDays * item.dailyRate * item.quantity
              }
            : item
        )
      );
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <Navigation />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="neu-card mb-6 p-6"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Shopping Cart 🛒
            </h1>
            <p className="text-muted-foreground">
              Review your rental items and proceed to checkout.
            </p>
          </motion.div>

          {cartItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="neu-card p-12 text-center"
            >
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">Add some products to get started</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="neu-button px-6 py-3 font-medium text-foreground hover:text-primary"
                onClick={() => navigate("/products")}
              >
                Browse Products
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                    className="neu-card p-6"
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Product Image & Info */}
                      <div className="flex gap-4 flex-1">
                        <div className="w-20 h-20 neu-inset rounded-xl overflow-hidden">
                          <img 
                            src={item.productImage} 
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {item.productName}
                          </h3>
                          <p className="text-primary font-bold">₹{item.dailyRate}/day</p>
                        </div>
                      </div>

                      {/* Rental Dates */}
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
                          <input
                            type="date"
                            value={item.startDate}
                            onChange={(e) => updateDates(item.id, e.target.value, item.endDate)}
                            className="neu-input w-full p-2 text-sm text-foreground"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">End Date</label>
                          <input
                            type="date"
                            value={item.endDate}
                            onChange={(e) => updateDates(item.id, item.startDate, e.target.value)}
                            className="neu-input w-full p-2 text-sm text-foreground"
                            min={item.startDate}
                          />
                        </div>
                      </div>

                      {/* Quantity & Actions */}
                      <div className="flex flex-col items-end gap-2 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="neu-button w-8 h-8 text-sm text-foreground"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </motion.button>
                          <div className="neu-inset px-3 py-1 text-sm font-medium text-foreground">
                            {item.quantity}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="neu-button w-8 h-8 text-sm text-foreground"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </motion.button>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{item.totalDays} days</p>
                          <p className="font-bold text-foreground">₹{item.subtotal}</p>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="neu-button px-3 py-1 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeItem(item.id)}
                        >
                          Remove
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="neu-card p-6 h-fit"
              >
                <h3 className="text-xl font-bold text-foreground mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax (8%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-lg font-bold text-foreground">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="neu-button w-full py-3 font-medium text-primary-foreground bg-primary hover:bg-primary/90"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="neu-button w-full py-2 text-sm font-medium text-foreground hover:text-primary"
                    onClick={() => navigate("/products")}
                  >
                    Continue Shopping
                  </motion.button>
                </div>

                <div className="mt-6 p-4 neu-inset rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">💡 Rental Terms</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Late returns incur additional charges</li>
                    <li>• Items must be returned in original condition</li>
                    <li>• Security deposit may be required</li>
                    <li>• Free cancellation up to 24h before</li>
                  </ul>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Cart;