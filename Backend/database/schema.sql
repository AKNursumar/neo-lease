-- Neo-Lease Database Schema for Supabase PostgreSQL
-- This file contains all table definitions, RLS policies, and functions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('user', 'owner', 'admin');
CREATE TYPE booking_status AS ENUM ('draft', 'confirmed', 'cancelled', 'completed');
CREATE TYPE rental_status AS ENUM ('draft', 'confirmed', 'active', 'returned', 'cancelled', 'overdue');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~ '^[\+]?[1-9][\d]{9,14}$')
);

-- Facilities table
CREATE TABLE facilities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    images TEXT[] DEFAULT '{}',
    amenities TEXT[] DEFAULT '{}',
    contact_phone TEXT,
    contact_email TEXT,
    operating_hours JSONB,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT valid_coordinates CHECK (
        (lat IS NULL AND lng IS NULL) OR 
        (lat IS NOT NULL AND lng IS NOT NULL AND lat >= -90 AND lat <= 90 AND lng >= -180 AND lng <= 180)
    ),
    CONSTRAINT contact_email_format CHECK (contact_email IS NULL OR contact_email ~ '^[^@]+@[^@]+\.[^@]+$')
);

-- Courts table
CREATE TABLE courts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sport_type TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    price_per_hour DECIMAL(10, 2) NOT NULL CHECK (price_per_hour > 0),
    price_per_day DECIMAL(10, 2) CHECK (price_per_day IS NULL OR price_per_day > 0),
    availability_config JSONB,
    images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Products table
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    pricing JSONB NOT NULL,
    deposit_amount DECIMAL(10, 2) NOT NULL CHECK (deposit_amount >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0),
    images TEXT[] DEFAULT '{}',
    category TEXT,
    specifications JSONB,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT available_lte_total CHECK (available_quantity <= quantity)
);

-- Bookings table
CREATE TABLE bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    court_id UUID REFERENCES courts(id) ON DELETE CASCADE NOT NULL,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    status booking_status DEFAULT 'draft' NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price > 0),
    payment_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime),
    CONSTRAINT future_booking CHECK (start_datetime > NOW())
);

-- Rental orders table
CREATE TABLE rental_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status rental_status DEFAULT 'draft' NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount > 0),
    deposit_amount DECIMAL(10, 2) NOT NULL CHECK (deposit_amount >= 0),
    payment_id UUID,
    return_condition TEXT,
    late_fees DECIMAL(10, 2) DEFAULT 0 CHECK (late_fees >= 0),
    damage_fees DECIMAL(10, 2) DEFAULT 0 CHECK (damage_fees >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Rental items table
CREATE TABLE rental_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rental_order_id UUID REFERENCES rental_orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price > 0),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT calculated_total CHECK (total_price = unit_price * quantity)
);

-- Payments table
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'INR' NOT NULL,
    provider TEXT DEFAULT 'razorpay' NOT NULL,
    provider_order_id TEXT,
    provider_payment_id TEXT,
    provider_signature TEXT,
    status payment_status DEFAULT 'pending' NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add foreign key constraints for payments
ALTER TABLE bookings ADD CONSTRAINT fk_booking_payment 
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

