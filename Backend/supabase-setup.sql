-- Neo Lease Database Setup Script
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/cigetcvhprnhxybhjrzm/sql

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' NOT NULL,
  phone VARCHAR(20),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::uuid = id OR (auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::uuid = id);

-- Create facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  images JSONB,
  amenities JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for facilities
CREATE INDEX IF NOT EXISTS idx_facilities_owner ON facilities(owner_id);

-- Enable RLS for facilities
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- Create policies for facilities
CREATE POLICY "Anyone can read facilities" ON facilities FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Owners can manage their facilities" ON facilities FOR ALL USING (owner_id = auth.uid()::uuid);

-- Create courts table
CREATE TABLE IF NOT EXISTS courts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sport_type VARCHAR(100) NOT NULL,
  capacity INTEGER,
  hourly_rate DECIMAL(10, 2),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for courts
CREATE INDEX IF NOT EXISTS idx_courts_facility ON courts(facility_id);
CREATE INDEX IF NOT EXISTS idx_courts_sport_type ON courts(sport_type);

-- Enable RLS for courts
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

-- Create policies for courts
CREATE POLICY "Anyone can read courts" ON courts FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Facility owners can manage courts" ON courts FOR ALL USING (
  facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid()::uuid)
);

-- Create products table (for rental items)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  daily_rate DECIMAL(10, 2),
  deposit_amount DECIMAL(10, 2),
  is_available BOOLEAN DEFAULT true,
  images JSONB,
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for products
CREATE INDEX IF NOT EXISTS idx_products_facility ON products(facility_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Anyone can read products" ON products FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Facility owners can manage products" ON products FOR ALL USING (
  facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid()::uuid)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_court ON bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);

-- Enable RLS for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
CREATE POLICY "Users can read own bookings" ON bookings FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (user_id = auth.uid()::uuid);

-- Create rental_orders table
CREATE TABLE IF NOT EXISTS rental_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount DECIMAL(10, 2),
  deposit_paid DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  delivery_address TEXT,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rental_orders
CREATE INDEX IF NOT EXISTS idx_rental_orders_user ON rental_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_orders_product ON rental_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_rental_orders_dates ON rental_orders(start_date, end_date);

-- Enable RLS for rental_orders
ALTER TABLE rental_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for rental_orders
CREATE POLICY "Users can read own orders" ON rental_orders FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users can create orders" ON rental_orders FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "Users can update own orders" ON rental_orders FOR UPDATE USING (user_id = auth.uid()::uuid);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rental_orders_updated_at BEFORE UPDATE ON rental_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@neolease.com', '$2b$10$example.hash', 'Admin User', 'admin'),
('user@example.com', '$2b$10$example.hash', 'Test User', 'user')
ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully! All tables created with proper indexes and RLS policies.' as message;
