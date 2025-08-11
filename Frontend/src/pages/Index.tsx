import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-4xl mx-auto"
      >
        <motion.h1 
          className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          LeaseLink
        </motion.h1>
        
        <motion.p 
          className="text-xl text-muted-foreground mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Your Complete Rental Management System
          {isAuthenticated && (
            <span className="block text-sm mt-2">
              Welcome back, <strong>{user?.username}</strong> ({user?.role})
            </span>
          )}
        </motion.p>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => isAuthenticated ? navigate('/products') : navigate('/login')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🏠</span>
                Browse Products
              </CardTitle>
              <CardDescription>
                Explore our wide range of rental items available for lease
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => isAuthenticated ? navigate('/dashboard') : navigate('/login')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Dashboard
              </CardTitle>
              <CardDescription>
                View your rental analytics and manage your account
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => isAuthenticated ? navigate('/admin') : navigate('/login')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                Admin Panel
              </CardTitle>
              <CardDescription>
                Manage inventory, users, and system settings
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {isAuthenticated ? (
            <>
              <Button 
                size="lg" 
                onClick={() => navigate('/dashboard')}
                className="text-lg px-8 py-3"
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/products')}
                className="text-lg px-8 py-3"
              >
                Browse Products
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="text-lg px-8 py-3"
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/login')}
                className="text-lg px-8 py-3"
              >
                Sign In
              </Button>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
