import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email parameter required' });
    }

    // Check if user exists in auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Auth list error:', authError);
      return res.status(500).json({ error: authError.message });
    }

    const existingUser = authUsers.users.find(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    );

    // Also check our users table
    const { data: dbUsers, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, phone, role, created_at')
      .limit(5);

    return res.status(200).json({
      success: true,
      email_check: {
        email: email.toLowerCase(),
        exists_in_auth: !!existingUser,
        user_details: existingUser ? {
          id: existingUser.id,
          email: existingUser.email,
          created_at: existingUser.created_at,
          email_confirmed_at: existingUser.email_confirmed_at,
          last_sign_in_at: existingUser.last_sign_in_at
        } : null
      },
      total_auth_users: authUsers.users.length,
      sample_db_users: dbError ? { error: dbError.message } : dbUsers,
      total_db_users: dbUsers?.length || 0
    });

  } catch (error) {
    console.error('User check error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
