import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

const paymentMethods: PaymentMethod[] = [
  { id: "card", name: "Credit/Debit Card", icon: "💳" },
  { id: "paypal", name: "PayPal", icon: "📧" },
  { id: "apple", name: "Apple Pay", icon: "🍎" },
  { id: "google", name: "Google Pay", icon: "🔍" }
];

const mockOrderSummary = {
  items: [
    {
      name: "Professional Camera Kit",
      quantity: 1,
      days: 5,
      dailyRate: 6500, // Updated to Indian market rate
      subtotal: 32500 // 6500 × 5 days
    },
    {
      name: "MacBook Pro",
      quantity: 1,
      days: 4,
      dailyRate: 12000, // Updated to Indian market rate
      subtotal: 48000 // 12000 × 4 days
    }
  ],
  subtotal: 80500, // 32500 + 48000
  tax: 14490, // 18% GST (typical Indian tax rate)
  total: 94990 // subtotal + tax
};

const Checkout = () => {
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Mock payment processing
    setTimeout(() => {
      setIsProcessing(false);
      // Show success and redirect
      alert("Payment successful! Rental confirmed.");
      navigate("/rentals");
    }, 2000);
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
              Checkout 💳
            </h1>
            <p className="text-muted-foreground">
              Complete your rental booking with secure payment.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="neu-card p-6"
                >
                  <h3 className="text-xl font-bold text-foreground mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="neu-input w-full p-3 text-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="neu-input w-full p-3 text-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="neu-input w-full p-3 text-foreground"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="neu-input w-full p-3 text-foreground"
                        required
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Billing Address */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="neu-card p-6"
                >
                  <h3 className="text-xl font-bold text-foreground mb-4">Billing Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-foreground mb-2">Street Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="neu-input w-full p-3 text-foreground"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="neu-input w-full p-3 text-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">ZIP Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="neu-input w-full p-3 text-foreground"
                        required
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Payment Method */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="neu-card p-6"
                >
                  <h3 className="text-xl font-bold text-foreground mb-4">Payment Method</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {paymentMethods.map((method) => (
                      <motion.button
                        key={method.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-xl text-center transition-all duration-300 ${
                          selectedPayment === method.id
                            ? 'neu-inset text-primary'
                            : 'neu-button text-foreground hover:text-primary'
                        }`}
                        onClick={() => setSelectedPayment(method.id)}
                      >
                        <div className="text-2xl mb-1">{method.icon}</div>
                        <div className="text-xs font-medium">{method.name}</div>
                      </motion.button>
                    ))}
                  </div>

                  {selectedPayment === "card" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-2">Card Number</label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          placeholder="1234 5678 9012 3456"
                          className="neu-input w-full p-3 text-foreground"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Expiry Date</label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          placeholder="MM/YY"
                          className="neu-input w-full p-3 text-foreground"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">CVV</label>
                        <input
                          type="text"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          placeholder="123"
                          className="neu-input w-full p-3 text-foreground"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-2">Cardholder Name</label>
                        <input
                          type="text"
                          name="cardName"
                          value={formData.cardName}
                          onChange={handleInputChange}
                          className="neu-input w-full p-3 text-foreground"
                          required
                        />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="neu-card p-6 h-fit"
              >
                <h3 className="text-xl font-bold text-foreground mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  {mockOrderSummary.items.map((item, index) => (
                    <div key={index} className="neu-inset p-3 rounded-lg">
                      <div className="font-medium text-foreground text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.quantity} × {item.days} days × ₹{item.dailyRate}/day
                      </div>
                      <div className="text-right font-bold text-foreground">₹{item.subtotal}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{mockOrderSummary.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax (8%)</span>
                    <span>₹{mockOrderSummary.tax}</span>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between text-lg font-bold text-foreground">
                      <span>Total</span>
                      <span>₹{mockOrderSummary.total}</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                  whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                  disabled={isProcessing}
                  className={`neu-button w-full py-4 font-medium text-primary-foreground bg-primary ${
                    isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    `Complete Payment - ₹${mockOrderSummary.total}`
                  )}
                </motion.button>

                <div className="mt-4 p-3 neu-inset rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>🔒</span>
                    <span>Your payment information is secure and encrypted</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;