import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in real app, validate credentials
    if (username && password) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="neu p-8 w-80 flex flex-col items-center"
      >
        <motion.h1 
          className="text-2xl font-semibold mb-6 text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Login
        </motion.h1>
        
        <form onSubmit={handleLogin} className="w-full flex flex-col items-center">
          <motion.input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="neu-input w-full p-3 mb-4 text-foreground placeholder:text-muted-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            required
          />
          
          <motion.input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="neu-input w-full p-3 mb-6 text-foreground placeholder:text-muted-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            required
          />
          
          <motion.button
            type="submit"
            className="neu-button px-6 py-2 font-semibold text-foreground"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign In
          </motion.button>
        </form>
        
        <motion.p 
          className="mt-4 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Demo: Use any username/password
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;