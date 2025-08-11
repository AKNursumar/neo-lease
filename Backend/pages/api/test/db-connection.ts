import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test basic connection
    console.log('Testing database connection...');
    
    // Test 1: Check if we can query the users table (using admin to bypass RLS)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
    
    // Test 2: Check basic database connection with a simple query
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(0); // Just test the connection, don't return any rows

    // Test 3: Check auth connection by trying to list users (admin only)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    return res.status(200).json({
      success: true,
      tests: {
        usersTable: usersError ? { error: usersError.message } : { success: true, count: users?.length || 0 },
        dbConnection: dbError ? { error: dbError.message } : { success: true, database: dbData },
        authConnection: authError ? { error: authError.message } : { success: true, count: authData?.users?.length || 0 }
      }
    });

  } catch (error) {
    console.error('Database connection test error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
