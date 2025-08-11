import { motion } from "framer-motion";
import { useState } from "react";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/ProductCard";

const categories = ["All", "Photography", "Tools", "Electronics", "Audio", "Sports", "Home"];

const allProducts = [
  {
    id: 1,
    name: "Professional Camera Kit",
    price: 85,
    image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=200&fit=crop",
    available: true,
    category: "Photography"
  },
  {
    id: 2,
    name: "Power Drill Set",
    price: 25,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop",
    available: true,
    category: "Tools"
  },
  {
    id: 3,
    name: "Gaming Laptop",
    price: 120,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&h=200&fit=crop",
    available: false,
    category: "Electronics"
  },
  {
    id: 4,
    name: "DJ Mixer",
    price: 95,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop",
    available: true,
    category: "Audio"
  },
  {
    id: 5,
    name: "DSLR Camera",
    price: 65,
    image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300&h=200&fit=crop",
    available: true,
    category: "Photography"
  },
  {
    id: 6,
    name: "Circular Saw",
    price: 35,
    image: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&h=200&fit=crop",
    available: true,
    category: "Tools"
  },
  {
    id: 7,
    name: "MacBook Pro",
    price: 150,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=200&fit=crop",
    available: true,
    category: "Electronics"
  },
  {
    id: 8,
    name: "Studio Monitors",
    price: 45,
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    available: false,
    category: "Audio"
  },
  {
    id: 9,
    name: "Tennis Racket Set",
    price: 20,
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=200&fit=crop",
    available: true,
    category: "Sports"
  },
  {
    id: 10,
    name: "Pressure Washer",
    price: 40,
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    available: true,
    category: "Home"
  }
];

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = allProducts.filter(product => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRentProduct = (productId: number) => {
    console.log(`Adding product ${productId} to cart`);
    // In real app, navigate to product details or add to cart
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
              Browse Products 📦
            </h1>
            <p className="text-muted-foreground">
              Discover and rent from our extensive collection of tools, electronics, and equipment.
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="neu-card p-6 mb-6"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="neu-input w-full p-3 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Category Filters */}
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <motion.button
                    key={category}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      selectedCategory === category
                        ? 'neu-inset text-primary'
                        : 'neu-button text-foreground hover:text-primary'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing {filteredProducts.length} products</span>
              <span>{filteredProducts.filter(p => p.available).length} available</span>
            </div>
          </motion.div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (index * 0.1) }}
              >
                <ProductCard 
                  product={product} 
                  onRent={handleRentProduct}
                />
              </motion.div>
            ))}
          </motion.div>

          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="neu-card p-12 text-center"
            >
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Products;