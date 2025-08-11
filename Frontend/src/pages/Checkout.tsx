import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { paymentService, PaymentOrderRequest, PaymentVerificationRequest } from "@/lib/payments";
import { config } from "@/lib/config";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CreditCard, Smartphone, Building2, Wallet, Shield } from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  processingFee?: string;
  popular?: boolean;
}

interface PaymentOption {
  id: string;
  name: string;
  logo: string;
  type: 'upi' | 'netbanking' | 'wallet' | 'card';
}

const paymentMethods: PaymentMethod[] = [
  { 
    id: "upi", 
    name: "UPI", 
    icon: <Smartphone className="w-5 h-5" />, 
    description: "Pay instantly using any UPI app",
    popular: true
  },
  { 
    id: "card", 
    name: "Credit/Debit Card", 
    icon: <CreditCard className="w-5 h-5" />, 
    description: "Visa, Mastercard, Rupay, AMEX",
    processingFee: "2.5% + GST"
  },
  { 
    id: "netbanking", 
    name: "Net Banking", 
    icon: <Building2 className="w-5 h-5" />, 
    description: "All major banks supported"
  },
  { 
    id: "wallets", 
    name: "Digital Wallets", 
    icon: <Wallet className="w-5 h-5" />, 
    description: "Paytm, PhonePe, Google Pay, Amazon Pay"
  }
];

const upiOptions: PaymentOption[] = [
  { id: "gpay", name: "Google Pay", logo: "🔍", type: "upi" },
  { id: "phonepe", name: "PhonePe", logo: "�", type: "upi" },
  { id: "paytm", name: "Paytm", logo: "💰", type: "upi" },
  { id: "bhim", name: "BHIM UPI", logo: "🇮🇳", type: "upi" },
  { id: "custom_upi", name: "Other UPI Apps", logo: "📲", type: "upi" }
];

const bankOptions: PaymentOption[] = [
  { id: "sbi", name: "State Bank of India", logo: "🏦", type: "netbanking" },
  { id: "hdfc", name: "HDFC Bank", logo: "🏛️", type: "netbanking" },
  { id: "icici", name: "ICICI Bank", logo: "�", type: "netbanking" },
  { id: "axis", name: "Axis Bank", logo: "🏤", type: "netbanking" },
  { id: "kotak", name: "Kotak Mahindra", logo: "🏨", type: "netbanking" },
  { id: "pnb", name: "Punjab National Bank", logo: "🏪", type: "netbanking" }
];

