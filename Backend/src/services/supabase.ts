import { createClient, SupabaseClient } from '@supabase/supabase-js';

class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Please check your environment variables.');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Supabase service initialized successfully');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Helper method to test connection
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.from('users').select('count', { count: 'exact', head: true });
      if (error) {
        console.error('Supabase connection test failed:', error.message);
        return false;
      }
      console.log('✅ Supabase connection test successful');
      return true;
    } catch (error) {
      console.error('Supabase connection test error:', error);
      return false;
    }
  }
}

export default new SupabaseService();
