# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ✅ Current Production Status (Verified 2025-10-03)

**All core systems are operational:**
- ✅ Supabase PostgreSQL database connected and stable
- ✅ Supabase Storage for file uploads functioning
- ✅ Vendor registration flow complete and working (10-step wizard)
- ✅ Admin dashboard operational with vendor management
- ✅ Vendor approval workflow fully functional
- ✅ Payment processing with Razorpay integrated
- ✅ Authentication and authorization working

**Access Points:**
- Development: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin/login (info@grabtogo.in / admin)
- Vendor Registration: http://localhost:3000/auth/register/vendor
- Pending Approvals: http://localhost:3000/admin/vendors/pending

## Development Commands

### Development Server

```bash
# Start development server with automatic cache cleanup on exit
npm run dev

# Start development server without cache cleanup (preserves cache)
npm run dev:no-cleanup
```

**Note:** The default `npm run dev` now automatically clears Redis cache and Next.js build cache when you stop the server (Ctrl+C). This ensures a clean state for each development session. See [CACHE_CLEANUP.md](./CACHE_CLEANUP.md) for details.

### Database Operations

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Run database migrations in development
npm run db:migrate

# Push schema changes without migrations (development only)
npm run db:push

# Open Prisma Studio for database inspection
npm run db:studio

# Reset database and apply all migrations
npm run db:reset

# Deploy migrations to production
npm run db:deploy

# Create admin user (for initial setup)
npm run create-admin
```

### Application Development

```bash
# Start development server
npm run dev

