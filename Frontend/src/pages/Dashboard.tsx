import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Calendar,
  Heart,
  TrendingUp,
  Clock,
  DollarSign,
  Star,
  ShoppingCart,
  Bell,
  Settings,
  Activity,
  MapPin,
  Eye,
  MessageSquare,
  CreditCard,
  Shield
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useCart } from '@/contexts/CartContext';
import { useRentals } from '@/contexts/RentalContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';

interface DashboardStats {
  activeRentals: number;
  totalRentals: number;
  totalSpent: number;
  savedAmount: number;
  upcomingReturns: number;
  favoriteItems: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
  color: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useSupabaseAuth();
  const { items: cartItems } = useCart();
  const { getUserRentals } = useRentals();
  const { notifications } = useNotifications();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isInitialized, setIsInitialized] = useState(false);

  // Redirect to login if not authenticated (only once)
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  // Memoize user rentals to prevent unnecessary recalculations
  const userRentals = useMemo(() => {
    return user?.id ? getUserRentals(user.id) : [];
  }, [user?.id, getUserRentals]);

  // Memoize dashboard stats to prevent recalculation on every render
  const stats = useMemo<DashboardStats>(() => {
    if (!user?.id || userRentals.length === 0) {
      return {
        activeRentals: 0,
        totalRentals: 0,
        totalSpent: 0,
        savedAmount: 0,
        upcomingReturns: 0,
        favoriteItems: 12, // Mock data
      };
    }

    const activeRentals = userRentals.filter(r => r.status === 'Active').length;
    const totalSpent = userRentals.reduce((sum, rental) => sum + rental.totalAmount, 0);
    const upcomingReturns = userRentals.filter(r => 
      r.status === 'Active' && 
      new Date(r.endDate).getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000
    ).length;

    return {
      activeRentals,
      totalRentals: userRentals.length,
      totalSpent,
      savedAmount: Math.floor(totalSpent * 0.3), // Assume 30% savings vs buying
      upcomingReturns,
      favoriteItems: 12, // Mock data
    };
  }, [user?.id, userRentals]);

  // Set initialized flag after first render to prevent initial flickering
  useEffect(() => {
    if (!loading && user) {
      setIsInitialized(true);
    }
  }, [loading, user]);

  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'browse',
      title: 'Browse Products',
      description: 'Discover new items to rent',
      icon: <Package className="w-6 h-6 text-white" />,
      action: () => navigate('/products'),
      color: 'bg-blue-500',
    },
    {
      id: 'cart',
      title: 'View Cart',
      description: 'Check items in your cart',
      icon: <ShoppingCart className="w-6 h-6 text-white" />,
      action: () => navigate('/cart'),
      badge: cartItems.length > 0 ? cartItems.length.toString() : undefined,
      color: 'bg-green-500',
    },
    {
      id: 'rentals',
      title: 'My Rentals',
      description: 'Manage your active rentals',
      icon: <Calendar className="w-6 h-6 text-white" />,
      action: () => navigate('/my-rentals'),
      badge: stats.activeRentals > 0 ? stats.activeRentals.toString() : undefined,
      color: 'bg-purple-500',
    },
    {
      id: 'favorites',
      title: 'Favorites',
      description: 'View your favorite items',
      icon: <Heart className="w-6 h-6 text-white" />,
      action: () => navigate('/favorites'),
      badge: stats.favoriteItems > 0 ? stats.favoriteItems.toString() : undefined,
      color: 'bg-red-500',
    },
  ], [navigate, cartItems.length, stats.activeRentals, stats.favoriteItems]);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: number;
    description?: string;
  }> = ({ title, value, icon, color, trend, description }) => (
    <Card className="neu-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-sm mt-2",
                trend > 0 ? "text-green-600" : "text-red-600"
              )}>
                <TrendingUp className={cn("w-4 h-4", trend < 0 && "rotate-180")} />
                <span>{Math.abs(trend)}% from last month</span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-full", color)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const QuickActionCard: React.FC<{ action: QuickAction }> = ({ action }) => (
    <Card className="neu-card cursor-pointer hover:neu-inset transition-all duration-200">
      <CardContent className="p-6" onClick={action.action}>
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-full", action.color)}>
            {action.icon}
          </div>
          {action.badge && (
            <Badge className="bg-primary text-primary-foreground">
              {action.badge}
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-lg text-foreground mb-1">{action.title}</h3>
        <p className="text-sm text-muted-foreground">{action.description}</p>
      </CardContent>
    </Card>
  );

  const RecentActivity = useCallback(() => (
    <Card className="neu-card">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {userRentals.slice(0, 5).map((rental, index) => (
          <div key={rental.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              rental.status === 'Active' ? "bg-green-100 text-green-600" :
              rental.status === 'Completed' ? "bg-blue-100 text-blue-600" :
              "bg-gray-100 text-gray-600"
            )}>
              <Package className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{rental.productName}</p>
              <p className="text-xs text-muted-foreground">
                {rental.status === 'Active' ? 'Currently rented' : 'Completed'} • 
                ₹{rental.totalAmount} • {new Date(rental.endDate).toLocaleDateString()}
              </p>
            </div>
            <Badge variant={
              rental.status === 'Active' ? 'default' :
              rental.status === 'Completed' ? 'secondary' : 'outline'
            }>
              {rental.status}
            </Badge>
          </div>
        ))}
        
        {userRentals.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No rental activity yet</p>
            <Button
              variant="outline"
              className="neu-button mt-4"
              onClick={() => navigate('/products')}
            >
              Browse Products
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  ), [userRentals, navigate]);

  const UpcomingReturns = useCallback(() => (
    <Card className="neu-card">
      <CardHeader>
        <CardTitle>Upcoming Returns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {userRentals.filter(r => r.status === 'Active').slice(0, 3).map((rental) => (
          <div key={rental.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">{rental.productName}</p>
              <p className="text-xs text-muted-foreground">
                Due: {new Date(rental.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={
                new Date(rental.endDate).getTime() - Date.now() <= 24 * 60 * 60 * 1000 ? 'destructive' :
                new Date(rental.endDate).getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000 ? 'secondary' : 'outline'
              }>
                {Math.ceil((new Date(rental.endDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days
              </Badge>
            </div>
          </div>
        ))}
        
        {userRentals.filter(r => r.status === 'Active').length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active rentals</p>
          </div>
        )}
      </CardContent>
    </Card>
  ), [userRentals]);

  // Show loading state while checking authentication
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto">
          <Navigation />
          <div className="neu-card p-12 text-center mt-8 mx-4">
            <div className="text-4xl mb-4 animate-spin">🔄</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Loading Dashboard</h2>
            <p className="text-muted-foreground">Please wait while we prepare your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto">
          <Navigation />
          <div className="neu-card p-12 text-center mt-8 mx-4">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Please log in to view your dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <Navigation />
        
        <div className="p-4 space-y-8">
          {/* Welcome Header */}
          <div className="neu-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 neu-inset">
                  <AvatarImage src="/placeholder.svg" alt={user?.user_metadata?.full_name || user?.email} />
                  <AvatarFallback className="text-lg">
                    {(user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Welcome back, {user?.user_metadata?.full_name || user?.email}! 👋
                  </h1>
                  <p className="text-muted-foreground">
                    Here's your rental activity overview
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="neu-button"
                onClick={() => navigate('/profile')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Profile Settings
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Active Rentals"
              value={stats.activeRentals}
              icon={<Activity className="w-6 h-6 text-white" />}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Rentals"
              value={stats.totalRentals}
              icon={<Package className="w-6 h-6 text-white" />}
              color="bg-green-500"
            />
            <StatCard
              title="Total Spent"
              value={`₹${stats.totalSpent.toLocaleString()}`}
              icon={<DollarSign className="w-6 h-6 text-white" />}
              color="bg-purple-500"
            />
            <StatCard
              title="Amount Saved"
              value={`₹${stats.savedAmount.toLocaleString()}`}
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              color="bg-orange-500"
              description="vs buying"
            />
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action) => (
                <QuickActionCard key={action.id} action={action} />
              ))}
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 neu-card mb-8">
              <TabsTrigger value="overview" className="neu-button">Overview</TabsTrigger>
              <TabsTrigger value="activity" className="neu-button">Activity</TabsTrigger>
              <TabsTrigger value="rentals" className="neu-button">Rentals</TabsTrigger>
              <TabsTrigger value="account" className="neu-button">Account</TabsTrigger>
            </TabsList>

            <div>
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RecentActivity />
                  <UpcomingReturns />
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <RecentActivity />
              </TabsContent>

            <TabsContent value="rentals" className="space-y-6">
              <Card className="neu-card">
                <CardHeader>
                  <CardTitle>All Rentals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userRentals.map((rental) => (
                      <div key={rental.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{rental.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{rental.totalAmount}</p>
                          <Badge variant={
                            rental.status === 'Active' ? 'default' :
                            rental.status === 'Completed' ? 'secondary' : 'outline'
                          }>
                            {rental.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {userRentals.length === 0 && (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No rentals yet</h3>
                        <p className="text-muted-foreground mb-4">Start exploring our products to make your first rental</p>
                        <Button
                          className="neu-button"
                          onClick={() => navigate('/products')}
                        >
                          Browse Products
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="neu-card">
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Email</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <span className="font-medium">{user?.user_metadata?.full_name || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Member since</span>
                      <span className="font-medium">January 2024</span>
                    </div>
                    <Button
                      variant="outline"
                      className="neu-button w-full mt-4"
                      onClick={() => navigate('/profile')}
                    >
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>

                <Card className="neu-card">
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Notifications</span>
                        </div>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Privacy</span>
                        </div>
                        <Badge variant="outline">Private</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Payment Methods</span>
                        </div>
                        <Badge variant="outline">1 Added</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="neu-button w-full mt-4"
                      onClick={() => navigate('/settings')}
                    >
                      Manage Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;