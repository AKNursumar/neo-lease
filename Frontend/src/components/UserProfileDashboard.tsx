import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Edit3, 
  Star, 
  Calendar,
  Package,
  TrendingUp,
  Clock,
  DollarSign,
  Award,
  Shield,
  Camera,
  Settings,
  Bell,
  CreditCard,
  LogOut,
  ChevronRight,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  location: string;
  bio: string;
  joinDate: Date;
  verified: boolean;
  rating: number;
  reviewCount: number;
  responseRate: number;
  rentalsCount: number;
  totalEarnings: number;
  completionRate: number;
  badges: string[];
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
    darkMode: boolean;
  };
  stats: {
    activeRentals: number;
    totalRentals: number;
    totalListings: number;
    monthlyEarnings: number;
    averageRating: number;
    responseTime: string;
  };
}

interface UserProfileDashboardProps {
  user: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onLogout: () => void;
  onUploadAvatar: (file: File) => void;
}

const UserProfileDashboard: React.FC<UserProfileDashboardProps> = ({
  user,
  onUpdateProfile,
  onLogout,
  onUploadAvatar,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    location: user.location,
    bio: user.bio,
  });

  const handleSaveProfile = () => {
    onUpdateProfile(editData);
    setIsEditing(false);
  };

  const handlePreferenceChange = (key: keyof UserProfile['preferences'], value: boolean) => {
    const newPreferences = { ...user.preferences, [key]: value };
    onUpdateProfile({ preferences: newPreferences });
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadAvatar(file);
    }
  };

  const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; subtitle?: string; trend?: number }> = ({ 
    icon, 
    title, 
    value, 
    subtitle,
    trend 
  }) => (
    <Card className="neu-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm text-muted-foreground">{title}</span>
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              trend > 0 ? "text-green-600" : "text-red-600"
            )}>
              <TrendingUp className={cn("w-3 h-3", trend < 0 && "rotate-180")} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neu-card p-6 mb-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar Section */}
          <div className="relative group">
            <Avatar className="w-24 h-24 neu-inset">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
            {user.verified && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">{user.name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {user.joinDate.getFullYear()}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="neu-button mt-4 sm:mt-0"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>

            {/* Badges and Stats */}
            <div className="flex flex-wrap gap-2 mb-4">
              {user.badges.map((badge, index) => (
                <Badge key={index} variant="secondary" className="neu-inset">
                  <Award className="w-3 h-3 mr-1" />
                  {badge}
                </Badge>
              ))}
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
                <Star className="w-3 h-3 mr-1" />
                {user.rating.toFixed(1)} Rating
              </Badge>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{user.rentalsCount}</div>
                <div className="text-xs text-muted-foreground">Total Rentals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{user.responseRate}%</div>
                <div className="text-xs text-muted-foreground">Response Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">₹{user.totalEarnings.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Earnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{user.completionRate}%</div>
                <div className="text-xs text-muted-foreground">Completion Rate</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 neu-card mb-8">
          <TabsTrigger value="overview" className="neu-button">Overview</TabsTrigger>
          <TabsTrigger value="profile" className="neu-button">Profile</TabsTrigger>
          <TabsTrigger value="stats" className="neu-button">Statistics</TabsTrigger>
          <TabsTrigger value="settings" className="neu-button">Settings</TabsTrigger>
          <TabsTrigger value="security" className="neu-button">Security</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<Package className="w-5 h-5 text-primary" />}
              title="Active Rentals"
              value={user.stats.activeRentals}
              trend={12}
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5 text-green-600" />}
              title="Monthly Earnings"
              value={`₹${user.stats.monthlyEarnings.toLocaleString()}`}
              trend={8}
            />
            <StatCard
              icon={<Star className="w-5 h-5 text-yellow-500" />}
              title="Average Rating"
              value={user.stats.averageRating.toFixed(1)}
              subtitle={`${user.reviewCount} reviews`}
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-blue-600" />}
              title="Response Time"
              value={user.stats.responseTime}
              subtitle="Average response"
            />
          </div>

          {/* Recent Activity */}
          <Card className="neu-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Activity items would go here */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New rental request received</p>
                  <p className="text-xs text-muted-foreground">Camera equipment rental - 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New review received</p>
                  <p className="text-xs text-muted-foreground">5 stars for laptop rental - 5 hours ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="neu-card">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="neu-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="neu-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="neu-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editData.location}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        className="neu-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      className="neu-input"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} className="neu-button">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="neu-button">
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{user.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bio</p>
                      <p className="font-medium">{user.bio}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card className="neu-card">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Completion Rate</span>
                    <span className="text-sm font-medium">{user.completionRate}%</span>
                  </div>
                  <Progress value={user.completionRate} className="neu-inset" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Response Rate</span>
                    <span className="text-sm font-medium">{user.responseRate}%</span>
                  </div>
                  <Progress value={user.responseRate} className="neu-inset" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Customer Satisfaction</span>
                    <span className="text-sm font-medium">{(user.rating * 20).toFixed(0)}%</span>
                  </div>
                  <Progress value={user.rating * 20} className="neu-inset" />
                </div>
              </CardContent>
            </Card>

            {/* Rental History */}
            <Card className="neu-card">
              <CardHeader>
                <CardTitle>Rental Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Rentals</span>
                  <span className="font-semibold">{user.stats.totalRentals}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Listings</span>
                  <span className="font-semibold">{user.stats.totalListings}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Earnings</span>
                  <span className="font-semibold">₹{user.totalEarnings.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <span className="font-semibold text-green-600">₹{user.stats.monthlyEarnings.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="neu-card">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email updates about your rentals</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={user.preferences.emailNotifications}
                  onCheckedChange={(value) => handlePreferenceChange('emailNotifications', value)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get instant notifications on your device</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={user.preferences.pushNotifications}
                  onCheckedChange={(value) => handlePreferenceChange('pushNotifications', value)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-emails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Receive promotional offers and updates</p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={user.preferences.marketingEmails}
                  onCheckedChange={(value) => handlePreferenceChange('marketingEmails', value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="neu-card">
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="neu-button w-full justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Methods
                </div>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="neu-button w-full justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Export Data
                </div>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="destructive" onClick={onLogout} className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="neu-card">
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Account Verified</p>
                    <p className="text-sm text-muted-foreground">Your account is verified and secure</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Verified</Badge>
              </div>
              
              <Button variant="outline" className="neu-button w-full justify-between">
                <span>Change Password</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" className="neu-button w-full justify-between">
                <span>Two-Factor Authentication</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" className="neu-button w-full justify-between">
                <span>Login History</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfileDashboard;
