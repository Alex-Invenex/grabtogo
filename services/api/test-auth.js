const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAuthEndpoints() {
  try {
    console.log('🔍 Testing GrabtoGo Authentication Endpoints\n');

    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check successful:', healthResponse.data.message);
    console.log('   Status:', healthResponse.data.data.status);
    console.log('   Environment:', healthResponse.data.data.environment);
    console.log();

    // Test 2: Customer Registration
    console.log('2. Testing Customer Registration...');
    const customerData = {
      email: 'customer@test.com',
      password: 'Customer123',
      phone: '+91-9876543210',
      role: 'CUSTOMER',
      firstName: 'John',
      lastName: 'Doe',
      address: 'Test Address, Mumbai',
      latitude: 19.0760,
      longitude: 72.8777
    };

    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, customerData);
      console.log('✅ Customer registration successful');
      console.log('   User ID:', registerResponse.data.data.user.id);
      console.log('   Email:', registerResponse.data.data.user.email);
      console.log('   Role:', registerResponse.data.data.user.role);
      console.log('   Token length:', registerResponse.data.data.token.length);

      // Save customer token for later
      global.customerToken = registerResponse.data.data.token;
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error?.includes('already')) {
        console.log('ℹ️  Customer already exists (expected for repeated tests)');
      } else {
        throw error;
      }
    }
    console.log();

    // Test 3: Vendor Registration
    console.log('3. Testing Vendor Registration...');
    const vendorData = {
      email: 'vendor@test.com',
      password: 'Vendor123',
      phone: '+91-9876543211',
      role: 'VENDOR',
      companyName: 'Test Restaurant',
      gstNumber: '27ABCDE1234F1Z5',
      address: 'Test Restaurant Address, Mumbai',
      latitude: 19.0760,
      longitude: 72.8777,
      categories: ['Indian', 'Fast Food']
    };

    try {
      const vendorRegisterResponse = await axios.post(`${BASE_URL}/api/auth/register`, vendorData);
      console.log('✅ Vendor registration successful');
      console.log('   Company:', vendorRegisterResponse.data.data.user.vendor.companyName);
      console.log('   Subscription Status:', vendorRegisterResponse.data.data.user.vendor.subscriptionStatus);
      console.log('   Trial Ends:', vendorRegisterResponse.data.data.user.vendor.trialEndsAt);
      console.log('   Categories:', vendorRegisterResponse.data.data.user.vendor.categories);

      // Save vendor token for later
      global.vendorToken = vendorRegisterResponse.data.data.token;
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error?.includes('already')) {
        console.log('ℹ️  Vendor already exists (expected for repeated tests)');
      } else {
        throw error;
      }
    }
    console.log();

    // Test 4: Customer Login
    console.log('4. Testing Customer Login...');
    const loginData = {
      email: 'customer@test.com',
      password: 'Customer123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log('✅ Customer login successful');
    console.log('   User ID:', loginResponse.data.data.user.id);
    console.log('   Customer Name:', `${loginResponse.data.data.user.customer.firstName} ${loginResponse.data.data.user.customer.lastName}`);
    console.log('   Is Verified:', loginResponse.data.data.user.isVerified);

    global.customerToken = loginResponse.data.data.token;
    console.log();

    // Test 5: Vendor Login
    console.log('5. Testing Vendor Login...');
    const vendorLoginData = {
      email: 'vendor@test.com',
      password: 'Vendor123'
    };

    const vendorLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, vendorLoginData);
    console.log('✅ Vendor login successful');
    console.log('   Company:', vendorLoginResponse.data.data.user.vendor.companyName);
    console.log('   Registration Fee Paid:', vendorLoginResponse.data.data.user.vendor.registrationFeePaid);
    console.log('   Is Approved:', vendorLoginResponse.data.data.user.vendor.isApproved);

    global.vendorToken = vendorLoginResponse.data.data.token;
    console.log();

    // Test 6: Get User Profile (Protected Route)
    console.log('6. Testing Protected Route - Get User Profile...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${global.customerToken}`
      }
    });
    console.log('✅ Profile retrieval successful');
    console.log('   Email:', profileResponse.data.data.user.email);
    console.log('   Role:', profileResponse.data.data.user.role);
    console.log();

    // Test 7: Invalid Login
    console.log('7. Testing Invalid Login...');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'customer@test.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid login properly rejected');
        console.log('   Error:', error.response.data.error);
      } else {
        throw error;
      }
    }
    console.log();

    // Test 8: Unauthorized Access
    console.log('8. Testing Unauthorized Access...');
    try {
      await axios.get(`${BASE_URL}/api/auth/me`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Unauthorized access properly blocked');
        console.log('   Error:', error.response.data.error);
      } else {
        throw error;
      }
    }
    console.log();

    console.log('🎉 All authentication tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the tests
testAuthEndpoints();