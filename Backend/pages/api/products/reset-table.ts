import { NextApiRequest, NextApiResponse } from 'next';
import { withCORS } from '@/middleware/cors';
import { supabase } from '@/lib/supabase';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Let's manually create the table using raw SQL approach
    // Since we can't execute SQL directly, we'll provide the SQL for manual execution

    const sql = `
-- Drop existing products table if it exists
DROP TABLE IF EXISTS public.products CASCADE;

-- Create new products table with all required columns
CREATE TABLE public.products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_per_day DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 1,
  minimum_rental_days INTEGER DEFAULT 1,
  maximum_rental_days INTEGER DEFAULT 365,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  specifications JSONB,
  tags TEXT[],
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  owner_id UUID,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies that allow access
CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.products FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON public.products TO anon;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON SEQUENCE public.products_id_seq TO anon;
GRANT ALL ON SEQUENCE public.products_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.products_id_seq TO service_role;

-- Create indexes
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_available ON public.products(is_available);
CREATE INDEX idx_products_created_at ON public.products(created_at);
    `;

    return res.status(200).json({
      success: true,
      message: 'Please execute this SQL in Supabase SQL Editor to recreate the products table',
      sql: sql,
      instructions: [
        '1. Go to your Supabase Dashboard',
        '2. Navigate to the SQL Editor',
        '3. Copy and paste the provided SQL',
        '4. Execute the SQL',
        '5. Then call POST /api/products to insert demo data'
      ]
    });

  } catch (error: any) {
    console.error('Reset table error:', error);
    res.status(500).json({ error: error.message });
  }
}

export default withCORS(handler);
