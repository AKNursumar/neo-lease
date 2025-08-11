import { motion } from "framer-motion";
import { useState } from "react";
import Navigation from "@/components/Navigation";
import KpiCard from "@/components/KpiCard";

// Mock data for admin dashboard
const adminKpis = [
  {
    title: "Total Revenue",
    value: "₹35,67,500", // Updated to Indian market scale
    icon: "💰",
    trend: { value: 18.2, isPositive: true }
  },
  {
    title: "Active Rentals",
    value: "127",
    icon: "📦",
    trend: { value: 12.5, isPositive: true }
  },
  {
    title: "Total Products",
    value: "324",
    icon: "🏪",
    trend: { value: 5.3, isPositive: true }
  },
  {
    title: "Customers",
    value: "1,249",
    icon: "👥",
    trend: { value: 24.1, isPositive: true }
  },
  {
    title: "Overdue Rentals",
    value: "8",
    icon: "⚠️",
    trend: { value: 33.3, isPositive: false }
  },
  {
    title: "Pending Returns",
    value: "23",
    icon: "📥",
    trend: { value: 7.2, isPositive: false }
  }
];

const recentActivities = [
  {
    id: 1,
    type: "rental",
    message: "New rental: Professional Camera Kit by John Doe",
    time: "2 minutes ago",
    status: "success"
  },
  {
    id: 2,
    type: "return",
    message: "Product returned: Power Drill Set by Jane Smith",
    time: "15 minutes ago",
    status: "info"
  },
  {
    id: 3,
    type: "overdue",
    message: "Overdue alert: DJ Mixer rental by Mike Johnson",
    time: "1 hour ago",
    status: "warning"
  },
  {
    id: 4,
    type: "payment",
    message: "Payment received: ₹32,500 from Sarah Wilson", // Updated to Indian market amount
    time: "2 hours ago",
    status: "success"
  },
  {
    id: 5,
    type: "cancellation",
    message: "Rental cancelled: Gaming Laptop by Tom Brown",
    time: "3 hours ago",
    status: "error"
  }
];

const topProducts = [
  { name: "Professional Camera Kit", rentals: 45, revenue: "₹2,92,500" }, // 45 × 6500
  { name: "MacBook Pro", rentals: 38, revenue: "₹4,56,000" }, // 38 × 12000
  { name: "DJ Mixer", rentals: 32, revenue: "₹2,30,400" }, // 32 × 7200
  { name: "Power Drill Set", rentals: 28, revenue: "₹50,400" }, // 28 × 1800
  { name: "Gaming Laptop", rentals: 25, revenue: "₹2,12,500" } // 25 × 8500
];

const AdminDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  const activityIcons = {
    rental: "📦",
    return: "📥",
    overdue: "⚠️",
    payment: "💰",
    cancellation: "❌"
  };

  const activityColors = {
    success: "text-accent",
    info: "text-primary",
    warning: "text-secondary",
    error: "text-destructive"
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Admin Dashboard ⚙️
                </h1>
                <p className="text-muted-foreground">
                  Monitor your rental business performance and manage operations.
                </p>
              </div>
              
              <div className="flex gap-2">
                {["24h", "7d", "30d", "90d"].map((period) => (
                  <motion.button
                    key={period}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                      selectedPeriod === period
                        ? 'neu-inset text-primary'
                        : 'neu-button text-foreground hover:text-primary'
                    }`}
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {period}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {adminKpis.map((kpi, index) => (
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="neu-card p-6"
            >
              <h3 className="text-xl font-bold text-foreground mb-4">Recent Activities</h3>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + (index * 0.1) }}
                    className="flex items-start gap-3 p-3 neu-inset rounded-lg"
                  >
                    <span className="text-lg">
                      {activityIcons[activity.type as keyof typeof activityIcons]}
                    </span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${activityColors[activity.status as keyof typeof activityColors]}`}>
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="neu-button w-full mt-4 py-2 text-sm font-medium text-foreground hover:text-primary"
              >
                View All Activities
              </motion.button>
            </motion.div>

            {/* Top Performing Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="neu-card p-6"
            >
              <h3 className="text-xl font-bold text-foreground mb-4">Top Performing Products</h3>
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <motion.div
                    key={product.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + (index * 0.1) }}
                    className="flex items-center justify-between p-3 neu-inset rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.rentals} rentals</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{product.revenue}</p>
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(product.rentals / 50) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round((product.rentals / 50) * 100)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="neu-card p-6 mt-6"
          >
            <h3 className="text-xl font-bold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Add Product", icon: "➕", action: "add-product" },
                { label: "Manage Bookings", icon: "📅", action: "bookings" },
                { label: "Generate Report", icon: "📊", action: "reports" },
                { label: "Customer Support", icon: "💬", action: "support" }
              ].map((action, index) => (
                <motion.button
                  key={action.action}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 + (index * 0.1) }}
                  className="neu-button p-4 flex flex-col items-center gap-2 text-foreground hover:text-primary"
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="text-sm font-medium">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;