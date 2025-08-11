-- Safe migration script to add/update users table for Clerk integration
-- Run this if you're getting "column email does not exist" error

-- First, let's check if users table exists and what columns it has
-- You can run: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

-- Option 1: If users table doesn't exist, create it
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_image TEXT,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in TIMESTAMPTZ,
  
  -- Additional profile fields
  date_of_birth DATE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'India',
  
  -- Preferences
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT true,
  
  -- Verification status
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  email_verified_at TIMESTAMPTZ,
  phone_verified_at TIMESTAMPTZ
);

-- Option 2: If users table exists but missing columns, add them
-- Uncomment these lines one by one if you need to add missing columns:

-- ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sign_in TIMESTAMPTZ;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT true;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_sign_in ON users(last_sign_in);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Simple RLS policies (more permissive for development)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (you can make this more restrictive later)
CREATE POLICY "Allow all for authenticated users" ON users
    FOR ALL USING (true);

-- Insert a test user to verify the schema works
-- INSERT INTO users (id, email, full_name, role) 
-- VALUES ('test_clerk_id_123', 'test@example.com', 'Test User', 'user')
-- ON CONFLICT (id) DO NOTHING;