# Build application for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Type check without emitting files
npm run type-check
```

## Architecture Overview

### Core Technology Stack

- **Framework**: Next.js 14 with App Router and Server Components
- **Database**: Supabase PostgreSQL with PostGIS extension for geospatial data
- **Storage**: Supabase Storage for file uploads, documents, and images
- **ORM**: Prisma with custom client output at `src/lib/prisma`
- **Authentication**: NextAuth.js v5 with JWT strategy and role-based access
- **Caching**: Redis for session management and application caching (optional)
- **Payments**: Razorpay integration for Indian market
- **Real-time**: Socket.io for chat and notifications
- **UI**: Tailwind CSS with shadcn/ui components

### Database Schema Design

The application uses a comprehensive multi-vendor marketplace schema with:

**Core Models:**

- `User` - Central user model with roles (CUSTOMER, VENDOR, ADMIN)
- `VendorProfile` - Extended vendor information with geospatial location
- `Product` - Products with variants, images, and full-text search
- `Order` - Complete order management with status tracking
- `Payment` - Razorpay payment integration with status tracking

**Advanced Features:**

- **Stories System**: `VendorStory` and `StoryView` for Instagram-like vendor stories
- **Subscription System**: `VendorSubscription` with tiered pricing (₹99/₹199/₹299)
- **Real-time Chat**: `Chat`, `ChatParticipant`, and `ChatMessage` models
- **Analytics**: `VendorAnalytics` for daily vendor performance metrics
- **Reviews**: `Review` with helpful votes and image support

**Geospatial Features:**

- PostGIS integration for location-based vendor search
- `location` field using `geography(POINT, 4326)` type
- Delivery radius calculations

### Authentication Architecture

NextAuth.js v5 configuration in `src/lib/auth.ts`:

- JWT-based sessions for better performance
- Multi-provider support (Credentials, Google OAuth)
- Role-based access control integrated into JWT tokens
- Custom sign-in callbacks for user creation and role assignment

### API Route Structure

All API routes follow RESTful patterns under `src/app/api/`:

**Core APIs:**

- `/api/auth/*` - NextAuth.js authentication handlers
- `/api/products` - Product management with pagination and filtering
- `/api/vendors` - Vendor listing and management
- `/api/payments/*` - Razorpay order creation and verification

**Advanced APIs:**

- `/api/chat/*` - Real-time chat message handling
- `/api/stories/*` - Vendor story management with 24-hour expiry
- `/api/notifications/*` - Push notification system
- `/api/subscriptions` - Vendor subscription management
- `/api/analytics` - Business intelligence and reporting

### Component Architecture

UI components are organized in `src/components/`:

**Core UI Components** (`src/components/ui/`):

- Based on shadcn/ui design system
- Fully customizable with Tailwind CSS
- TypeScript interfaces for all props
- Special components: `search-bar`, `loading-states`, `error-boundary`, `pwa-installer`

**Feature Components**:

- `auth/protected-route.tsx` - Route protection with role-based access
- `providers/session-provider.tsx` - NextAuth session management
- `providers/socket-provider.tsx` - Socket.io connection management
- `home/*` - Homepage sections (hero, stories, products, categories)
- `notifications/notification-center.tsx` - Real-time notification UI

### Environment Configuration

Required environment variables in `.env`:

**Supabase Configuration:**

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `DATABASE_URL` - Supabase PostgreSQL connection string

**Database & Cache:**

- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Redis configuration (optional)

**Authentication:**

- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` - NextAuth.js configuration
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth providers

**Payment Integration:**

- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` - Payment processing

### Key Development Patterns

1. **Database Queries**: Always use the Prisma client from `src/lib/db.ts`
2. **Authentication**: Use `auth()` from `src/lib/auth.ts` for server-side auth checks
3. **File Uploads**: Use Supabase Storage via `src/lib/supabase.ts` helper functions
4. **Type Safety**: All database models are typed through Prisma client generation
5. **Error Handling**: Use consistent error responses across API routes
6. **Caching**: Implement Redis caching for frequently accessed data (optional)
7. **Real-time Features**: Use Socket.io provider for live updates

### Supabase Storage Integration

**Storage Buckets:**

- `vendor-documents` (Private) - GST certificates, PAN cards, business registrations, bank proofs
- `vendor-logos` (Public) - Business logos
- `vendor-photos` (Public) - Store banners and photos
- `product-images` (Public) - Product images

**File Upload API:**

- Endpoint: `/api/vendor/upload`
- Features: Progress tracking, file validation, error handling
- Max sizes: Documents (10MB), Logos (2MB), Photos (5MB)

**Signed URLs for Private Documents:**

- Endpoint: `/api/vendor/signed-url`
- Admin-only access
- 1-hour expiry by default
- Used for secure document viewing in admin dashboard

**Helper Functions** (`src/lib/supabase.ts`):

- `createSignedUrl()` - Generate signed URLs for private files
- `uploadWithProgress()` - Upload with progress tracking
- `getImageWithTransform()` - Get optimized image URLs with transformations

### Progressive Web App (PWA) Features

- Service worker at `public/sw.js` with caching strategies
- Web app manifest at `public/manifest.json`
- PWA installer component with iOS-specific instructions
- Offline page at `public/offline.html`

### Payment Integration Patterns

Razorpay integration follows this flow:

1. Create order via `/api/payments/create-order`
2. Process payment on frontend with Razorpay Checkout
3. Verify payment via `/api/payments/verify`
4. Update order status and create payment record

### Admin Access

**Default Admin Account:**

- Email: `info@grabtogo.in`
- Password: `admin`
- Access: `/admin` route (requires admin role)

**Admin Setup:**
Run `npm run create-admin` after initial database setup to create the admin user.

### Repository Configuration

- **Always commit changes** to GitHub repository: https://github.com/Alex-Invenex/grabtogo
- Use conventional commit messages
- Database migrations should be committed alongside schema changes
- Environment variables must never be committed (use .env.example)

### Common Development Tasks

**Setting Up Supabase (First-time Setup):**

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Enable PostGIS: Run `CREATE EXTENSION IF NOT EXISTS postgis;` in SQL Editor
3. Create storage buckets: `vendor-documents` (Private), `vendor-logos`, `vendor-photos`, `product-images` (Public)
4. Copy connection string and API keys to `.env`
5. Run migrations via SQL Editor or `npm run db:migrate`
6. Create admin user: `npm run create-admin`

**Adding New Models:**

1. Update `prisma/schema.prisma`
2. Run `npm run db:generate`
3. Create and apply migration with `npm run db:migrate` (or via Supabase SQL Editor)
4. Update TypeScript types if needed

**Creating API Endpoints:**

1. Create route handler in `src/app/api/`
2. Import auth and db from `src/lib/`
3. Implement proper error handling and validation
4. Add authentication checks for protected routes

**Adding File Upload Features:**

1. Use `/api/vendor/upload` endpoint for uploads
2. Implement progress tracking on frontend
3. Store returned URLs in database
4. Use signed URLs for private documents via `/api/vendor/signed-url`

**Implementing Real-time Features:**

1. Use Socket.io provider from `src/components/providers/socket-provider.tsx`
2. Handle events in API routes under `/api/socket/`
3. Update UI components to listen for real-time events

**Testing Payment Flows:**

1. Use Razorpay test keys in development
2. Test with provided test card numbers
3. Verify webhook handling for production deployment

### Critical Database Schema Mappings

**IMPORTANT**: When working with vendor approvals, be aware of field name differences between registration requests and database models:

**VendorRegistrationRequest → VendorProfile Mappings:**
- `companyName` → `storeName`
- `addressLine1 + addressLine2` → `address` (combine with comma)
- `pinCode` → `zipCode`
- `logo` → `logoUrl`
- `banner` → `bannerUrl`
- `tagline` → `description`
- `gstNumber` → `businessLicense`
- `gstVerified` → `isVerified`
- Generate `storeSlug` from `companyName` (lowercase, replace non-alphanumeric with `-`)

**VendorRegistrationRequest → VendorSubscription:**
- `vendorId` must be `user.id` (NOT `vendorProfile.id`)
- Use lowercase values: `planType: 'premium'`, `status: 'trial'`, `billingCycle: 'monthly'`
- Always include: `isTrial: true`, `maxProducts`, `maxOrders`, `storageLimit`, `analyticsAccess`, `prioritySupport`, `amount`, `currency`

**Fields that DO NOT exist in database models:**
- VendorProfile: `businessType`, `businessCategory`, `yearsInBusiness`, `numberOfEmployees`, `landmark`, `agentCode`, `agentName`, `agentPhone`
- These are only in `VendorRegistrationRequest` for admin review

### Testing & Debugging

**Clear Vendor Data (for testing):**
```bash
# Delete all vendor registrations, users, profiles, and subscriptions
node scripts/delete-test-vendors.js

# Clear uploaded files from Supabase Storage
node scripts/clear-vendor-storage.js

# Check database sync status
npm run db:check
```

**Common Issues:**

1. **Vendor approval fails**: Check field name mappings above. The API route must map registration request fields to the correct database schema fields.

2. **File upload fails**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`. File uploads use the admin client to bypass RLS.

3. **Signed URLs not working**: Admin-only endpoint. Check user role is ADMIN in session.

4. **Database schema out of sync**: Run `npm run db:generate` after any schema changes, then restart dev server.

### Documentation References

For detailed information about implemented features:

- `SUPABASE_MIGRATION_GUIDE.md` - Database setup and migration
- `SUPABASE_STORAGE_SETUP.md` - Storage bucket configuration
- `SUPABASE_INTEGRATION_SUMMARY.md` - Complete integration overview
- `VENDOR_REGISTRATION_SYSTEM.md` - 10-step registration flow
- `admindashboard.md` - Admin dashboard features
- `features.md` - Complete features specification
