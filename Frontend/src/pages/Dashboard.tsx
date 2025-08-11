import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import KpiCard from "@/components/KpiCard";
import ProductCard from "@/components/ProductCard";

// Mock data
const kpiData = [
  {
    title: "Total Revenue",
    value: "₹9,85,000", // Updated to Indian market scale
    icon: "💰",
    trend: { value: 12.5, isPositive: true }
  },
  {
    title: "Active Rentals",
    value: "24",
    icon: "📦",
    trend: { value: 8.2, isPositive: true }
  },
  {
    title: "Available Items",
    value: "156",
    icon: "✅",
    trend: { value: 3.1, isPositive: false }
  },
  {
    title: "Customers",
    value: "89",
    icon: "👥",
    trend: { value: 15.3, isPositive: true }
  }
];

const featuredProducts = [
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
  }
];

const Dashboard = () => {
  const handleRentProduct = (productId: number) => {
    console.log(`Renting product ${productId}`);
    // In real app, handle rental logic
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
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="neu-card mb-6 p-6"
          >
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome back! 👋
            </h2>
            <p className="text-muted-foreground">
              Here's what's happening with your rentals today.
            </p>
          </motion.div>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpiData.map((kpi, index) => (
              <KpiCard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                icon={kpi.icon}
                trend={kpi.trend}
                delay={index * 0.1}
              />
            ))}
          </div>
          
          {/* Featured Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="neu-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Featured Products</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="neu-button px-4 py-2 text-sm font-medium text-foreground hover:text-primary"
              >
                View All
              </motion.button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + (index * 0.1) }}
                >
                  <ProductCard 
                    product={product} 
                    onRent={handleRentProduct}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;