ALTER TABLE rental_orders ADD CONSTRAINT fk_rental_payment 
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_facilities_owner_id ON facilities(owner_id);
CREATE INDEX idx_facilities_location ON facilities USING GIST(ST_Point(lng, lat)) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX idx_facilities_active ON facilities(is_active) WHERE is_active = true;
CREATE INDEX idx_courts_facility_id ON courts(facility_id);
CREATE INDEX idx_courts_sport_type ON courts(sport_type);
CREATE INDEX idx_products_facility_id ON products(facility_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_court_id ON courts(id);
CREATE INDEX idx_bookings_datetime ON bookings(start_datetime, end_datetime);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_rental_orders_user_id ON rental_orders(user_id);
CREATE INDEX idx_rental_orders_dates ON rental_orders(start_date, end_date);
CREATE INDEX idx_rental_orders_status ON rental_orders(status);
CREATE INDEX idx_rental_items_order_id ON rental_items(rental_order_id);
CREATE INDEX idx_rental_items_product_id ON rental_items(product_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_provider_order_id ON payments(provider_order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read) WHERE is_read = false;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
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

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update product available quantity
CREATE OR REPLACE FUNCTION update_product_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update available quantity based on confirmed/active rentals
        UPDATE products SET available_quantity = quantity - COALESCE((
            SELECT SUM(ri.quantity)
            FROM rental_items ri
            JOIN rental_orders ro ON ri.rental_order_id = ro.id
            WHERE ri.product_id = NEW.product_id 
            AND ro.status IN ('confirmed', 'active')
            AND ro.start_date <= NOW() 
            AND ro.end_date >= NOW()
        ), 0)
        WHERE id = NEW.product_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE products SET available_quantity = quantity - COALESCE((
            SELECT SUM(ri.quantity)
            FROM rental_items ri
            JOIN rental_orders ro ON ri.rental_order_id = ro.id
            WHERE ri.product_id = OLD.product_id 
            AND ro.status IN ('confirmed', 'active')
            AND ro.start_date <= NOW() 
            AND ro.end_date >= NOW()
        ), 0)
        WHERE id = OLD.product_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to update product quantities
CREATE TRIGGER update_product_quantity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON rental_items
    FOR EACH ROW EXECUTE FUNCTION update_product_quantity();

-- Function to check booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflict()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM bookings 
        WHERE court_id = NEW.court_id 
        AND status IN ('confirmed', 'draft')
        AND id != COALESCE(NEW.id, uuid_generate_v4())
        AND (
            (NEW.start_datetime >= start_datetime AND NEW.start_datetime < end_datetime) OR
            (NEW.end_datetime > start_datetime AND NEW.end_datetime <= end_datetime) OR
            (NEW.start_datetime <= start_datetime AND NEW.end_datetime >= end_datetime)
        )
    ) THEN
        RAISE EXCEPTION 'Booking conflict: Court is already booked for the selected time slot';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to prevent booking conflicts
CREATE TRIGGER prevent_booking_conflicts
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION check_booking_conflict();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Facilities policies
CREATE POLICY "Anyone can view active facilities" ON facilities
    FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can view their own facilities" ON facilities
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can create facilities" ON facilities
    FOR INSERT WITH CHECK (
        owner_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners can update their own facilities" ON facilities
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their own facilities" ON facilities
    FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Admins have full access to facilities" ON facilities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Courts policies
CREATE POLICY "Anyone can view active courts" ON courts
    FOR SELECT USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM facilities 
            WHERE id = courts.facility_id AND is_active = true
        )
    );

CREATE POLICY "Facility owners can manage courts" ON courts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM facilities 
            WHERE id = courts.facility_id AND owner_id = auth.uid()
        )
    );

-- Products policies
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM facilities 
            WHERE id = products.facility_id AND is_active = true
        )
    );

CREATE POLICY "Facility owners can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM facilities 
            WHERE id = products.facility_id AND owner_id = auth.uid()
        )
    );

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create bookings" ON bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bookings" ON bookings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Facility owners can view bookings for their courts" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courts c
            JOIN facilities f ON c.facility_id = f.id
            WHERE c.id = bookings.court_id AND f.owner_id = auth.uid()
        )
    );

-- Rental orders policies
CREATE POLICY "Users can view their own rental orders" ON rental_orders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create rental orders" ON rental_orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own rental orders" ON rental_orders
    FOR UPDATE USING (user_id = auth.uid());

-- Rental items policies
CREATE POLICY "Users can view rental items for their orders" ON rental_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rental_orders 
            WHERE id = rental_items.rental_order_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage rental items for their orders" ON rental_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM rental_orders 
            WHERE id = rental_items.rental_order_id AND user_id = auth.uid()
        )
    );

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create payments" ON payments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own payments" ON payments
    FOR UPDATE USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, role)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user')
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('facility-images', 'facility-images', true),
('product-images', 'product-images', true),
('documents', 'documents', false),
('avatars', 'avatars', true);

-- Storage policies
CREATE POLICY "Anyone can view facility images" ON storage.objects
    FOR SELECT USING (bucket_id = 'facility-images');

CREATE POLICY "Facility owners can upload facility images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'facility-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view product images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Facility owners can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can upload their own documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
