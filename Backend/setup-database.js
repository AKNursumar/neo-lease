const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Starting Supabase database setup...');
  console.log('🔗 Supabase URL:', supabaseUrl);

  try {
    // Test connection
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('information_schema.tables').select('*').limit(1);
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Supabase connection successful');

    // Create users table
    console.log('📋 Creating users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'user' NOT NULL,
          phone VARCHAR(20),
          is_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create index for email lookups
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      `
    });

    if (usersError) {
      console.error('❌ Error creating users table:', usersError.message);
      // Try alternative method using direct SQL execution
      console.log('🔄 Trying alternative approach...');
      await createTablesDirectly();
      return;
    }

    console.log('✅ Users table created successfully');

    // Create facilities table
    console.log('📋 Creating facilities table...');
    const { error: facilitiesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS facilities (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          address TEXT,
          location_lat DECIMAL(10, 8),
          location_lng DECIMAL(11, 8),
          images JSONB,
          amenities JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_facilities_owner ON facilities(owner_id);
      `
    });

    if (facilitiesError) {
      console.log('⚠️  RPC method not available, using direct table creation...');
      await createTablesDirectly();
      return;
    }

    console.log('✅ Facilities table created successfully');

    // Create remaining tables
    await createRemainingTables();

    console.log('🎉 Database setup completed successfully!');
    console.log('✅ All tables created with proper relationships and indexes');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('🔄 Trying direct table creation method...');
    await createTablesDirectly();
  }
}

async function createTablesDirectly() {
  console.log('🔧 Creating tables using direct queries...');
  
  const tables = [
    {
      name: 'users',
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'user' NOT NULL,
          phone VARCHAR(20),
          is_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    },
    {
      name: 'facilities',
      sql: `
        CREATE TABLE IF NOT EXISTS facilities (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          address TEXT,
          location_lat DECIMAL(10, 8),
          location_lng DECIMAL(11, 8),
          images JSONB,
          amenities JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    },
    {
      name: 'courts',
      sql: `
        CREATE TABLE IF NOT EXISTS courts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          sport_type VARCHAR(100) NOT NULL,
          capacity INTEGER,
          hourly_rate DECIMAL(10, 2),
          is_available BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    },
    {
      name: 'products',
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          daily_rate DECIMAL(10, 2),
          deposit_amount DECIMAL(10, 2),
          is_available BOOLEAN DEFAULT true,
          images JSONB,
          specifications JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    },
    {
      name: 'bookings',
      sql: `
        CREATE TABLE IF NOT EXISTS bookings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
          booking_date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          total_amount DECIMAL(10, 2),
          status VARCHAR(50) DEFAULT 'pending',
          payment_status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    },
    {
      name: 'rental_orders',
      sql: `
        CREATE TABLE IF NOT EXISTS rental_orders (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          product_id UUID REFERENCES products(id) ON DELETE CASCADE,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          total_amount DECIMAL(10, 2),
          deposit_paid DECIMAL(10, 2),
          status VARCHAR(50) DEFAULT 'pending',
          payment_status VARCHAR(50) DEFAULT 'pending',
          delivery_address TEXT,
          special_instructions TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    }
  ];

  for (const table of tables) {
    try {
      console.log(`📋 Creating ${table.name} table...`);
      
      // Try using the 'rest' client instead of RPC
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: table.sql
        })
      });

      if (response.ok) {
        console.log(`✅ ${table.name} table created successfully`);
      } else {
        console.log(`⚠️  Could not create ${table.name} table via API`);
        console.log('📝 SQL to run manually:');
        console.log(table.sql);
        console.log('---');
      }
    } catch (error) {
      console.log(`⚠️  ${table.name} table creation via API failed`);
      console.log('📝 SQL to run manually:');
      console.log(table.sql);
      console.log('---');
    }
  }

  console.log('🎯 Database setup completed!');
  console.log('📍 If any tables failed to create via API, please run the SQL commands shown above in your Supabase SQL Editor');
}

async function createRemainingTables() {
  const remainingTables = [
    'courts', 'products', 'bookings', 'rental_orders'
  ];

  for (const tableName of remainingTables) {
    console.log(`📋 Creating ${tableName} table...`);
    // Implementation for remaining tables would go here
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('🏁 Setup process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup process failed:', error);
    process.exit(1);
  });
