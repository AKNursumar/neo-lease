#!/usr/bin/env node

/**
 * Neo-Lease Backend Testing & Validation Script
 * 
 * This script tests all major backend functionality:
 * - Environment variables
 * - Database connectivity
 * - Authentication
 * - API endpoints
 * - Payment integration
 * - File uploads
 */

const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const crypto = require('crypto');

// Load environment variables
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.VERCEL_URL 
  : 'http://localhost:3001';

class BackendTester {
  constructor() {
    this.supabase = null;
    this.testUser = null;
    this.authToken = null;
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${type.toUpperCase()}:`;
    
    console.log(`${prefix} ${message}`);
    
    if (type === 'error') {
      this.errors.push(message);
    } else if (type === 'warning') {
      this.warnings.push(message);
    } else if (type === 'success') {
      this.successes.push(message);
    }
  }

  async checkEnvironmentVariables() {
    this.log('Checking environment variables...');
    
    const required = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      this.log(`Missing environment variables: ${missing.join(', ')}`, 'error');
      return false;
    }

    this.log('All required environment variables found', 'success');
    return true;
  }

  async testSupabaseConnection() {
    this.log('Testing Supabase connection...');
    
    try {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      // Test database connection
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        this.log(`Supabase connection failed: ${error.message}`, 'error');
        return false;
      }

      this.log('Supabase connection successful', 'success');
      return true;
    } catch (err) {
      this.log(`Supabase connection error: ${err.message}`, 'error');
      return false;
    }
  }

  async createTestUser() {
    this.log('Creating test user...');
    
    try {
      const email = `test-${Date.now()}@neolease.test`;
      const password = 'TestPassword123!';

      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test User',
            phone_number: '+1234567890'
          }
        }
      });

      if (error) {
        this.log(`Test user creation failed: ${error.message}`, 'error');
        return false;
      }

      this.testUser = { email, password };
      this.log('Test user created successfully', 'success');
      return true;
    } catch (err) {
      this.log(`Test user creation error: ${err.message}`, 'error');
      return false;
    }
  }

  async testAuthentication() {
    this.log('Testing authentication...');
    
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: this.testUser.email,
        password: this.testUser.password
      });

      if (error) {
        this.log(`Authentication failed: ${error.message}`, 'error');
        return false;
      }

      this.authToken = data.session.access_token;
      this.log('Authentication successful', 'success');
      return true;
    } catch (err) {
      this.log(`Authentication error: ${err.message}`, 'error');
      return false;
    }
  }

  async testApiEndpoint(path, method = 'GET', body = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${BASE_URL}${path}`, options);
      
