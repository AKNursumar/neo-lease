-- Additional tables for complete CRUD system
-- Run this after the products table is created

-- ====================================
-- RENTALS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS public.rentals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  product_id BIGINT REFERENCES public.products(id) NOT NULL,
  
  -- Rental period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER NOT NULL,
  
  -- Pricing
  daily_rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, active, completed, cancelled
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded, failed
  
  -- Additional details
  delivery_address TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ====================================
-- PAYMENTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  rental_id UUID REFERENCES public.rentals(id) NOT NULL,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Razorpay integration
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
  gateway VARCHAR(20) DEFAULT 'razorpay',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ====================================
-- CART TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  product_id BIGINT REFERENCES public.products(id) NOT NULL,
  
  -- Rental details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  
  -- Pricing snapshot
  daily_rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique product per user in cart
  UNIQUE(user_id, product_id)
);

-- ====================================
-- REVIEWS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  rental_id UUID REFERENCES public.rentals(id) NOT NULL,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  product_id BIGINT REFERENCES public.products(id) NOT NULL,
  
  -- Review details
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title VARCHAR(255),
  comment TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one review per rental
  UNIQUE(rental_id, user_id)
);

-- ====================================
-- INDEXES
-- ====================================
CREATE INDEX IF NOT EXISTS idx_rentals_user_id ON public.rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_product_id ON public.rentals(product_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON public.rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON public.rentals(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_payments_rental_id ON public.payments(rental_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product_id ON public.cart_items(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- ====================================
-- RLS POLICIES
-- ====================================
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Rentals policies - users can only see their own rentals
CREATE POLICY "Users can view their own rentals" ON public.rentals
    FOR SELECT USING (true); -- Allow all for now, implement user auth later

CREATE POLICY "Users can create rentals" ON public.rentals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own rentals" ON public.rentals
    FOR UPDATE USING (true);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (true);

CREATE POLICY "Users can create payments" ON public.payments
    FOR INSERT WITH CHECK (true);

-- Cart policies
CREATE POLICY "Users can manage their cart" ON public.cart_items
    FOR ALL USING (true);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (true);

-- ====================================
-- FUNCTIONS
-- ====================================
-- Function to update product rating when reviews change
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products 
    SET 
        rating = (
            SELECT COALESCE(AVG(rating::numeric), 0)
            FROM public.reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM public.reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update product rating
DROP TRIGGER IF EXISTS update_product_rating_trigger ON public.reviews;
CREATE TRIGGER update_product_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_rating();

-- Grant permissions
GRANT ALL ON public.rentals TO service_role;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.cart_items TO service_role;
GRANT ALL ON public.reviews TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
