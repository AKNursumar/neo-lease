import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotifications } from './NotificationContext';

export type RentalStatus = 'Pending' | 'Confirmed' | 'Active' | 'Completed' | 'Cancelled' | 'Overdue';

export interface Rental {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  dailyRate: number;
  quantity: number;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
  totalDays: number;
  totalAmount: number;
  securityDeposit: number;
  status: RentalStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  location: {
    pickup: string;
    delivery?: string;
  };
  payment: {
    method: string;
    transactionId?: string;
    status: 'Pending' | 'Paid' | 'Refunded' | 'Failed';
  };
}

export interface RentalFilters {
  status?: RentalStatus;
  startDate?: string;
  endDate?: string;
  category?: string;
  search?: string;
}

interface RentalContextType {
  rentals: Rental[];
  loading: boolean;
  createRental: (rental: Omit<Rental, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRentalStatus: (rentalId: string, status: RentalStatus, notes?: string) => Promise<void>;
  returnRental: (rentalId: string, actualReturnDate: string, condition: string) => Promise<void>;
  cancelRental: (rentalId: string, reason: string) => Promise<void>;
  extendRental: (rentalId: string, newEndDate: string) => Promise<void>;
  getUserRentals: (userId: string, filters?: RentalFilters) => Rental[];
  getAllRentals: (filters?: RentalFilters) => Rental[];
  getRentalById: (rentalId: string) => Rental | undefined;
  getUpcomingReturns: (days: number) => Rental[];
  getOverdueRentals: () => Rental[];
  calculateLateFee: (rental: Rental) => number;
}

const RentalContext = createContext<RentalContextType | undefined>(undefined);

export const useRentals = () => {
  const context = useContext(RentalContext);
  if (context === undefined) {
    throw new Error('useRentals must be used within a RentalProvider');
  }
  return context;
};

export const RentalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  // Load rentals from localStorage on mount
  useEffect(() => {
    const savedRentals = localStorage.getItem('leaselink_rentals');
    if (savedRentals) {
      try {
        const parsedRentals = JSON.parse(savedRentals);
        setRentals(parsedRentals);
        // Check for overdue rentals
        checkOverdueRentals(parsedRentals);
      } catch (error) {
        console.error('Failed to load rentals from localStorage:', error);
      }
    }
  }, []);

  // Save rentals to localStorage whenever rentals change
  useEffect(() => {
    localStorage.setItem('leaselink_rentals', JSON.stringify(rentals));
  }, [rentals]);

  const checkOverdueRentals = (rentalList: Rental[]) => {
    const today = new Date().toISOString().split('T')[0];
    const overdueRentals = rentalList.filter(
      rental => rental.status === 'Active' && rental.endDate < today
    );

    // Update overdue status and notify
    overdueRentals.forEach(rental => {
      if (rental.status !== 'Overdue') {
        updateRentalStatus(rental.id, 'Overdue', 'Automatically marked as overdue');
        addNotification({
          type: 'warning',
          title: 'Rental Overdue',
          message: `${rental.productName} rental is overdue. Please return immediately.`,
          action: {
            label: 'View Details',
            onClick: () => {
              // Navigate to rental details
              console.log('Navigate to rental details:', rental.id);
            },
          },
        });
      }
    });
  };

