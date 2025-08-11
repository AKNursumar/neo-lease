import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandling, successResponse, errorResponse } from '@/utils/api-helpers';
import { withMethodsAndCORS } from '@/middleware/cors';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { registerSchema } from '@/utils/validation';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate request body
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 'Invalid input', 400);
    }

  const { email, password, fullName, phone } = validation.data;
  const cleanEmail = email.trim().toLowerCase();
  const cleanFullName = fullName.trim();

    // Sanitize phone (remove spaces/formatting, drop leading zeros) and validate loosely
    let sanitizedPhone: string | undefined = undefined;
    if (phone) {
      const cleaned = phone.trim().replace(/[^0-9+]/g, '');
      // Remove leading zeros unless part of international prefix pattern
      const normalized = cleaned.startsWith('+') ? cleaned : cleaned.replace(/^0+/, '');
      if (/^(\+?[1-9][0-9]{7,14})$/.test(normalized)) {
        sanitizedPhone = normalized;
      } else {
        console.warn('Phone failed validation, will be stored as NULL to avoid trigger constraint:', phone);
      }
    }

    // First, create the user in auth.users using regular signup (not admin)
  console.log('Creating auth user with data (sanitized):', { email: cleanEmail, fullName: cleanFullName, sanitizedPhone });

    // Only include phone_number in metadata if it passed our relaxed validation to avoid failing DB trigger
  const userMetadata: Record<string, any> = { full_name: cleanFullName };
    if (sanitizedPhone) userMetadata.phone_number = sanitizedPhone;

    const { data: authData, error: authError } = await supabase.auth.signUp({
  email: cleanEmail,
      password,
      options: { data: userMetadata },
    });

  console.log('Supabase signUp response:', { userId: authData?.user?.id, error: authError?.message });

    if (authError) {
      console.error('Auth creation error:', authError);
      return errorResponse(res, authError.message, 400);
    }

    if (!authData.user) {
      return errorResponse(res, 'Registration failed - no user created', 400);
    }

    // Manually confirm the user's email (for development)
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      authData.user.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.warn('Could not auto-confirm email:', confirmError.message);
    }

    // Now manually create the user profile in the users table
    console.log('Upserting user profile...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .upsert(
        [
          {
            id: authData.user.id,
            full_name: cleanFullName,
            phone: sanitizedPhone ?? null,
            role: 'user',
          },
        ],
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      
      // If profile creation fails, clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
  return errorResponse(res, `Profile creation failed: ${profileError.message}`, 500);
    }

    console.log('User profile created successfully:', profile);

    // Prepare response data
    const responseData = {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: profile.full_name,
        role: profile.role,
        phone: profile.phone,
        isVerified: true, // We auto-confirmed above
      },
      requiresLogin: true,
    };

    return successResponse(res, responseData, 'Registration successful! Please login with your credentials.');

  } catch (error) {
    console.error('Registration handler error:', error);
    return errorResponse(res, 'Registration failed', 500);
  }
}

export default withMethodsAndCORS(['POST', 'OPTIONS'])(
  withErrorHandling(handler)
);