      return {
        ok: response.ok,
        status: response.status,
        data: response.ok ? await response.json() : await response.text()
      };
    } catch (err) {
      return {
        ok: false,
        status: 0,
        error: err.message
      };
    }
  }

  async testApiEndpoints() {
    this.log('Testing API endpoints...');

    const endpoints = [
      { path: '/api/auth/me', method: 'GET' },
      { path: '/api/facilities', method: 'GET' },
      { path: '/api/courts', method: 'GET' },
      { path: '/api/products', method: 'GET' },
      { path: '/api/bookings', method: 'GET' },
      { path: '/api/rentals', method: 'GET' }
    ];

    let passed = 0;
    
    for (const endpoint of endpoints) {
      const result = await this.testApiEndpoint(endpoint.path, endpoint.method);
      
      if (result.ok) {
        this.log(`${endpoint.method} ${endpoint.path} - OK (${result.status})`, 'success');
        passed++;
      } else {
        this.log(`${endpoint.method} ${endpoint.path} - FAILED (${result.status})`, 'error');
      }
    }

    this.log(`API endpoints test completed: ${passed}/${endpoints.length} passed`, passed === endpoints.length ? 'success' : 'warning');
    return passed === endpoints.length;
  }

  async testFacilityCreation() {
    this.log('Testing facility creation...');

    const facilityData = {
      name: 'Test Sports Complex',
      description: 'A test facility for automated testing',
      address: '123 Test Street, Test City',
      city: 'Test City',
      state: 'Test State',
      postal_code: '12345',
      country: 'Test Country',
      phone_number: '+1234567890',
      email: 'test@facility.com',
      amenities: ['Parking', 'WiFi', 'Restrooms'],
      operating_hours: {
        monday: { open: '08:00', close: '22:00' },
        tuesday: { open: '08:00', close: '22:00' }
      }
    };

    const result = await this.testApiEndpoint('/api/facilities', 'POST', facilityData);

    if (result.ok) {
      this.log('Facility creation successful', 'success');
      return result.data;
    } else {
      this.log(`Facility creation failed: ${result.status} - ${result.data}`, 'error');
      return null;
    }
  }

  async testPaymentOrder() {
    this.log('Testing payment order creation...');

    const orderData = {
      amount: 1000, // ₹10.00
      currency: 'INR',
      type: 'booking',
      reference_id: 'test-booking-123'
    };

    const result = await this.testApiEndpoint('/api/payments/create-order', 'POST', orderData);

    if (result.ok) {
      this.log('Payment order creation successful', 'success');
      return result.data;
    } else {
      this.log(`Payment order creation failed: ${result.status} - ${result.data}`, 'warning');
      return null;
    }
  }

  async testFileUploadUrl() {
    this.log('Testing file upload URL generation...');

    const uploadData = {
      file_name: 'test-image.jpg',
      file_type: 'image/jpeg',
      file_size: 1024000,
      bucket: 'facility-images'
    };

    const result = await this.testApiEndpoint('/api/uploads', 'POST', uploadData);

    if (result.ok) {
      this.log('File upload URL generation successful', 'success');
      return result.data;
    } else {
      this.log(`File upload URL generation failed: ${result.status} - ${result.data}`, 'warning');
      return null;
    }
  }

  async cleanupTestData() {
    this.log('Cleaning up test data...');

    try {
      if (this.supabase && this.authToken) {
        // Delete test user
        await this.supabase.auth.admin.deleteUser(this.testUser.id);
        this.log('Test data cleaned up successfully', 'success');
      }
    } catch (err) {
      this.log(`Cleanup warning: ${err.message}`, 'warning');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Neo-Lease Backend Tests\n');
    console.log('=====================================\n');

    // Environment check
    const envCheck = await this.checkEnvironmentVariables();
    if (!envCheck) {
      console.log('\n❌ Environment check failed. Please fix environment variables before continuing.\n');
      return;
    }

    // Supabase connection
    const supabaseCheck = await this.testSupabaseConnection();
    if (!supabaseCheck) {
      console.log('\n❌ Supabase connection failed. Please check your configuration.\n');
      return;
    }

    // Create and authenticate test user
    const userCreated = await this.createTestUser();
    if (!userCreated) {
      console.log('\n❌ Test user creation failed. Please check your Supabase configuration.\n');
      return;
    }

    const authCheck = await this.testAuthentication();
    if (!authCheck) {
      console.log('\n❌ Authentication failed. Please check your auth setup.\n');
      return;
    }

    // Test API endpoints
    await this.testApiEndpoints();

    // Test specific features
    await this.testFacilityCreation();
    await this.testPaymentOrder();
    await this.testFileUploadUrl();

    // Cleanup
    await this.cleanupTestData();

    // Summary
    console.log('\n=====================================');
    console.log('🏁 Test Summary');
    console.log('=====================================');
    console.log(`✅ Successes: ${this.successes.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.errors.length === 0) {
      console.log('\n🎉 All critical tests passed! Your backend is ready for development.');
    } else if (this.errors.length <= 2) {
      console.log('\n⚠️  Some tests failed, but core functionality works. Check the errors above.');
    } else {
      console.log('\n❌ Multiple critical tests failed. Please review your configuration.');
    }

    console.log('\nFor detailed setup instructions, see SUPABASE_SETUP.md');
    console.log('For API documentation, see the README.md file.\n');
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new BackendTester();
  tester.runAllTests().catch(console.error);
}

module.exports = BackendTester;