const walletOptions: PaymentOption[] = [
  { id: "paytm_wallet", name: "Paytm Wallet", logo: "💰", type: "wallet" },
  { id: "mobikwik", name: "MobiKwik", logo: "📱", type: "wallet" },
  { id: "freecharge", name: "Freecharge", logo: "⚡", type: "wallet" },
  { id: "amazonpay", name: "Amazon Pay", logo: "�", type: "wallet" }
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
  const { user } = useSupabaseAuth();
  const [selectedPayment, setSelectedPayment] = useState("upi");
  const [selectedOption, setSelectedOption] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: user?.user_metadata?.full_name?.split(' ')[0] || "",
    lastName: user?.user_metadata?.full_name?.split(' ')[1] || "",
    phone: user?.user_metadata?.phone || "",
    address: "",
    city: "",
    zipCode: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: ""
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
        firstName: user.user_metadata?.full_name?.split(' ')[0] || "",
        lastName: user.user_metadata?.full_name?.split(' ')[1] || "",
        phone: user.user_metadata?.phone || "",
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate UPI ID if custom UPI is selected
    if (selectedPayment === 'upi' && selectedOption === 'custom_upi') {
      if (!upiId.trim()) {
        errors.upiId = 'UPI ID is required';
      } else if (!paymentService.validateUpiId(upiId)) {
        errors.upiId = 'Please enter a valid UPI ID (e.g., user@paytm)';
      }
    }

    // Validate required form fields
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before processing
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);

    try {
      // Create payment order using payment service
      const orderData: PaymentOrderRequest = {
        amount: mockOrderSummary.total,
        currency: 'INR',
        notes: {
          payment_method: selectedPayment,
          selected_option: selectedOption,
          customer_email: formData.email,
          customer_name: `${formData.firstName} ${formData.lastName}`,
          customer_phone: formData.phone
        }
      };

      const orderResponse = await paymentService.createPaymentOrder(orderData);

      // Load Razorpay script
      const isScriptLoaded = await paymentService.loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Failed to load payment gateway. Please try again.');
      }

      // Get payment method preferences
      const methodPreferences = paymentService.getMethodPreferences(selectedPayment, selectedOption);

      // Configure Razorpay options
      const razorpayOptions: any = {
        key: config.payments.razorpayKeyId,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: config.app.name,
        description: 'Rental Payment',
        order_id: orderResponse.data.razorpay_order_id,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
          ...methodPreferences.prefill
        },
        method: methodPreferences.method,
        theme: {
          color: '#3b82f6'
        },
        handler: async (response: any) => {
          try {
            // Verify payment using payment service
            const verificationData: PaymentVerificationRequest = {
              payment_id: orderResponse.data.payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };

            await paymentService.verifyPayment(verificationData);
            
            navigate("/rentals", { 
              state: { 
                message: "Payment successful! Your rental has been confirmed.",
                type: "success"
              }
            });
          } catch (error) {
            console.error('Payment verification error:', error);
            alert(`Payment verification failed: ${error instanceof Error ? error.message : 'Please contact support.'}`);
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      };

      // Create and open Razorpay instance
      const rzp = paymentService.createRazorpayInstance(razorpayOptions);
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      alert(errorMessage);
      setIsProcessing(false);
    }
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
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`neu-input mt-2 ${validationErrors.email ? 'border-red-500' : ''}`}
                        required
                      />
                      {validationErrors.email && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`neu-input mt-2 ${validationErrors.firstName ? 'border-red-500' : ''}`}
                        required
                      />
                      {validationErrors.firstName && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-foreground">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`neu-input mt-2 ${validationErrors.lastName ? 'border-red-500' : ''}`}
                        required
                      />
                      {validationErrors.lastName && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.lastName}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`neu-input mt-2 ${validationErrors.phone ? 'border-red-500' : ''}`}
                        placeholder="1234567890"
                        required
                      />
                      {validationErrors.phone && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
                      )}
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
                      <Label htmlFor="address" className="text-sm font-medium text-foreground">Street Address</Label>
                      <Input
                        id="address"
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="neu-input mt-2"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="city" className="text-sm font-medium text-foreground">City</Label>
                      <Input
                        id="city"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="neu-input mt-2"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode" className="text-sm font-medium text-foreground">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="neu-input mt-2"
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
                  
                  <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment} className="space-y-3 mb-6">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="relative">
                        <Label
                          htmlFor={method.id}
                          className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                            selectedPayment === method.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <div className="flex items-center space-x-3 flex-1">
                            {method.icon}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-foreground">{method.name}</span>
                                {method.popular && (
                                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{method.description}</p>
                              {method.processingFee && (
                                <p className="text-xs text-orange-600">Processing fee: {method.processingFee}</p>
                              )}
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {/* UPI Options */}
                  {selectedPayment === "upi" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4"
                    >
                      <h4 className="font-medium text-foreground">Choose UPI App</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {upiOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedOption(option.id)}
                            className={`p-3 rounded-lg text-center transition-all duration-300 ${
                              selectedOption === option.id
                                ? 'neu-inset text-primary'
                                : 'neu-button text-foreground hover:text-primary'
                            }`}
                          >
                            <div className="text-xl mb-1">{option.logo}</div>
                            <div className="text-xs font-medium">{option.name}</div>
                          </button>
                        ))}
                      </div>
                      
                      {selectedOption === 'custom_upi' && (
                        <div className="mt-4">
                          <Label htmlFor="upi-id" className="text-sm font-medium text-foreground">Enter UPI ID</Label>
                          <Input
                            id="upi-id"
                            type="text"
                            placeholder="yourname@upi"
                            value={upiId}
                            onChange={(e) => {
                              setUpiId(e.target.value);
                              // Clear error when user starts typing
                              if (validationErrors.upiId) {
                                setValidationErrors(prev => ({
                                  ...prev,
                                  upiId: ''
                                }));
                              }
                            }}
                            className={`neu-input mt-2 ${validationErrors.upiId ? 'border-red-500' : ''}`}
                          />
                          {validationErrors.upiId && (
                            <p className="text-sm text-red-500 mt-1">{validationErrors.upiId}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter your UPI ID (e.g., yourname@paytm, yourname@oksbi)
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Net Banking Options */}
                  {selectedPayment === "netbanking" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4"
                    >
                      <h4 className="font-medium text-foreground">Select Your Bank</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {bankOptions.map((bank) => (
                          <button
                            key={bank.id}
                            type="button"
                            onClick={() => setSelectedOption(bank.id)}
                            className={`p-3 rounded-lg text-left flex items-center space-x-3 transition-all duration-300 ${
                              selectedOption === bank.id
                                ? 'neu-inset text-primary'
                                : 'neu-button text-foreground hover:text-primary'
                            }`}
                          >
                            <span className="text-lg">{bank.logo}</span>
                            <span className="text-sm font-medium">{bank.name}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Wallet Options */}
                  {selectedPayment === "wallets" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4"
                    >
                      <h4 className="font-medium text-foreground">Choose Wallet</h4>
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                        {walletOptions.map((wallet) => (
                          <button
                            key={wallet.id}
                            type="button"
                            onClick={() => setSelectedOption(wallet.id)}
                            className={`p-3 rounded-lg text-center transition-all duration-300 ${
                              selectedOption === wallet.id
                                ? 'neu-inset text-primary'
                                : 'neu-button text-foreground hover:text-primary'
                            }`}
                          >
                            <div className="text-xl mb-1">{wallet.logo}</div>
                            <div className="text-xs font-medium">{wallet.name}</div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Card Details */}
                  {selectedPayment === "card" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div className="md:col-span-2">
                        <Label htmlFor="cardNumber" className="text-sm font-medium text-foreground">Card Number</Label>
                        <Input
                          id="cardNumber"
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          placeholder="1234 5678 9012 3456"
                          className="neu-input mt-2"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="expiryDate" className="text-sm font-medium text-foreground">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          type="text"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          placeholder="MM/YY"
                          className="neu-input mt-2"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv" className="text-sm font-medium text-foreground">CVV</Label>
                        <Input
                          id="cvv"
                          type="text"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          placeholder="123"
                          className="neu-input mt-2"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="cardName" className="text-sm font-medium text-foreground">Cardholder Name</Label>
                        <Input
                          id="cardName"
                          type="text"
                          name="cardName"
                          value={formData.cardName}
                          onChange={handleInputChange}
                          className="neu-input mt-2"
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
                    <Card key={index} className="neu-inset p-3">
                      <div className="font-medium text-foreground text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.quantity} × {item.days} days × ₹{item.dailyRate}/day
                      </div>
                      <div className="text-right font-bold text-foreground">₹{item.subtotal.toLocaleString()}</div>
                    </Card>
                  ))}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{mockOrderSummary.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax (GST 18%)</span>
                    <span>₹{mockOrderSummary.tax.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between text-lg font-bold text-foreground">
                      <span>Total</span>
                      <span>₹{mockOrderSummary.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Selected Payment Method Summary */}
                {selectedPayment && (
                  <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center space-x-2 text-sm">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-foreground">
                        Payment via {paymentMethods.find(m => m.id === selectedPayment)?.name}
                      </span>
                    </div>
                    {selectedOption && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedPayment === 'upi' && `Using ${upiOptions.find(o => o.id === selectedOption)?.name}`}
                        {selectedPayment === 'netbanking' && `${bankOptions.find(o => o.id === selectedOption)?.name}`}
                        {selectedPayment === 'wallets' && `${walletOptions.find(o => o.id === selectedOption)?.name}`}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isProcessing || !selectedPayment || (!selectedOption && selectedPayment !== 'card')}
                  className="w-full py-4 font-medium neu-button bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Pay Securely - ₹{mockOrderSummary.total.toLocaleString()}
                    </>
                  )}
                </Button>

                {/* Security Notice */}
                <div className="mt-4 space-y-2">
                  <Card className="p-3 neu-inset bg-green-50/50 border-green-200/50">
                    <div className="flex items-center gap-2 text-xs text-green-700">
                      <Shield className="w-4 h-4" />
                      <span>256-bit SSL encrypted payment</span>
                    </div>
                  </Card>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Your payment information is secure and encrypted</p>
                    <p>• Powered by Razorpay - India's most trusted payment gateway</p>
                    <p>• PCI DSS compliant for maximum security</p>
                  </div>
                </div>

                {/* Payment Methods Logos */}
                <div className="mt-4 p-3 neu-inset rounded-lg">
                  <div className="text-xs text-muted-foreground text-center mb-2">We accept</div>
                  <div className="flex justify-center items-center space-x-3 text-2xl">
                    <span title="UPI">📱</span>
                    <span title="Cards">💳</span>
                    <span title="Net Banking">🏦</span>
                    <span title="Wallets">💰</span>
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