const fetch = require('node-fetch').default || require('node-fetch');

async function testAuth() {
  console.log('Testing authentication endpoints...');
  
  try {
    // Test registration
    console.log('\n1. Testing registration...');
    const registerResponse = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test5@example.com',
        password: 'test123',
        fullName: 'Test User 5'
      })
    });
    
    const registerResult = await registerResponse.json();
    console.log('Registration response:', JSON.stringify(registerResult, null, 2));
    
    if (registerResult.success && registerResult.data?.accessToken) {
      console.log('✅ Registration successful - token format correct');
      
      // Test login
      console.log('\n2. Testing login...');
      const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test5@example.com',
          password: 'test123'
        })
      });
      
      const loginResult = await loginResponse.json();
      console.log('Login response:', JSON.stringify(loginResult, null, 2));
      
      if (loginResult.success && loginResult.data?.accessToken) {
        console.log('✅ Login successful - token format correct');
        
        // Test user profile
        console.log('\n3. Testing user profile...');
        const profileResponse = await fetch('http://localhost:4000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${loginResult.data.accessToken}`
          }
        });
        
        const profileResult = await profileResponse.json();
        console.log('Profile response:', JSON.stringify(profileResult, null, 2));
        
        if (profileResult.user) {
          console.log('✅ User profile retrieval successful');
          console.log('\n🎉 All authentication tests passed! Frontend should work now.');
        } else {
          console.log('❌ User profile test failed');
        }
      } else {
        console.log('❌ Login test failed - incorrect response format');
      }
    } else {
      console.log('❌ Registration test failed - incorrect response format');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();
