import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userData = req.body;
    
    console.log('🔄 Syncing user to Supabase:', userData);

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userData.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Error checking existing user:', fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingUser) {
      // User exists, update their information
      const { data, error } = await supabase
        .from('users')
        .update({
          email: userData.email,
          full_name: userData.full_name,
          first_name: userData.first_name,
          last_name: userData.last_name,
          profile_image: userData.profile_image,
          phone: userData.phone,
          updated_at: userData.updated_at,
          last_sign_in: userData.last_sign_in,
        })
        .eq('id', userData.id)
        .select();

      if (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ error: 'Failed to update user' });
      }

      console.log('✅ User updated successfully:', data);
      return res.status(200).json({ success: true, data, action: 'updated' });
    } else {
      // New user, insert into Supabase
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          first_name: userData.first_name,
          last_name: userData.last_name,
          profile_image: userData.profile_image,
          phone: userData.phone,
          created_at: userData.created_at,
          updated_at: userData.updated_at,
          last_sign_in: userData.last_sign_in,
          role: 'user', // Default role
          is_active: true, // Default active status
        }])
        .select();

      if (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      console.log('✅ User created successfully:', data);
      return res.status(201).json({ success: true, data, action: 'created' });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
