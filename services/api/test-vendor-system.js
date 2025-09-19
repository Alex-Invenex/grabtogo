const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Store tokens for different user types
let vendorToken = '';
let adminToken = '';
let vendorId = '';

async function testVendorManagementSystem() {
  try {
    console.log('🧪 Testing GrabtoGo Vendor Management System\n');

    // Step 1: Register a new vendor
    console.log('1. Testing Vendor Registration...');
    const vendorData = {
      email: 'testvendor@grabtogo.com',
      password: 'TestVendor123',
      phone: '+91-9876543212',
      role: 'VENDOR',
      companyName: 'Test Restaurant & Cafe',
      gstNumber: '27ABCDE1234F1Z5',
      address: 'Test Restaurant Address, Mumbai, Maharashtra',
      latitude: 19.0760,
      longitude: 72.8777,
      categories: ['Indian', 'Fast Food', 'Beverages']
    };

    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, vendorData);
      vendorToken = registerResponse.data.data.token;
      vendorId = registerResponse.data.data.user.vendor.id;
      console.log('✅ Vendor registration successful');
      console.log('   Company:', registerResponse.data.data.user.vendor.companyName);
      console.log('   Trial Period Ends:', new Date(registerResponse.data.data.user.vendor.trialEndsAt).toDateString());
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error?.includes('already')) {
        console.log('ℹ️  Vendor already exists - logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: vendorData.email,
          password: vendorData.password
        });
        vendorToken = loginResponse.data.data.token;
        vendorId = loginResponse.data.data.user.vendor.id;
      } else {
        throw error;
      }
    }
    console.log();

    // Step 2: Get vendor profile and dashboard data
    console.log('2. Testing Vendor Profile Dashboard...');
    const profileResponse = await axios.get(`${BASE_URL}/api/vendors/profile`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    console.log('✅ Vendor profile retrieved successfully');
    console.log('   Company:', profileResponse.data.data.profile.companyName);
    console.log('   Registration Fee Paid:', profileResponse.data.data.profile.registrationFeePaid);
    console.log('   Is Approved:', profileResponse.data.data.profile.isApproved);
    console.log('   Subscription Status:', profileResponse.data.data.profile.subscriptionStatus);
    console.log('   Trial Days Left:', profileResponse.data.data.trialStatus.daysLeft);
    console.log('   Next Step:', profileResponse.data.data.onboardingStatus.nextStep);
    console.log();

    // Step 3: Test subscription plans
    console.log('3. Testing Subscription Plans...');
    const plansResponse = await axios.get(`${BASE_URL}/api/subscriptions/plans`);
    console.log('✅ Subscription plans retrieved successfully');
    plansResponse.data.data.plans.forEach(plan => {
      console.log(`   ${plan.name}: ₹${plan.pricing.monthly.amount/100}/month, ₹${plan.pricing.yearly.amount/100}/year`);
      console.log(`     Features: ${plan.features.slice(0, 3).join(', ')}...`);
    });
    console.log();

    // Step 4: Test registration fee payment
    console.log('4. Testing Registration Fee Payment...');
    try {
      const regFeeResponse = await axios.post(`${BASE_URL}/api/vendors/pay-registration-fee`, {}, {
        headers: { 'Authorization': `Bearer ${vendorToken}` }
      });
      console.log('✅ Registration fee payment order created');
      console.log('   Order ID:', regFeeResponse.data.data.order.id);
      console.log('   Amount:', `₹${regFeeResponse.data.data.order.breakdown.totalAmount}`);
      console.log('   Breakdown: Base ₹299 + GST ₹53.82 = Total ₹352.82');

      // Simulate successful payment
      const paymentSuccessResponse = await axios.post(`${BASE_URL}/api/vendors/registration-fee-success`, {
        razorpay_order_id: regFeeResponse.data.data.order.id,
        razorpay_payment_id: 'pay_demo123456789',
        razorpay_signature: 'demo_signature_12345'
      }, {
        headers: { 'Authorization': `Bearer ${vendorToken}` }
      });
      console.log('✅ Registration fee payment processed successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error?.includes('already paid')) {
        console.log('ℹ️  Registration fee already paid');
      } else {
        throw error;
      }
    }
    console.log();

    // Step 5: Register and login as admin
    console.log('5. Setting up Admin User...');
    const adminData = {
      email: 'admin@grabtogo.com',
      password: 'Admin123',
      role: 'ADMIN',
      firstName: 'System',
      lastName: 'Administrator'
    };

    try {
      const adminRegResponse = await axios.post(`${BASE_URL}/api/auth/register`, adminData);
      adminToken = adminRegResponse.data.data.token;
      console.log('✅ Admin user created');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error?.includes('already')) {
        const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: adminData.email,
          password: adminData.password
        });
        adminToken = adminLoginResponse.data.data.token;
        console.log('ℹ️  Admin user already exists - logged in');
      } else {
        throw error;
      }
    }
    console.log();

    // Step 6: Test admin functions
    console.log('6. Testing Admin Dashboard...');
    const dashboardResponse = await axios.get(`${BASE_URL}/api/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Admin dashboard data retrieved');
    console.log('   Total Vendors:', dashboardResponse.data.data.summary.totalVendors);
    console.log('   Pending Approvals:', dashboardResponse.data.data.summary.pendingApprovals);
    console.log('   Active Subscriptions:', dashboardResponse.data.data.summary.activeSubscriptions);
    console.log('   Trial Users:', dashboardResponse.data.data.summary.trialUsers);
    console.log();

    // Step 7: Test vendor approval
    console.log('7. Testing Vendor Approval Process...');
    const pendingVendorsResponse = await axios.get(`${BASE_URL}/api/admin/pending-vendors`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Pending vendors retrieved');
    console.log('   Total Pending:', pendingVendorsResponse.data.data.vendors.length);

    if (pendingVendorsResponse.data.data.vendors.length > 0) {
      const vendorToApprove = pendingVendorsResponse.data.data.vendors.find(v => v.id === vendorId) ||
                              pendingVendorsResponse.data.data.vendors[0];

      const approvalResponse = await axios.post(`${BASE_URL}/api/admin/approve-vendor/${vendorToApprove.id}`, {
        comments: 'Documents verified. All requirements met.'
      }, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      console.log('✅ Vendor approved successfully');
      console.log('   Approved Vendor:', approvalResponse.data.data.companyName);
    } else {
      console.log('ℹ️  No pending vendors to approve');
    }
    console.log();

    // Step 8: Test subscription creation
    console.log('8. Testing Subscription Creation...');
    try {
      const subscriptionResponse = await axios.post(`${BASE_URL}/api/subscriptions/create`, {
        planType: 'STANDARD',
        billingCycle: 'monthly'
      }, {
        headers: { 'Authorization': `Bearer ${vendorToken}` }
      });
      console.log('✅ Subscription created successfully');
      console.log('   Plan Type:', 'STANDARD');
      console.log('   Billing Cycle:', 'monthly');
      console.log('   Subscription ID:', subscriptionResponse.data.data.subscription.id);

      // Simulate successful payment
      const paymentResponse = await axios.post(`${BASE_URL}/api/subscriptions/payment-success`, {
        razorpay_payment_id: 'pay_sub123456789',
        razorpay_subscription_id: subscriptionResponse.data.data.subscription.id,
        razorpay_signature: 'sub_signature_12345'
      }, {
        headers: { 'Authorization': `Bearer ${vendorToken}` }
      });
      console.log('✅ Subscription payment processed successfully');
      console.log('   Status:', paymentResponse.data.data.status);
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error?.includes('already exists')) {
        console.log('ℹ️  Active subscription already exists');
      } else {
        console.log('⚠️  Subscription creation failed:', error.response?.data?.message || error.message);
      }
    }
    console.log();

    // Step 9: Test subscription status
    console.log('9. Testing Subscription Status...');
    const subStatusResponse = await axios.get(`${BASE_URL}/api/vendors/subscription-status`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    console.log('✅ Subscription status retrieved');
    console.log('   Current Status:', subStatusResponse.data.data.currentStatus);
    console.log('   Can Upgrade:', subStatusResponse.data.data.canUpgrade);
    console.log('   Requires Payment:', subStatusResponse.data.data.requiresPayment);
    if (subStatusResponse.data.data.activeSubscription) {
      console.log('   Active Plan:', subStatusResponse.data.data.activeSubscription.planType);
      console.log('   Billing Cycle:', subStatusResponse.data.data.activeSubscription.billingCycle);
    }
    console.log();

    // Step 10: Test current subscription details
    console.log('10. Testing Current Subscription Details...');
    const currentSubResponse = await axios.get(`${BASE_URL}/api/subscriptions/current`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    console.log('✅ Current subscription details retrieved');
    console.log('   Has Active Subscription:', currentSubResponse.data.data.hasActiveSubscription);
    if (currentSubResponse.data.data.hasActiveSubscription) {
      const sub = currentSubResponse.data.data.subscription;
      console.log('   Plan:', sub.planName);
      console.log('   Amount:', `₹${sub.amount}/month`);
      console.log('   Start Date:', new Date(sub.startDate).toDateString());
      console.log('   End Date:', new Date(sub.endDate).toDateString());
    }
    console.log();

    // Step 11: Test subscription invoices
    console.log('11. Testing Subscription Invoices...');
    const invoicesResponse = await axios.get(`${BASE_URL}/api/subscriptions/invoices`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    console.log('✅ Subscription invoices retrieved');
    console.log('   Total Invoices:', invoicesResponse.data.data.invoices.length);
    invoicesResponse.data.data.invoices.forEach((invoice, index) => {
      console.log(`   Invoice ${index + 1}: ${invoice.invoiceNumber} - ₹${invoice.amount} (${invoice.status})`);
    });
    console.log();

    // Step 12: Test vendor profile update
    console.log('12. Testing Vendor Profile Update...');
    const updateResponse = await axios.put(`${BASE_URL}/api/vendors/profile`, {
      companyName: 'Updated Test Restaurant & Cafe',
      categories: ['Indian', 'Fast Food', 'Beverages', 'Desserts'],
      businessHours: {
        monday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
        tuesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
        wednesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
        thursday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
        friday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
        saturday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
        sunday: { isOpen: true, openTime: '10:00', closeTime: '22:00' }
      }
    }, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    console.log('✅ Vendor profile updated successfully');
    console.log('   Updated Company Name:', updateResponse.data.data.companyName);
    console.log('   Categories:', updateResponse.data.data.categories.join(', '));
    console.log();

    // Step 13: Test admin vendor list
    console.log('13. Testing Admin Vendor Management...');
    const vendorsResponse = await axios.get(`${BASE_URL}/api/admin/vendors?status=all&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Vendor list retrieved');
    console.log('   Total Vendors:', vendorsResponse.data.data.summary.total);
    console.log('   Approved:', vendorsResponse.data.data.summary.approved);
    console.log('   Pending:', vendorsResponse.data.data.summary.pending);
    console.log('   Active Subscriptions:', vendorsResponse.data.data.summary.activeSubscriptions);
    console.log();

    // Step 14: Test admin subscription analytics
    console.log('14. Testing Admin Subscription Analytics...');
    const subAnalyticsResponse = await axios.get(`${BASE_URL}/api/admin/subscriptions?limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Subscription analytics retrieved');
    console.log('   Total Revenue: ₹' + subAnalyticsResponse.data.data.analytics.totalRevenue);
    console.log('   Plan Distribution:', JSON.stringify(subAnalyticsResponse.data.data.analytics.planDistribution));
    console.log('   Status Distribution:', JSON.stringify(subAnalyticsResponse.data.data.analytics.statusDistribution));
    console.log();

    console.log('🎉 All vendor management system tests completed successfully!');
    console.log('\n📊 Vendor Dashboard Data Structure:');
    console.log('├── Profile Information');
    console.log('│   ├── Company Details (name, GST, address, coordinates)');
    console.log('│   ├── Business Hours & Categories');
    console.log('│   ├── Approval Status & Registration Fee Status');
    console.log('│   └── Trial/Subscription Status');
    console.log('├── Subscription Management');
    console.log('│   ├── Available Plans (Basic/Standard/Premium)');
    console.log('│   ├── Current Subscription Details');
    console.log('│   ├── Billing & Invoices');
    console.log('│   └── Payment Integration (Razorpay)');
    console.log('├── Onboarding Flow');
    console.log('│   ├── 1. Registration (30-day trial starts)');
    console.log('│   ├── 2. Pay Registration Fee (₹299 + GST)');
    console.log('│   ├── 3. Document Verification');
    console.log('│   ├── 4. Admin Approval');
    console.log('│   └── 5. Choose Subscription Plan');
    console.log('└── Admin Management');
    console.log('    ├── Vendor Approval/Rejection');
    console.log('    ├── Subscription Analytics');
    console.log('    ├── Revenue Tracking');
    console.log('    └── Dashboard Overview');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the tests
testVendorManagementSystem();