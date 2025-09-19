# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GrabtoGo is a monorepo-based marketplace platform consisting of:
- **Web application** (Next.js 15 with TypeScript)
- **Mobile application** (React Native with Expo)
- **API service** (Express.js with TypeScript, Prisma ORM)
- **Admin dashboard** (in development)
- **Notification service** (in development)

The project uses Turborepo for monorepo management and workspace orchestration.

## Project Structure

```
grabtogo/
├── apps/
│   ├── web/          # Next.js web application
│   ├── mobile/       # React Native mobile app with Expo
│   └── admin/        # Admin dashboard (in development)
├── services/
│   ├── api/          # Express.js backend API with Prisma
│   └── notification-service/  # Notification service
├── packages/
│   ├── api-client/   # Shared API client package
│   ├── shared/       # Shared utilities and types
│   └── ui/           # Shared UI components
```

## Common Development Commands

### Root Level Commands
```bash
# Install dependencies
npm install

# Run all apps in development mode
npm run dev

# Build all apps
npm run build

# Run linting across all packages
npm run lint

# Run type checking
npm run type-check

# Run tests
npm run test

# Clean build artifacts
npm run clean
```

### API Service Commands (from grabtogo/services/api/)
```bash
# Start API development server with hot reload
npm run dev

# Build API
npm run build

# Start production server
npm run start:prod

# Database commands
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema changes to database
npm run db:migrate    # Run migrations
npm run db:studio     # Open Prisma Studio for database management

# Run API tests
npm run test
```

### Web Application Commands (from grabtogo/apps/web/)
```bash
# Start Next.js development server with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm run start
```

### Mobile Application Commands (from grabtogo/apps/mobile/)
```bash
# Start Expo development server
npm run start

# Start Android emulator
npm run android

# Start iOS simulator
npm run ios
```

## High-Level Architecture

### Authentication
- Uses Clerk for authentication across web and API
- User model in Prisma schema includes `clerkId` for integration
- Role-based access control with CUSTOMER, VENDOR, and ADMIN roles

### Database
- PostgreSQL database using Prisma ORM
- Key entities: User, Vendor, Product, Order, Offer, Subscription
- Support for real-time features through WebSocket connections

### API Architecture
- RESTful API built with Express.js
- Middleware stack includes: helmet, cors, express-rate-limit, morgan
- File upload handling with multer and sharp for image processing
- Redis for caching and session management
- Socket.io for real-time features
- AWS SDK integration for cloud services
- Razorpay for payment processing
- Firebase Admin for push notifications

### Frontend Stack
- **Web**: Next.js 15 with TypeScript, Tailwind CSS, Radix UI components, React Query, Zustand for state management
- **Mobile**: React Native with Expo, React Navigation, React Native Maps, React Query, Zustand
- Google Maps integration across platforms
- Socket.io client for real-time updates

### Key Features
- Vendor marketplace with subscription plans (BASIC, STANDARD, PREMIUM)
- Product catalog with categories and search
- Order management system with status tracking
- Offer and promotion system
- Real-time messaging between customers and vendors
- Story feature (like Instagram stories) for vendors
- Geolocation services for local vendor discovery
- Review and rating system

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: Direct database connection for migrations
- Clerk authentication keys
- AWS credentials (if using AWS services)
- Razorpay API keys
- Firebase service account credentials
- Redis connection details

## Testing Strategy
- Jest for unit and integration testing
- Test files should be colocated with source files
- Run `npm run test` at root to test all packages

## Important Notes
- The project uses npm workspaces - always run `npm install` from the root directory
- Turborepo caches build outputs - use `npm run clean` if you encounter stale build issues
- When adding new environment variables, update both local `.env` files and deployment configurations
- Prisma client needs regeneration after schema changes: run `npm run db:generate` in the API service directory