  const createRental = async (rentalData: Omit<Rental, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    setLoading(true);
    try {
      const id = `rental_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const newRental: Rental = {
        ...rentalData,
        id,
        createdAt: now,
        updatedAt: now,
      };

      setRentals(prev => [newRental, ...prev]);

      addNotification({
        type: 'success',
        title: 'Rental Created',
        message: `Your rental for ${rentalData.productName} has been confirmed.`,
      });

      return id;
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Rental Creation Failed',
        message: 'There was an error creating your rental. Please try again.',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateRentalStatus = async (rentalId: string, status: RentalStatus, notes?: string): Promise<void> => {
    setRentals(prev =>
      prev.map(rental =>
        rental.id === rentalId
          ? {
              ...rental,
              status,
              notes: notes || rental.notes,
              updatedAt: new Date().toISOString(),
            }
          : rental
      )
    );

    const rental = rentals.find(r => r.id === rentalId);
    if (rental) {
      addNotification({
        type: 'info',
        title: 'Rental Status Updated',
        message: `${rental.productName} rental status changed to ${status}.`,
      });
    }
  };

  const returnRental = async (rentalId: string, actualReturnDate: string, condition: string): Promise<void> => {
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental) throw new Error('Rental not found');

    const isLate = actualReturnDate > rental.endDate;
    const lateFee = isLate ? calculateLateFee(rental) : 0;

    setRentals(prev =>
      prev.map(r =>
        r.id === rentalId
          ? {
              ...r,
              status: 'Completed',
              actualReturnDate,
              notes: `Returned in ${condition} condition. ${isLate ? `Late fee: ₹${lateFee}` : ''}`,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );

    addNotification({
      type: 'success',
      title: 'Rental Returned',
      message: `${rental.productName} has been successfully returned. ${isLate ? `Late fee: ₹${lateFee}` : 'No additional charges.'}`,
    });
  };

  const cancelRental = async (rentalId: string, reason: string): Promise<void> => {
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental) throw new Error('Rental not found');

    setRentals(prev =>
      prev.map(r =>
        r.id === rentalId
          ? {
              ...r,
              status: 'Cancelled',
              notes: `Cancelled: ${reason}`,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );

    addNotification({
      type: 'info',
      title: 'Rental Cancelled',
      message: `Your rental for ${rental.productName} has been cancelled. Refund will be processed within 3-5 business days.`,
    });
  };

  const extendRental = async (rentalId: string, newEndDate: string): Promise<void> => {
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental) throw new Error('Rental not found');

    const originalDays = rental.totalDays;
    const newTotalDays = Math.ceil(
      (new Date(newEndDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const additionalDays = newTotalDays - originalDays;
    const additionalAmount = additionalDays * rental.dailyRate * rental.quantity;

    setRentals(prev =>
      prev.map(r =>
        r.id === rentalId
          ? {
              ...r,
              endDate: newEndDate,
              totalDays: newTotalDays,
              totalAmount: rental.totalAmount + additionalAmount,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );

    addNotification({
      type: 'success',
      title: 'Rental Extended',
      message: `${rental.productName} rental extended until ${newEndDate}. Additional amount: ₹${additionalAmount}`,
    });
  };

  const getUserRentals = (userId: string, filters?: RentalFilters): Rental[] => {
    let userRentals = rentals.filter(rental => rental.userId === userId);
    return applyFilters(userRentals, filters);
  };

  const getAllRentals = (filters?: RentalFilters): Rental[] => {
    return applyFilters(rentals, filters);
  };

  const applyFilters = (rentalList: Rental[], filters?: RentalFilters): Rental[] => {
    if (!filters) return rentalList;

    return rentalList.filter(rental => {
      if (filters.status && rental.status !== filters.status) return false;
      if (filters.category && rental.category !== filters.category) return false;
      if (filters.startDate && rental.startDate < filters.startDate) return false;
      if (filters.endDate && rental.endDate > filters.endDate) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          rental.productName.toLowerCase().includes(searchLower) ||
          rental.notes?.toLowerCase().includes(searchLower) ||
          rental.id.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  };

  const getRentalById = (rentalId: string): Rental | undefined => {
    return rentals.find(rental => rental.id === rentalId);
  };

  const getUpcomingReturns = (days: number): Rental[] => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateString = targetDate.toISOString().split('T')[0];

    return rentals.filter(
      rental => 
        rental.status === 'Active' && 
        rental.endDate <= targetDateString &&
        rental.endDate >= new Date().toISOString().split('T')[0]
    );
  };

  const getOverdueRentals = (): Rental[] => {
    const today = new Date().toISOString().split('T')[0];
    return rentals.filter(
      rental => 
        (rental.status === 'Active' || rental.status === 'Overdue') && 
        rental.endDate < today
    );
  };

  const calculateLateFee = (rental: Rental): number => {
    if (!rental.actualReturnDate || rental.actualReturnDate <= rental.endDate) {
      return 0;
    }

    const endDate = new Date(rental.endDate);
    const returnDate = new Date(rental.actualReturnDate);
    const lateDays = Math.ceil((returnDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Late fee: 20% of daily rate per day
    const lateFeePerDay = rental.dailyRate * 0.2;
    return lateDays * lateFeePerDay * rental.quantity;
  };

  const value = {
    rentals,
    loading,
    createRental,
    updateRentalStatus,
    returnRental,
    cancelRental,
    extendRental,
    getUserRentals,
    getAllRentals,
    getRentalById,
    getUpcomingReturns,
    getOverdueRentals,
    calculateLateFee,
  };

  return <RentalContext.Provider value={value}>{children}</RentalContext.Provider>;
};
