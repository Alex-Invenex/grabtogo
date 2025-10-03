# GrabtoGo - Multi-Vendor Marketplace

A production-grade multi-vendor marketplace built with Next.js 14, Supabase (PostgreSQL + Storage), Redis, and Razorpay integration.

## ✅ **Current Status: OPERATIONAL (Verified 2025-10-02)**

- ✅ **Vendor Registration Flow** - Fully functional
- ✅ **Admin Dashboard** - Operational with real-time data
- ✅ **Supabase Database** - Connected and stable
- ✅ **Supabase Storage** - File uploads working
- ✅ **Payment Integration** - Razorpay operational
- ✅ **Production Ready** - All core features verified

## 🚀 Features

- **Multi-Vendor Support**: Complete vendor onboarding and management system
- **Product Management**: Product listings, categories, variants, and inventory tracking
- **Secure Payments**: Razorpay integration for secure payment processing
- **Real-time Features**: Redis caching and session management
- **Location Services**: PostGIS support for location-based features
- **Authentication**: NextAuth.js v5 with multiple providers
- **Mobile-Ready**: React Native app foundation included
- **Admin Dashboard**: Complete admin panel for marketplace management

## 🛠️ Tech Stack

### Backend

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **NextAuth.js v5** for authentication
- **Redis** for caching and sessions
- **Razorpay** for payment processing

### Frontend

- **React 18** with Server Components
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Lucide React** icons
- **React Hook Form** with Zod validation

### Database & Storage

- **Supabase PostgreSQL** with PostGIS extension
- **Supabase Storage** for file uploads and documents
- **Redis** for caching and sessions

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   └── (pages)/        # App pages
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── layout/        # Layout components
├── lib/               # Utility libraries
│   ├── auth.ts        # NextAuth configuration
│   ├── db.ts          # Prisma client
│   ├── redis.ts       # Redis client
│   └── razorpay.ts    # Payment processing
├── types/             # TypeScript type definitions
└── prisma/            # Database schema and client
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (for database and storage)
- Redis server (optional for caching)
- Razorpay account (for payments)

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

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables in `.env`

4. **Set up Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Enable PostGIS extension in SQL Editor: `CREATE EXTENSION IF NOT EXISTS postgis;`
   - Create storage buckets: `vendor-documents`, `vendor-logos`, `vendor-photos`, `product-images`
   - Update `.env` with Supabase credentials

5. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations via Supabase SQL Editor or:
   npx prisma migrate dev --name init

   # Create admin user
   npm run create-admin
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Admin Access

After setup, access the admin dashboard:

- URL: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- Email: `info@grabtogo.in`
- Password: `admin`

The admin dashboard provides complete control over vendor management, approvals, and platform operations.

## 📊 Database Schema

The application includes comprehensive models for:

- **Users**: Customer, vendor, and admin roles
- **Products**: Full product management with variants and images
- **Orders**: Complete order processing and tracking
- **Payments**: Razorpay integration with payment tracking
- **Reviews**: Product review and rating system
- **Addresses**: Multiple address support with geolocation

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Products

- `GET /api/products` - List products with filtering
- `GET /api/products/[id]` - Get product details
- `POST /api/products` - Create product (vendor only)

### Vendors

- `GET /api/vendors` - List vendors
- `GET /api/vendors/[id]` - Get vendor details
- `POST /api/vendors` - Vendor registration

### Payments

- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment

## 🔐 Authentication

The app uses NextAuth.js v5 with support for:

- Email/Password authentication
- Google OAuth
- JWT sessions with role-based access control

## 💳 Payment Integration

Razorpay integration supports:

- Order creation and payment processing
- Payment verification and capture
- Refund processing
- Webhook handling

## 🗄️ Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

## 🚀 Deployment

### Vercel + Supabase Deployment (Recommended)

1. **Supabase Setup**
   - Database already hosted on Supabase
   - Storage buckets configured
   - PostGIS extension enabled

2. **Deploy to Vercel**
   - Connect GitHub repository to Vercel
   - Set environment variables (see `.env.example`)
   - Deploy automatically on push

### Environment Variables for Production

Required environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_supabase_connection_string

# NextAuth
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=your_production_url

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

See `.env.example` for complete list.

## 📱 Mobile App

The project includes a foundation for a React Native mobile app. The mobile app will connect to the same backend API.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, please create an issue in the GitHub repository or contact the development team.

## 🔮 Roadmap

### Completed ✅
- [x] Vendor registration flow with payment gateway
- [x] Admin dashboard with vendor management
- [x] Supabase database and storage integration
- [x] File upload system with progress tracking
- [x] Document viewer with signed URLs
- [x] Real-time vendor approval workflow

### In Progress 🚧
- [ ] Real-time notifications with WebSockets
- [ ] Advanced analytics dashboard
- [ ] Product catalog management

### Planned 📅
- [ ] Advanced search with full-text indexing
- [ ] Multi-language support
- [ ] Advanced vendor commission system
- [ ] Integration with shipping providers
- [ ] Mobile app development
- [ ] PWA enhancements

---

**Project Repository**: [github.com/Alex-Invenex/grabtogo](https://github.com/Alex-Invenex/grabtogo)
**Status**: ✅ Operational (Verified 2025-10-02)
**Built with**: Next.js 14, Supabase, TypeScript, and modern web technologies
