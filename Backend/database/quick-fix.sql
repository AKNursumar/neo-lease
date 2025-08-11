-- QUICK FIX: Run this in Supabase SQL Editor
-- This will create a clean users table for Clerk integration

-- Drop existing tables (WARNING: This deletes all user data!)
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create fresh users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY, -- Clerk user ID
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
  last_sign_in TIMESTAMPTZ
);

-- Create basic indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Enable RLS but make it permissive for development
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);

-- Test the table
INSERT INTO users (id, email, full_name) 
VALUES ('test_123', 'test@example.com', 'Test User')
ON CONFLICT (id) DO NOTHING;

-- Verify it works
SELECT * FROM users;
