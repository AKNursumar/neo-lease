import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn, User, ShoppingCart } from "lucide-react";
import DarkModeToggle from "./DarkModeToggle";
import { getUserRole } from "@/lib/supabase";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: "Home", path: "/", icon: "🏡" },
  { label: "Dashboard", path: "/dashboard", icon: "🏠" },
  { label: "Products", path: "/products", icon: "📦" },
  { label: "My Rentals", path: "/rentals", icon: "📋" },
  { label: "Cart", path: "/cart", icon: "🛒" },
  { label: "Admin", path: "/admin", icon: "⚙️" },
];

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useSupabaseAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [cartItemCount] = useState(0); // TODO: Implement cart context for Supabase

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const role = await getUserRole();
        setUserRole(role);
      } else {
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [user]);

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (item.path === '/admin') {
      return userRole === 'admin';
    }
    return true;
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="neu-card mb-6 p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <motion.h1 
            className="text-xl font-bold text-primary"
            whileHover={{ scale: 1.05 }}
          >
            LeaseLink
          </motion.h1>
          
          <div className="flex gap-2">
            {filteredNavItems.map((item) => (
              <motion.button
                key={item.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  location.pathname === item.path
                    ? 'neu-inset text-primary'
                    : 'neu-button text-foreground hover:text-primary'
                }`}
                onClick={() => navigate(item.path)}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </motion.button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          
          {/* Cart Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/cart")}
            className="neu-button relative text-foreground hover:text-primary"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartItemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center"
              >
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </motion.span>
            )}
          </Button>
          
          {user && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-3 py-1 neu-inset rounded-lg"
            >
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {user.user_metadata?.full_name || user.email}
              </span>
              {userRole === 'admin' && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </motion.div>
          )}
          
          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="neu-button text-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogin}
              className="neu-button text-foreground hover:text-primary"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;
