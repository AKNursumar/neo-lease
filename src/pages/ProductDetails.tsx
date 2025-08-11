import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";

// Mock product data - in real app, fetch by ID
const mockProduct = {
  id: 1,
  name: "Professional Camera Kit",
  price: 85,
  category: "Photography",
  description: "Professional DSLR camera kit perfect for photography and videography projects. Includes camera body, multiple lenses, tripod, lighting equipment, and carrying case.",
  features: [
    "Full-frame DSLR camera body",
    "24-70mm f/2.8 lens",
    "85mm f/1.8 portrait lens",
    "Professional tripod",
    "LED lighting kit",
    "Memory cards and batteries",
    "Protective carrying case"
  ],
  specifications: {
    "Sensor": "Full-frame CMOS",
    "Resolution": "24.2 MP",
    "Video": "4K at 30fps",
    "Weight": "3.2 kg (complete kit)",
    "Condition": "Excellent"
  },
  images: [
    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1627735000631-45b783e40e0a?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=400&fit=crop"
  ],
  available: true,
  rating: 4.8,
  reviews: 24
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState(1);

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days * mockProduct.price * quantity : 0;
  };

  const handleAddToCart = () => {
    if (!startDate || !endDate) {
      alert("Please select rental dates");
      return;
    }
    console.log("Adding to cart:", {
      productId: id,
      startDate,
      endDate,
      quantity,
      total: calculateTotal()
    });
    // In real app, add to cart and navigate to cart
    navigate("/cart");
  };

  const handleRentNow = () => {
    if (!startDate || !endDate) {
      alert("Please select rental dates");
      return;
    }
    console.log("Rent now:", {
      productId: id,
      startDate,
      endDate,
      quantity,
      total: calculateTotal()
    });
    // In real app, proceed directly to checkout
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
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            className="neu-button px-4 py-2 mb-6 text-sm font-medium text-foreground"
            onClick={() => navigate(-1)}
          >
            ← Back to Products
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              {/* Main Image */}
              <div className="neu-card p-4">
                <div className="aspect-square bg-muted rounded-xl overflow-hidden neu-inset">
                  <img
                    src={mockProduct.images[selectedImage]}
                    alt={mockProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Thumbnail Images */}
              <div className="flex gap-2">
                {mockProduct.images.map((image, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 aspect-square rounded-lg overflow-hidden ${
                      selectedImage === index ? 'neu-inset' : 'neu-button'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={image}
                      alt={`${mockProduct.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Basic Info */}
              <div className="neu-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 text-xs font-medium text-primary neu-inset rounded-lg mb-2">
                      {mockProduct.category}
                    </span>
                    <h1 className="text-3xl font-bold text-foreground">{mockProduct.name}</h1>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">${mockProduct.price}</div>
                    <div className="text-sm text-muted-foreground">per day</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★★★★★</span>
                    <span className="text-sm text-muted-foreground">
                      {mockProduct.rating} ({mockProduct.reviews} reviews)
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 ${mockProduct.available ? 'text-accent' : 'text-destructive'}`}>
                    <div className={`w-2 h-2 rounded-full ${mockProduct.available ? 'bg-accent' : 'bg-destructive'}`} />
                    <span className="text-sm font-medium">
                      {mockProduct.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  {mockProduct.description}
                </p>
              </div>

              {/* Rental Calculator */}
              <div className="neu-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Rental Calculator</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="neu-input w-full p-3 text-foreground"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="neu-input w-full p-3 text-foreground"
                      min={startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Quantity</label>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="neu-button p-2 text-foreground"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </motion.button>
                    <div className="neu-inset px-4 py-2 text-center font-medium text-foreground">
                      {quantity}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="neu-button p-2 text-foreground"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </motion.button>
                  </div>
                </div>

                {calculateTotal() > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="neu-inset p-4 mb-4 text-center"
                  >
                    <div className="text-sm text-muted-foreground">Total Cost</div>
                    <div className="text-2xl font-bold text-primary">${calculateTotal()}</div>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="neu-button flex-1 py-3 font-medium text-foreground hover:text-primary"
                    onClick={handleAddToCart}
                    disabled={!mockProduct.available}
                  >
                    Add to Cart
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="neu-button flex-1 py-3 font-medium text-primary-foreground bg-primary hover:bg-primary/90"
                    onClick={handleRentNow}
                    disabled={!mockProduct.available}
                  >
                    Rent Now
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Info Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Features */}
            <div className="neu-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">What's Included</h3>
              <ul className="space-y-2">
                {mockProduct.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + (index * 0.1) }}
                    className="flex items-center gap-3 text-muted-foreground"
                  >
                    <span className="text-accent">✓</span>
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Specifications */}
            <div className="neu-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Specifications</h3>
              <div className="space-y-3">
                {Object.entries(mockProduct.specifications).map(([key, value], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + (index * 0.1) }}
                    className="flex justify-between items-center py-2 border-b border-border/50"
                  >
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetails;