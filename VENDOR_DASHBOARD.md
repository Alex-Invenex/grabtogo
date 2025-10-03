# GrabtoGo Vendor Dashboard - Complete Implementation Guide

## 📋 Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Implementation Status](#implementation-status)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Vendor Workflow](#vendor-workflow)
- [Subscription Lifecycle](#subscription-lifecycle)
- [Development Guide](#development-guide)

---

## 🎯 Overview

The GrabtoGo Vendor Dashboard is a comprehensive vendor management system that allows registered vendors to manage their entire business presence on the platform. The system includes product management, analytics, advertising, customer communication, and subscription management.

### Key Objectives
1. Provide vendors with complete control over their business profile
2. Enable seamless product and inventory management
3. Offer real-time analytics and performance tracking
4. Facilitate customer engagement through stories and messaging
5. Support revenue generation through ads and promotions
6. Ensure transparent subscription and billing management

---

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Supabase PostgreSQL with PostGIS
- **Storage**: Supabase Storage
- **Real-time**: Socket.io
- **Payments**: Razorpay
- **Maps**: Google Maps API (Maps, Geocoding, Places)

### Authentication Flow
```
Vendor Registration (/auth/register/vendor)
    ↓
Admin Approval (Admin Dashboard)
    ↓
Vendor Account Created (role: VENDOR)
    ↓
Email Notification with Credentials
    ↓
Vendor Login (/auth/login)
    ↓
Auto-redirect to /vendor/dashboard
```

### Database Structure
```
User (role: VENDOR)
├── VendorProfile (business details, location, branding)
├── VendorSubscription (plan, billing, limits)
├── Products (with images and variants)
├── VendorStory (24-hour stories)
├── VendorAnalytics (daily metrics)
├── SupportTicket (customer support)
├── AdServiceRequest (ad campaigns)
└── Chat/ChatMessage (real-time messaging)
```

---

## ✨ Features

### 1. Business Profile Management
**Location**: `/vendor/profile`

**Features**:
- Business information (name, type, category, description)
- Operating hours (opening/closing times for each day)
- Location management with Google Maps integration
- Social media links (Instagram, Facebook, WhatsApp, YouTube)
- Contact details (phone numbers, email)
- Branding (logo, banner, tagline)
- Business documents (menu, brochures, certificates)

**API Endpoints**:
- `GET /api/vendor/profile` - Get vendor profile
- `PUT /api/vendor/profile` - Update vendor profile
- `POST /api/vendor/upload` - Upload documents/media

**Database**: `VendorProfile` table

---

### 2. Product Management
**Location**: `/vendor/products`

**Features**:
- Add new products with multiple images
- Edit existing products
- Manage product variants (size, color, etc.)
- Stock management and low stock alerts
- Pricing and discount management
- Product categories and tags
- Search and filter products
- Bulk operations (enable/disable, delete)

**API Endpoints**:
- `GET /api/products` - List all vendor products
- `POST /api/products` - Create new product
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

**Database**: `Product`, `ProductImage`, `ProductVariant` tables

---

### 3. Instant Offers & Flash Sales
**Location**: `/vendor/offers`

**Features**:
- Create limited-time offers (BOGO, percentage off, flat discount)
- Set expiry date/time with countdown timers
- Stock limits for flash sales
- Enable/disable offers
- Track offer performance
- Display offers prominently on homepage

**API Endpoints**:
- `GET /api/vendor/offers` - List all offers
- `POST /api/vendor/offers` - Create new offer
- `PUT /api/vendor/offers/[id]` - Update offer
- `DELETE /api/vendor/offers/[id]` - Delete offer

**Database**: Extend `Product` table with offer fields or create `FlashSale` model

---

### 4. Vendor Stories
**Location**: `/vendor/stories`

**Features**:
- Upload image/video stories (Instagram-style)
- Tag products in stories
- 24-hour auto-expiry
- View story analytics (views, engagement, reach)
- Delete stories before expiry
- Story carousel on homepage

**API Endpoints**:
- `GET /api/stories` - Get all stories (already exists!)
- `POST /api/stories` - Create new story (already exists!)
- `GET /api/stories/[storyId]` - Get story details (already exists!)
- `POST /api/stories/[storyId]/view` - Track story view (already exists!)
- `DELETE /api/stories/[storyId]` - Delete story (already exists!)

**Database**: `VendorStory`, `StoryView` tables (already exist!)

**Status**: ✅ Backend API fully functional, need frontend UI only

---

### 5. Ad Campaign Management
**Location**: `/vendor/ads`

**Features**:
- Create ad campaigns for:
  - Homepage banner ads
  - Search page sponsored listings
  - Product page promotions
  - Popup ads
- Bidding system for ad placements
- Set campaign duration and budget
- Payment integration with Razorpay
- Track ad performance (impressions, clicks, CTR, conversions)
- Pause/resume campaigns
- View ad analytics

**API Endpoints**:
- `GET /api/vendor/ads` - List all ad campaigns
- `POST /api/vendor/ads` - Create ad campaign with payment
- `GET /api/vendor/ads/[id]` - Get campaign details
- `PUT /api/vendor/ads/[id]` - Update campaign
- `GET /api/vendor/ads/[id]/analytics` - Get ad performance

**Database**: `AdServiceRequest` table (already exists!)

**Payment Flow**:
```
Create Ad Campaign
    ↓
Razorpay Payment Order Created
    ↓
Vendor Pays via Razorpay
    ↓
Payment Verified
    ↓
Ad Status: PENDING → APPROVED → ACTIVE
    ↓
Ad Displayed on Platform
```

---

### 6. Analytics Dashboard
**Location**: `/vendor/analytics`

**Features**:
- **Sales Metrics**:
  - Daily/weekly/monthly revenue
  - Order count and average order value
  - Top-selling products
  - Revenue by category

- **Customer Metrics**:
  - Total customers
  - New vs returning customers
  - Customer lifetime value
  - Geographic distribution

- **Engagement Metrics**:
  - Store visits and page views
  - Story views and engagement
  - Product views and clicks
  - Conversion rate

- **Ad Performance**:
  - Ad impressions and clicks
  - Click-through rate (CTR)
  - Cost per click (CPC)
  - Return on ad spend (ROAS)

**API Endpoints**:
- `GET /api/vendor/analytics` - Get comprehensive analytics
- `GET /api/vendor/analytics/sales` - Sales data
- `GET /api/vendor/analytics/customers` - Customer data
- `GET /api/vendor/analytics/engagement` - Engagement metrics
- `GET /api/vendor/analytics/ads` - Ad performance

**Database**: `VendorAnalytics` table (already exists!)

---

### 7. Subscription Management
**Location**: `/vendor/subscription`

**Features**:
- View current subscription plan and status
- Display days remaining in subscription
- Upgrade/downgrade plan
- Cancel subscription
- Renew subscription (within 30-day grace period)
- View payment history
- Manage auto-renewal settings

**Subscription Lifecycle**:
```
TRIAL (20 days free)
    ↓
ACTIVE (paying subscription)
    ↓
CANCELLED (30-day grace period)
    ├─→ RENEWED (if renewed within 30 days)
    └─→ EXPIRED + DATA DELETION (after 30 days)
```

**API Endpoints**:
- `GET /api/subscriptions` - Get subscription details (already exists!)
- `POST /api/vendor/subscription/cancel` - Cancel subscription
- `POST /api/vendor/subscription/renew` - Renew subscription
- `POST /api/vendor/subscription/upgrade` - Upgrade plan
- `GET /api/vendor/subscription/history` - Payment history

**Database**: `VendorSubscription`, `SubscriptionPayment` tables (already exist!)

**Cancellation Logic**:
1. Update subscription status to 'cancelled'
2. Hide all vendor products (set `isActive = false`)
3. Hide vendor profile from search
4. Set 30-day deletion reminder
5. Send email notification
6. If renewed within 30 days: Restore all products and profile
7. If not renewed: Delete all vendor data

---

### 8. Support Ticket System
**Location**: `/vendor/support`

**Features**:
- Create support tickets for technical issues
- Real-time chat with admin via Socket.io
- Attach screenshots and files
- Track ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- Priority levels (LOW, MEDIUM, HIGH, URGENT)
- Ticket history and responses
- Email notifications on admin responses

**API Endpoints**:
- `GET /api/vendor/tickets` - List all tickets
- `POST /api/vendor/tickets` - Create new ticket
- `GET /api/vendor/tickets/[id]` - Get ticket details
- `POST /api/vendor/tickets/[id]/response` - Add response
- `PUT /api/vendor/tickets/[id]/status` - Update status

**Database**: `SupportTicket`, `TicketResponse` tables (already exist!)

**Real-time Integration**:
```javascript
// Vendor creates ticket
socket.emit('create-ticket', { subject, description, priority });

// Admin responds
socket.emit('ticket-response', { ticketId, message });

// Vendor receives notification
socket.on('new-ticket-response', (data) => {
  // Display notification and update UI
});
```

---

### 9. Account Settings
**Location**: `/vendor/settings`

**Features**:
- Update personal information (name, email, phone)
- Change password
- Email verification
- Two-factor authentication (optional)
- Notification preferences
- Privacy settings
- Delete account (with confirmation)

**API Endpoints**:
- `GET /api/vendor/settings` - Get account settings
- `PUT /api/vendor/settings` - Update settings
- `POST /api/vendor/account/delete` - Delete account

**Account Deletion Process**:
1. Require password confirmation
2. Show warning about data loss
3. Optional: Provide data export
4. Delete in transaction:
   - All products and images
   - Vendor profile
   - Subscriptions and payments
   - Stories
   - Ad campaigns
   - Support tickets
   - User account
5. Send confirmation email
6. Logout user

---

## 📊 Implementation Status

| Feature | Backend API | Frontend UI | Status |
|---------|------------|-------------|--------|
| Business Profile | 🟡 Partial | ⭕ Not Started | 30% |
| Product Management | ✅ Complete | ⭕ Not Started | 40% |
| Instant Offers | ⭕ Not Started | ⭕ Not Started | 0% |
| Vendor Stories | ✅ Complete | ⭕ Not Started | 50% |
| Ad Campaigns | 🟡 Partial | ⭕ Not Started | 20% |
| Analytics | 🟡 Partial | ⭕ Not Started | 30% |
| Subscription | ✅ Complete | 🟡 Basic | 60% |
| Support Tickets | ⭕ Not Started | ⭕ Not Started | 0% |
| Account Settings | 🟡 Partial | ⭕ Not Started | 20% |
| Dashboard Home | 🟡 Partial | ✅ Basic | 50% |

**Legend**:
- ✅ Complete
- 🟡 Partial
- ⭕ Not Started

---

## 🔌 API Documentation

### Authentication
All vendor API endpoints require authentication with `role: VENDOR`.

**Headers**:
```
Authorization: Bearer <session-token>
Content-Type: application/json
```

### Common Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message",
  "details": { /* error details */ }
}
```

### Rate Limiting
- API calls: 100 requests per 15 minutes
- File uploads: 10 uploads per hour
- Story creation: 20 stories per day

---

## 🗄️ Database Schema

### VendorProfile
```prisma
model VendorProfile {
  id          String  @id @default(cuid())
  userId      String  @unique
  storeName   String
  storeSlug   String  @unique
  description String?
  logoUrl     String?
  bannerUrl   String?

  // Business details
  businessLicense String?
  taxId           String?

  // Location
  address      String?
  city         String?
  state        String?
  zipCode      String?
  country      String   @default("India")
  latitude     Float?
  longitude    Float?
  deliveryRadius Float?   @default(10)

  // Relationships
  user User @relation(fields: [userId], references: [id])
}
```

### VendorSubscription
```prisma
model VendorSubscription {
  id          String   @id @default(cuid())
  vendorId    String   @unique
  planType    String   // basic, standard, premium
  status      String   @default("active") // active, cancelled, expired, trial
  startDate   DateTime @default(now())
  endDate     DateTime
  autoRenew   Boolean  @default(true)
  isTrial     Boolean  @default(false)
  trialEndsAt DateTime?

  // Plan limits
  maxProducts      Int     @default(10)
  maxOrders        Int     @default(100)
  storageLimit     Int     @default(1000) // MB
  analyticsAccess  Boolean @default(false)
  prioritySupport  Boolean @default(false)

  // Billing
  amount           Decimal @db.Decimal(10, 2)
  currency         String  @default("INR")
  billingCycle     String  @default("monthly")

  // Payment tracking
  razorpayPlanId       String?
  razorpaySubscriptionId String?

  vendor User @relation("VendorSubscription", fields: [vendorId], references: [id])
  payments SubscriptionPayment[]
}
```

---

## 👤 Vendor Workflow

### 1. Registration & Onboarding
```
Step 1: Vendor completes 10-step registration
   ├─ Personal Information
   ├─ Business Details
   ├─ Address & Location
   ├─ Agent Reference (optional)
   ├─ GST Verification
   ├─ Document Upload
   ├─ Logo & Branding
   ├─ Package Selection
   ├─ Review & Confirm
   └─ Payment (₹299 registration fee)

Step 2: Admin reviews application
   └─ Approve/Reject decision

Step 3: On approval
   ├─ User account created (email + password)
   ├─ 20-day premium trial activated
   ├─ Email sent with login credentials
   └─ Vendor can log in immediately
```

### 2. First Login Experience
```
Login → Vendor Dashboard
   ├─ Welcome message
   ├─ Setup wizard (optional)
   │   ├─ Complete business profile
   │   ├─ Add first product
   │   └─ Create first story
   ├─ Trial status banner
   └─ Quick action buttons
```

### 3. Daily Operations
```
Dashboard → Choose Action
   ├─ Manage Products
   │   ├─ Add new products
   │   ├─ Update inventory
   │   └─ Create offers
   ├─ View Analytics
   │   ├─ Sales metrics
   │   ├─ Customer insights
   │   └─ Ad performance
   ├─ Engage Customers
   │   ├─ Post stories
   │   ├─ Respond to messages
   │   └─ Reply to reviews
   └─ Run Campaigns
       ├─ Create ads
       └─ Monitor performance
```

---

## 💳 Subscription Lifecycle

### Trial Period (20 Days Free)
```
Day 0: Approval
   └─ Premium trial activated

Day 1-15: Full access
   ├─ All premium features unlocked
   ├─ Unlimited products
   └─ Analytics access

Day 16-19: Reminders
   ├─ Email: "5 days left"
   ├─ Dashboard banner
   └─ Payment prompt

Day 20: Trial ends
   ├─ Downgrade to basic if no payment
   └─ Or activate paid subscription
```

### Active Subscription
```
Subscription Active
   ├─ Monthly/Yearly billing
   ├─ Auto-renewal (if enabled)
   ├─ Feature access based on plan
   └─ Usage monitoring
```

### Cancellation & Grace Period
```
Vendor Cancels
   ↓
Products Hidden (30 days)
   ├─ Not visible in search
   ├─ Not shown on homepage
   └─ Order processing disabled

Vendor Can:
   ├─ View analytics
   ├─ Download data
   └─ Renew subscription

Day 1-29: Grace Period
   └─ Can renew anytime

Day 30: Data Deletion
   ├─ Delete all products
   ├─ Delete vendor profile
   ├─ Delete analytics data
   └─ Deactivate account
```

---

## 🛠️ Development Guide

### Setup Instructions

1. **Install Dependencies**
```bash
npm install
npm install @react-google-maps/api recharts
```

2. **Environment Configuration**
Add to `.env`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyArEpHuzGRzKeUE7pfVNcHzXAAtgRnkP44"
```

3. **Database Setup**
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

4. **Start Development Server**
```bash
npm run dev
```

### Folder Structure
```
src/app/vendor/
├── dashboard/page.tsx         # Main dashboard
├── profile/page.tsx           # Business profile
├── products/
│   ├── page.tsx              # Products list
│   ├── new/page.tsx          # Add product
│   └── [id]/edit/page.tsx    # Edit product
├── offers/
│   ├── page.tsx              # Offers list
│   └── new/page.tsx          # Create offer
├── stories/
│   ├── page.tsx              # Stories management
│   └── new/page.tsx          # Create story
├── ads/
│   ├── page.tsx              # Ad campaigns
│   ├── new/page.tsx          # Create campaign
│   └── [id]/page.tsx         # Campaign details
├── analytics/page.tsx         # Analytics dashboard
├── subscription/page.tsx      # Subscription management
├── support/
│   ├── page.tsx              # Tickets list
│   ├── new/page.tsx          # Create ticket
│   └── [id]/page.tsx         # Ticket conversation
├── settings/page.tsx          # Account settings
└── layout.tsx                 # Shared layout with sidebar
```

### Component Library
```
src/components/vendor/
├── VendorSidebar.tsx          # Navigation sidebar
├── VendorHeader.tsx           # Top header bar
├── ProductForm.tsx            # Product creation/edit form
├── ProductTable.tsx           # Products data table
├── OfferCard.tsx              # Offer display card
├── StoryCreator.tsx           # Story upload component
├── StoryAnalytics.tsx         # Story metrics
├── AdCampaignForm.tsx         # Ad campaign form
├── TicketChat.tsx             # Real-time ticket chat
├── SubscriptionStatus.tsx     # Subscription widget
├── DeleteAccountDialog.tsx    # Account deletion
└── charts/                    # Analytics charts
    ├── SalesChart.tsx
    ├── VisitorChart.tsx
    └── AdPerformanceChart.tsx
```

### Testing

**Manual Testing Checklist**:
- [ ] Vendor login and role-based access
- [ ] Business profile CRUD operations
- [ ] Product management with images
- [ ] Story creation with 24-hour expiry
- [ ] Ad campaign creation with payment
- [ ] Analytics data accuracy
- [ ] Subscription cancellation flow
- [ ] Support ticket with real-time updates
- [ ] Account deletion process

---

## 🚀 Deployment Checklist

- [ ] Set all environment variables in production
- [ ] Enable Google Maps API for production domain
- [ ] Configure Razorpay webhook endpoints
- [ ] Set up Socket.io server for real-time features
- [ ] Configure Supabase Storage CORS
- [ ] Enable Sentry for error tracking
- [ ] Set up Google Analytics
- [ ] Configure email templates
- [ ] Test payment flows
- [ ] Verify subscription auto-renewal
- [ ] Test data deletion after 30 days

---

## 📞 Support

**For Vendors**:
- Email: support@grabtogo.in
- Support Tickets: Available in vendor dashboard
- Documentation: https://docs.grabtogo.in

**For Developers**:
- GitHub: https://github.com/Alex-Invenex/grabtogo
- Issues: https://github.com/Alex-Invenex/grabtogo/issues

---

**Last Updated**: 2025-10-03
**Version**: 1.0.0
**Status**: In Active Development
