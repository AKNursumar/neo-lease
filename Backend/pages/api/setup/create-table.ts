import { NextApiRequest, NextApiResponse } from 'next';
import { withCORS } from '@/middleware/cors';
import { supabase } from '@/lib/supabase';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // First, let's try to create the products table with a direct SQL command
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.products (
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

      -- Create policy to allow anyone to view products
      DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
      CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);

      -- Create policy to allow service role to do everything
      DROP POLICY IF EXISTS "Service role can do anything" ON public.products;
      CREATE POLICY "Service role can do anything" ON public.products FOR ALL USING (true);

      -- Grant permissions
      GRANT ALL ON public.products TO service_role;
      GRANT ALL ON public.products TO anon;
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
    `;

    // Try to execute the SQL using a raw query
    const { data, error: createError } = await supabase
      .rpc('exec_sql', { sql: createTableSQL });

    if (createError) {
      console.error('Error creating table:', createError);
      return res.status(500).json({ 
        error: String(createError),
        step: 'creating table'
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Products table created successfully'
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
}

export default withCORS(handler);
