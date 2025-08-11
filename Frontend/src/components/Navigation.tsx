import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "🏠" },
  { label: "Products", path: "/products", icon: "📦" },
  { label: "My Rentals", path: "/rentals", icon: "📋" },
  { label: "Admin", path: "/admin", icon: "⚙️" },
];

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate("/");
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
            {navItems.map((item) => (
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
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="neu-button px-4 py-2 text-sm font-medium text-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          Logout
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default Navigation;