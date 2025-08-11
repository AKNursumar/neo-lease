import { NextApiRequest, NextApiResponse } from 'next';
import { withCORS } from '@/middleware/cors';
import { supabase } from '@/lib/supabase';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to describe the products table structure
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (error) {
      return res.status(200).json({
        table_exists: false,
        error: error.message,
        suggestion: 'Need to create products table'
      });
    }

    // Get column information by trying to insert empty object
    const { data: insertTest, error: insertError } = await supabase
      .from('products')
      .insert([{}])
      .select();

    return res.status(200).json({
      table_exists: true,
      current_data: data,
      insert_test_error: insertError?.message,
      message: 'Table exists but may have wrong schema'
    });

  } catch (error: any) {
    console.error('Table check error:', error);
    res.status(500).json({ error: error.message });
  }
}

export default withCORS(handler);
