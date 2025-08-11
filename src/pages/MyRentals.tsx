import { motion } from "framer-motion";
import { useState } from "react";
import Navigation from "@/components/Navigation";

interface Rental {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  status: "Confirmed" | "Active" | "Returned" | "Overdue" | "Cancelled";
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalAmount: number;
  returnDate?: string;
}

const mockRentals: Rental[] = [
  {
    id: 1,
    productId: 1,
    productName: "Professional Camera Kit",
    productImage: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=150&h=100&fit=crop",
    status: "Active",
    startDate: "2025-08-10",
    endDate: "2025-08-15",
    dailyRate: 85,
    totalAmount: 425
  },
  {
    id: 2,
    productId: 7,
    productName: "MacBook Pro",
    productImage: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=150&h=100&fit=crop",
    status: "Confirmed",
    startDate: "2025-08-20",
    endDate: "2025-08-25",
    dailyRate: 150,
    totalAmount: 750
  },
  {
    id: 3,
    productId: 2,
    productName: "Power Drill Set",
    productImage: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=150&h=100&fit=crop",
    status: "Returned",
    startDate: "2025-08-01",
    endDate: "2025-08-05",
    dailyRate: 25,
    totalAmount: 125,
    returnDate: "2025-08-05"
  },
  {
    id: 4,
    productId: 4,
    productName: "DJ Mixer",
    productImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=100&fit=crop",
    status: "Overdue",
    startDate: "2025-08-05",
    endDate: "2025-08-08",
    dailyRate: 95,
    totalAmount: 285
  }
];

const statusColors = {
  Confirmed: "text-primary",
  Active: "text-accent",
  Returned: "text-muted-foreground",
  Overdue: "text-destructive",
  Cancelled: "text-muted-foreground"
};

const statusBgColors = {
  Confirmed: "bg-primary/10",
  Active: "bg-accent/10",
  Returned: "bg-muted/20",
  Overdue: "bg-destructive/10",
  Cancelled: "bg-muted/20"
};

const MyRentals = () => {
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const filteredRentals = filterStatus === "All" 
    ? mockRentals 
    : mockRentals.filter(rental => rental.status === filterStatus);

  const handleExtendRental = (rentalId: number) => {
    console.log(`Extending rental ${rentalId}`);
    // In real app, handle rental extension
  };

  const handleCancelRental = (rentalId: number) => {
    console.log(`Cancelling rental ${rentalId}`);
    // In real app, handle rental cancellation
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
              My Rentals 📋
            </h1>
            <p className="text-muted-foreground">
              Track and manage your current and past rentals.
            </p>
          </motion.div>

          {/* Status Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="neu-card p-4 mb-6"
          >
            <div className="flex gap-2 flex-wrap">
              {["All", "Confirmed", "Active", "Returned", "Overdue", "Cancelled"].map((status) => (
                <motion.button
                  key={status}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    filterStatus === status
                      ? 'neu-inset text-primary'
                      : 'neu-button text-foreground hover:text-primary'
                  }`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Rentals List */}
          <div className="space-y-4">
            {filteredRentals.map((rental, index) => (
              <motion.div
                key={rental.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (index * 0.1) }}
                className="neu-card p-6"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Product Info */}
                  <div className="flex gap-4 flex-1">
                    <div className="w-20 h-20 neu-inset rounded-xl overflow-hidden">
                      <img 
                        src={rental.productImage} 
                        alt={rental.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {rental.productName}
                      </h3>
                      <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusColors[rental.status]} ${statusBgColors[rental.status]}`}>
                        {rental.status}
                      </div>
                    </div>
                  </div>

                  {/* Rental Details */}
                  <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Start Date:</span>
                      <p className="font-medium text-foreground">{formatDate(rental.startDate)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End Date:</span>
                      <p className="font-medium text-foreground">{formatDate(rental.endDate)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Daily Rate:</span>
                      <p className="font-medium text-foreground">${rental.dailyRate}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Amount:</span>
                      <p className="font-medium text-foreground">${rental.totalAmount}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    {rental.status === "Active" && (
                      <>
                        <div className="text-xs text-center">
                          {getDaysRemaining(rental.endDate) > 0 ? (
                            <span className="text-accent">
                              {getDaysRemaining(rental.endDate)} days left
                            </span>
                          ) : (
                            <span className="text-destructive">Overdue</span>
                          )}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="neu-button px-3 py-2 text-xs font-medium text-foreground hover:text-primary"
                          onClick={() => handleExtendRental(rental.id)}
                        >
                          Extend Rental
                        </motion.button>
                      </>
                    )}
                    
                    {rental.status === "Confirmed" && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="neu-button px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleCancelRental(rental.id)}
                      >
                        Cancel
                      </motion.button>
                    )}

                    {rental.status === "Overdue" && (
                      <div className="text-xs text-center text-destructive font-medium">
                        Late fee applies
                      </div>
                    )}

                    {rental.returnDate && (
                      <div className="text-xs text-center text-muted-foreground">
                        Returned: {formatDate(rental.returnDate)}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredRentals.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="neu-card p-12 text-center"
            >
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No rentals found</h3>
              <p className="text-muted-foreground">You don't have any rentals with this status</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MyRentals;