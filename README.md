# GrabtoGo - Local Marketplace Platform

A comprehensive marketplace platform connecting local vendors with customers, built with modern web technologies and deployed on cloud infrastructure.

## 🌟 Live Demo

- **Website**: [web.grabtogo.in](https://web.grabtogo.in)
- **Admin Dashboard**: Coming soon
- **Mobile App**: Coming soon

## 🏗️ Project Architecture

GrabtoGo is a **monorepo** built with **Turborepo** that contains multiple applications and services:

```
grabtogo/
├── apps/
│   ├── web/          # Next.js 15 web application
│   ├── mobile/       # React Native mobile app with Expo
│   └── admin/        # Admin dashboard (Next.js)
├── services/
│   ├── api/          # Express.js backend API with Prisma
│   └── notification-service/  # Notification service
├── packages/
│   ├── api-client/   # Shared API client package
│   ├── shared/       # Shared utilities and types
│   └── ui/           # Shared UI components
```

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Authentication**: Clerk
- **Maps**: Google Maps API

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Payments**: Razorpay
- **File Upload**: AWS S3
- **Cache**: Redis
- **Real-time**: Socket.io
- **Notifications**: Firebase Admin

### Mobile
- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **Maps**: React Native Maps

### DevOps & Deployment
- **Monorepo**: Turborepo
- **Frontend Hosting**: Vercel
- **API Hosting**: Railway
- **Database**: Railway PostgreSQL
- **CI/CD**: GitHub Actions
- **Domain**: web.grabtogo.in

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL
- Redis (optional for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Alex-Invenex/grabtogo.git
   cd grabtogo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**

   Copy the example environment files:
   ```bash
   # Web app environment
   cp apps/web/.env.example apps/web/.env.local

   # API service environment
   cp services/api/.env.example services/api/.env
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   cd services/api
   npm run db:generate

   # Run migrations
   npm run db:migrate

   # Seed database (optional)
   npm run db:seed
   ```

5. **Start Development Servers**
   ```bash
   # Start all services
   npm run dev
   ```

   This will start:
   - Web app: http://localhost:3000
   - API service: http://localhost:3001
   - Admin dashboard: http://localhost:3002

## 📝 Available Scripts

### Root Level Commands
```bash
npm run dev          # Start all apps in development
npm run build        # Build all apps for production
npm run lint         # Run linting across all packages
npm run type-check   # Run TypeScript type checking
npm run test         # Run tests across all packages
npm run clean        # Clean build artifacts
```

### Individual Service Commands

#### Web Application
```bash
cd apps/web
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
```

#### API Service
```bash
cd services/api
npm run dev          # Start API dev server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start:prod   # Start production server
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

## 🔐 Environment Variables

### Web Application (.env.local)
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# API Configuration
NEXT_PUBLIC_API_URL=https://api.grabtogo.in
NEXT_PUBLIC_APP_URL=https://web.grabtogo.in

# Razorpay Payment Gateway
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

### API Service (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database

# Server
PORT=3001
NODE_ENV=production

# Authentication
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Payment Gateway
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# External Services
REDIS_URL=redis://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...

# CORS Configuration
CORS_ORIGIN=https://web.grabtogo.in
WEB_APP_URL=https://web.grabtogo.in
```

## 🌟 Key Features

### For Customers
- 📍 Location-based vendor discovery
- 🔍 Advanced search and filtering
- 💳 Secure payment processing with Razorpay
- ⭐ Rating and review system
- 📱 Real-time order tracking
- 💬 Direct messaging with vendors

### For Vendors
- 🏪 Vendor registration and profile management
- 📦 Product catalog management
- 📊 Subscription plans (Basic, Standard, Premium)
- 🎯 Targeted offers and promotions
- 📈 Sales analytics and reporting
- 📱 Story feature for customer engagement

### For Admins
- 🎛️ Comprehensive admin dashboard
- 👥 User and vendor management
- 💰 Payment and subscription tracking
- 📊 Platform analytics
- 🔧 System configuration

## 🚀 Deployment

### Vercel Deployment (Web App)

1. **Connect Repository**
   - Connect your GitHub repository to Vercel
   - Set root directory to `apps/web`

2. **Build Configuration**
   ```bash
   # Build Command
   cd ../.. && npm run build --filter=web

   # Output Directory
   apps/web/.next
   ```

3. **Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Configure custom domain: web.grabtogo.in

### Railway Deployment (API)

1. **Deploy API Service**
   - Deploy `services/api` directory to Railway
   - Add PostgreSQL and Redis addons

2. **Environment Configuration**
   - Set all required environment variables
   - Configure custom domain: api.grabtogo.in

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@grabtogo.in
- 🐛 Issues: [GitHub Issues](https://github.com/Alex-Invenex/grabtogo/issues)
- 📖 Documentation: [docs.grabtogo.in](https://docs.grabtogo.in)

## 👥 Team

Developed by the GrabtoGo Team with ❤️ for local communities.

---

**Note**: This is a production-ready marketplace platform. Ensure all environment variables are properly configured before deployment.