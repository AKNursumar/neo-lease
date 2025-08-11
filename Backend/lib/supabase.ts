import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

// Client for public operations (with RLS)
export const supabase: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Create authenticated client with user session
export function createAuthenticatedClient(accessToken: string): SupabaseClient<Database> {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Storage bucket names
export const STORAGE_BUCKETS = {
  FACILITY_IMAGES: 'facility-images',
  PRODUCT_IMAGES: 'product-images',
  DOCUMENTS: 'documents',
  AVATARS: 'avatars',
} as const;

// Helper function to get signed URL for storage
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
    return null;
  }
}

// Helper function to upload file to storage
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Buffer,
  options?: { contentType?: string; upsert?: boolean }
): Promise<{ data: any; error: any }> {
  try {
    const result = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType,
        upsert: options?.upsert || false,
      });

    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    return { data: null, error };
  }
}

// Helper function to delete file from storage
export async function deleteFile(bucket: string, paths: string[]): Promise<{ data: any; error: any }> {
  try {
    const result = await supabase.storage
      .from(bucket)
      .remove(paths);

    return result;
  } catch (error) {
    console.error('Error deleting file:', error);
    return { data: null, error };
  }
}

export default supabase;