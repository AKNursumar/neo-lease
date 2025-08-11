import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md mx-auto"
      >
        <Card className="p-8">
          <CardContent className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-8xl"
            >
              🔍
            </motion.div>
            
            <motion.h1 
              className="text-6xl font-bold text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              404
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
              <p className="text-muted-foreground mb-2">
                Oops! The page you're looking for doesn't exist.
              </p>
              <p className="text-sm text-muted-foreground">
                Path: <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code>
              </p>
            </motion.div>

            <motion.div 
              className="flex flex-col sm:flex-row gap-3 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                onClick={() => navigate("/")}
                className="px-6"
              >
                Go Home
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(-1)}
                className="px-6"
              >
                Go Back
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotFound;
