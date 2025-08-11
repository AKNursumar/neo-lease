import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Bell,
  Shield,
  Activity,
  Calendar,
  MapPin,
  Star,
  MessageSquare,
  Ban,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

interface AdminStats {
  totalUsers: number;
  totalRentals: number;
  totalRevenue: number;
  activeListings: number;
  monthlyGrowth: {
    users: number;
    rentals: number;
    revenue: number;
    listings: number;
  };
  revenueData: Array<{ month: string; revenue: number; rentals: number }>;
  categoryData: Array<{ name: string; value: number; color: string }>;
  userGrowthData: Array<{ month: string; users: number }>;
  topUsers: Array<{
    id: string;
    name: string;
    avatar: string;
    totalRentals: number;
    revenue: number;
    rating: number;
    status: 'active' | 'inactive' | 'suspended';
  }>;
  recentRentals: Array<{
    id: string;
    product: string;
    user: string;
    amount: number;
    status: 'active' | 'completed' | 'cancelled' | 'overdue';
    date: Date;
  }>;
  systemAlerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

interface AdminDashboardProps {
  stats: AdminStats;
  onRefreshStats: () => void;
  onExportData: (type: string) => void;
  onUserAction: (userId: string, action: string) => void;
  onRentalAction: (rentalId: string, action: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  onRefreshStats,
  onExportData,
  onUserAction,
  onRentalAction,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('30d');

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, icon, color }) => (
    <Card className="neu-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <div className={cn(
              "flex items-center gap-1 text-sm mt-2",
              change >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(change)}% from last month</span>
            </div>
          </div>
          <div className={cn("p-3 rounded-full", color)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AlertCard: React.FC<{ alert: AdminStats['systemAlerts'][0] }> = ({ alert }) => (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border-l-4",
      alert.type === 'error' && "border-red-500 bg-red-50 dark:bg-red-950/30",
      alert.type === 'warning' && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30",
      alert.type === 'info' && "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
    )}>
      <div className={cn(
        "p-1 rounded-full",
        alert.type === 'error' && "bg-red-500",
        alert.type === 'warning' && "bg-yellow-500",
        alert.type === 'info' && "bg-blue-500"
      )}>
        <AlertTriangle className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{alert.message}</p>
        <p className="text-xs text-muted-foreground">
          {alert.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage and monitor your rental platform</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="neu-input w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onRefreshStats} variant="outline" className="neu-button">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => onExportData('overview')} className="neu-button">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={stats.monthlyGrowth.users}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Rentals"
          value={stats.totalRentals.toLocaleString()}
          change={stats.monthlyGrowth.rentals}
          icon={<Package className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          change={stats.monthlyGrowth.revenue}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title="Active Listings"
          value={stats.activeListings.toLocaleString()}
          change={stats.monthlyGrowth.listings}
          icon={<Activity className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 neu-card mb-8">
          <TabsTrigger value="overview" className="neu-button">Overview</TabsTrigger>
          <TabsTrigger value="users" className="neu-button">Users</TabsTrigger>
          <TabsTrigger value="rentals" className="neu-button">Rentals</TabsTrigger>
          <TabsTrigger value="analytics" className="neu-button">Analytics</TabsTrigger>
          <TabsTrigger value="alerts" className="neu-button">Alerts</TabsTrigger>
          <TabsTrigger value="settings" className="neu-button">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="neu-card">
              <CardHeader>
                <CardTitle>Revenue & Rentals Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="rentals" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="neu-card">
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {stats.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-4">
                  {stats.categoryData.map((category, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="text-xs text-muted-foreground">{category.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Users */}
            <Card className="neu-card">
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topUsers.slice(0, 5).map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.totalRentals} rentals</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">₹{user.revenue.toLocaleString()}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{user.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Rentals */}
            <Card className="neu-card">
              <CardHeader>
                <CardTitle>Recent Rentals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentRentals.slice(0, 5).map((rental) => (
                    <div key={rental.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{rental.product}</p>
                        <p className="text-xs text-muted-foreground">by {rental.user}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">₹{rental.amount}</p>
                        <Badge
                          variant={
                            rental.status === 'active' ? 'default' :
                            rental.status === 'completed' ? 'secondary' :
                            rental.status === 'cancelled' ? 'destructive' : 'outline'
                          }
                          className="text-xs"
                        >
                          {rental.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="neu-input pl-10"
                />
              </div>
              <Button variant="outline" className="neu-button">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
            <Button onClick={() => onExportData('users')} className="neu-button">
              <Download className="w-4 h-4 mr-2" />
              Export Users
            </Button>
          </div>

          <Card className="neu-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rentals</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">user@example.com</TableCell>
                      <TableCell>{user.totalRentals}</TableCell>
                      <TableCell>₹{user.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{user.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === 'active' ? 'default' :
                            user.status === 'inactive' ? 'secondary' : 'destructive'
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="neu-button"
                            onClick={() => onUserAction(user.id, 'view')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {user.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onUserAction(user.id, 'suspend')}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => onUserAction(user.id, 'activate')}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rentals Tab */}
        <TabsContent value="rentals" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <Select defaultValue="all">
                <SelectTrigger className="neu-input w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => onExportData('rentals')} className="neu-button">
              <Download className="w-4 h-4 mr-2" />
              Export Rentals
            </Button>
          </div>

          <Card className="neu-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rental ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentRentals.map((rental) => (
                    <TableRow key={rental.id}>
                      <TableCell className="font-mono text-sm">{rental.id}</TableCell>
                      <TableCell className="font-medium">{rental.product}</TableCell>
                      <TableCell>{rental.user}</TableCell>
                      <TableCell>₹{rental.amount}</TableCell>
                      <TableCell>{rental.date.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            rental.status === 'active' ? 'default' :
                            rental.status === 'completed' ? 'secondary' :
                            rental.status === 'cancelled' ? 'destructive' : 'outline'
                          }
                        >
                          {rental.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="neu-button"
                            onClick={() => onRentalAction(rental.id, 'view')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="neu-button"
                            onClick={() => onRentalAction(rental.id, 'message')}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth */}
            <Card className="neu-card">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="neu-card">
              <CardHeader>
                <CardTitle>Platform Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">User Retention Rate</span>
                    <span className="text-sm font-medium">87%</span>
                  </div>
                  <Progress value={87} className="neu-inset" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Average Order Value</span>
                    <span className="text-sm font-medium">₹2,450</span>
                  </div>
                  <Progress value={75} className="neu-inset" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Customer Satisfaction</span>
                    <span className="text-sm font-medium">4.6/5.0</span>
                  </div>
                  <Progress value={92} className="neu-inset" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card className="neu-card">
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.systemAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="neu-card">
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="neu-button h-20 flex-col">
                  <Settings className="w-6 h-6 mb-2" />
                  General Settings
                </Button>
                <Button variant="outline" className="neu-button h-20 flex-col">
                  <Bell className="w-6 h-6 mb-2" />
                  Notifications
                </Button>
                <Button variant="outline" className="neu-button h-20 flex-col">
                  <Shield className="w-6 h-6 mb-2" />
                  Security
                </Button>
                <Button variant="outline" className="neu-button h-20 flex-col">
                  <DollarSign className="w-6 h-6 mb-2" />
                  Payment Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
