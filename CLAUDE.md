# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

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
- **Database**: PostgreSQL with PostGIS extension for geospatial data
- **ORM**: Prisma with custom client output at `src/lib/prisma`
- **Authentication**: NextAuth.js v5 with JWT strategy and role-based access
- **Caching**: Redis for session management and application caching
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

**Database & Cache:**
- `DATABASE_URL` - PostgreSQL connection with PostGIS
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Redis configuration

**Authentication:**
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` - NextAuth.js configuration
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth providers

**Payment Integration:**
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` - Payment processing

### Key Development Patterns

1. **Database Queries**: Always use the Prisma client from `src/lib/db.ts`
2. **Authentication**: Use `auth()` from `src/lib/auth.ts` for server-side auth checks
3. **Type Safety**: All database models are typed through Prisma client generation
4. **Error Handling**: Use consistent error responses across API routes
5. **Caching**: Implement Redis caching for frequently accessed data
6. **Real-time Features**: Use Socket.io provider for live updates

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
- Email: `admin@admin.com`
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

**Adding New Models:**
1. Update `prisma/schema.prisma`
2. Run `npm run db:generate`
3. Create and apply migration with `npm run db:migrate`
4. Update TypeScript types if needed

**Creating API Endpoints:**
1. Create route handler in `src/app/api/`
2. Import auth and db from `src/lib/`
3. Implement proper error handling and validation
4. Add authentication checks for protected routes

**Implementing Real-time Features:**
1. Use Socket.io provider from `src/components/providers/socket-provider.tsx`
2. Handle events in API routes under `/api/socket/`
3. Update UI components to listen for real-time events

**Testing Payment Flows:**
1. Use Razorpay test keys in development
2. Test with provided test card numbers
3. Verify webhook handling for production deployment