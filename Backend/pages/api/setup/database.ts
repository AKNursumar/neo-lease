import { NextApiRequest, NextApiResponse } from 'next';
import { withCORS } from '@/middleware/cors';
import { supabase } from '@/lib/supabase';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Execute the SQL to create the function and table
    const createFunctionSql = `
      -- Create function to setup products table
      CREATE OR REPLACE FUNCTION create_products_table()
      RETURNS TEXT AS $$
      BEGIN
        -- Create products table if it doesn't exist
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
          owner_id UUID REFERENCES auth.users(id),
          location TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- Add RLS policies for products
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
        DROP POLICY IF EXISTS "Users can create their own products" ON public.products;
        DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
        DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;

        -- Allow everyone to read products
        CREATE POLICY "Anyone can view products" ON public.products
          FOR SELECT USING (true);

        -- Allow authenticated users to insert their own products
        CREATE POLICY "Users can create their own products" ON public.products
          FOR INSERT WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);

        -- Allow users to update their own products
        CREATE POLICY "Users can update their own products" ON public.products
          FOR UPDATE USING (auth.uid() = owner_id OR owner_id IS NULL);

        -- Allow users to delete their own products
        CREATE POLICY "Users can delete their own products" ON public.products
          FOR DELETE USING (auth.uid() = owner_id OR owner_id IS NULL);

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
        CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
        CREATE INDEX IF NOT EXISTS idx_products_owner ON public.products(owner_id);
        CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);

        -- Create function to update updated_at timestamp
        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = timezone('utc'::text, now());
            RETURN NEW;
        END;
        $trigger$ language 'plpgsql';

        -- Create trigger to automatically update updated_at
        DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
        CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

        -- Grant access to service role for backend operations
        GRANT ALL ON public.products TO service_role;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public.products TO service_role;

        RETURN 'Products table created successfully';
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Execute the function creation
    const { error: funcError } = await supabase.rpc('exec', { sql: createFunctionSql });
    
    if (funcError) {
      console.error('Error creating function:', funcError);
      return res.status(500).json({ error: funcError.message });
    }

    // Now call the function to create the table
    const { data, error } = await supabase.rpc('create_products_table');

    if (error) {
      console.error('Error creating products table:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Products table and function created successfully',
      result: data
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
}

export default withCORS(handler);
