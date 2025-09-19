# GrabtoGo Local Testing Checklist

## 🔧 Pre-Testing Setup

### 1. Environment Setup
- [ ] All `.env` files configured correctly
  - [ ] `/apps/web/.env.local` - Web app environment variables
  - [ ] `/apps/admin/.env.local` - Admin app environment variables
  - [ ] `/services/api/.env` - API service environment variables
- [ ] Database is running (PostgreSQL)
- [ ] Redis is running (if using caching)
- [ ] All dependencies installed (`npm install`)
- [ ] Database migrations run (`npm run db:migrate` in services/api)

### 2. Build Verification
- [ ] Web app builds successfully (`cd apps/web && npm run build`)
- [ ] Admin app builds successfully (`cd apps/admin && npm run build`)
- [ ] API service builds successfully (`cd services/api && npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint errors blocking builds

## 🧪 Functional Testing

### 3. Authentication Flow
- [ ] **Signup Flow**
  - [ ] Customer signup works
  - [ ] Vendor signup works
  - [ ] Email verification (if enabled)
  - [ ] Error handling for duplicate emails
- [ ] **Login Flow**
  - [ ] Customer login works
  - [ ] Vendor login works
  - [ ] Admin login works
  - [ ] Password reset works
  - [ ] Session persistence works
  - [ ] Logout works correctly

### 4. Customer Dashboard
- [ ] Dashboard loads without errors
- [ ] Profile information displays correctly
- [ ] Profile can be edited and saved
- [ ] Order history displays correctly
- [ ] Can browse vendors
- [ ] Can view vendor details
- [ ] Can add items to cart
- [ ] Can place orders
- [ ] Can view order status
- [ ] Can message vendors

### 5. Vendor Dashboard
- [ ] Dashboard loads without errors
- [ ] Profile information displays correctly
- [ ] Can edit vendor profile
- [ ] Can add/edit/delete products
- [ ] Can manage inventory
- [ ] Can view orders
- [ ] Can update order status
- [ ] Can create/manage offers
- [ ] Can view analytics
- [ ] Can respond to customer messages
- [ ] Subscription status displays correctly

### 6. Admin Dashboard
- [ ] Dashboard loads without errors
- [ ] Can view all users
- [ ] Can manage vendors
- [ ] Can view all orders
- [ ] Can view financial reports
- [ ] Can manage subscription plans
- [ ] Can view system analytics
- [ ] Can manage content/announcements
- [ ] Can handle vendor verifications

### 7. Payment Integration
- [ ] **Subscription Payments**
  - [ ] Can select subscription plan
  - [ ] Razorpay payment gateway loads
  - [ ] Test payment succeeds
  - [ ] Subscription activates after payment
  - [ ] Payment history updates
- [ ] **Order Payments**
  - [ ] Can process customer orders
  - [ ] Payment confirmation works
  - [ ] Order status updates after payment

### 8. API Endpoints
- [ ] Authentication endpoints work
- [ ] User CRUD operations work
- [ ] Vendor CRUD operations work
- [ ] Product CRUD operations work
- [ ] Order management works
- [ ] File upload works
- [ ] Search functionality works
- [ ] Filtering and pagination work

### 9. Real-time Features
- [ ] WebSocket connection establishes
- [ ] Real-time messaging works
- [ ] Order status updates in real-time
- [ ] Notifications work

### 10. Mobile Responsiveness
- [ ] Web app responsive on mobile
- [ ] Admin dashboard responsive on mobile
- [ ] All forms usable on mobile
- [ ] Navigation works on mobile
- [ ] Maps display correctly on mobile

## 🎨 UI/UX Testing

### 11. Visual Consistency
- [ ] Tailwind CSS styles load correctly
- [ ] Dark mode works (if implemented)
- [ ] All components render properly
- [ ] Images load correctly
- [ ] Icons display properly
- [ ] Loading states work
- [ ] Error states display correctly
- [ ] Success messages display correctly

### 12. Navigation
- [ ] All navigation links work
- [ ] Back button functionality works
- [ ] Breadcrumbs work (if implemented)
- [ ] Protected routes redirect correctly
- [ ] 404 page displays for invalid routes

## 🔒 Security Testing

### 13. Security Checks
- [ ] Authentication required for protected routes
- [ ] Role-based access control works
- [ ] API endpoints require authentication
- [ ] File upload restrictions work
- [ ] Input validation works
- [ ] XSS protection in place
- [ ] CSRF protection enabled

## ⚡ Performance Testing

### 14. Performance Metrics
- [ ] Pages load in < 3 seconds
- [ ] Images are optimized
- [ ] API responses are fast (< 500ms)
- [ ] No memory leaks in long sessions
- [ ] Pagination works for large datasets
- [ ] Search is responsive

## 🐛 Error Handling

### 15. Error Scenarios
- [ ] Network errors handled gracefully
- [ ] API errors show user-friendly messages
- [ ] Form validation errors display clearly
- [ ] 500 errors have fallback pages
- [ ] Offline mode handling (if applicable)

## 📱 Mobile App Testing (if applicable)

### 16. React Native App
- [ ] App builds for iOS
- [ ] App builds for Android
- [ ] Navigation works
- [ ] API integration works
- [ ] Push notifications work
- [ ] Camera/gallery access works
- [ ] Location services work

## 🚀 Pre-Deployment Checklist

### 17. Final Checks
- [ ] All test data removed
- [ ] Production environment variables ready
- [ ] Database backups configured
- [ ] Error logging configured
- [ ] Analytics tracking configured
- [ ] SEO meta tags in place
- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] SSL certificates ready
- [ ] CDN configured (if using)

## 📝 Testing Commands

```bash
# Start all services locally
npm run dev

# Run tests
npm run test

# Build all apps
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Database operations
cd services/api
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
```

## 🔄 Test Data Reset

```bash
# Reset database to clean state
cd services/api
npx prisma migrate reset
npm run db:seed
```

## 📊 Test Accounts

Create these test accounts for testing:

1. **Admin Account**
   - Email: admin@grabtogo.com
   - Password: Admin123!

2. **Vendor Account**
   - Email: vendor@test.com
   - Password: Vendor123!

3. **Customer Account**
   - Email: customer@test.com
   - Password: Customer123!

## ✅ Sign-off

- [ ] All critical features tested
- [ ] No blocking bugs found
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Ready for staging/production deployment

---

**Last Updated:** September 19, 2025
**Tested By:** [Your Name]
**Test Environment:** Local Development
**Notes:** [Add any specific notes about the testing session]