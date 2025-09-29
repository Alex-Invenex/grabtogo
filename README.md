# GrabtoGo - Multi-Vendor Marketplace

A production-grade multi-vendor marketplace built with Next.js 14, PostgreSQL, Redis, and Razorpay integration.

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

### Database
- **PostgreSQL** with PostGIS extension
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
- PostgreSQL database
- Redis server
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

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev --name init

   # Seed the database (optional)
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

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

### Railway Deployment

1. **Connect your repository to Railway**
2. **Set environment variables**
3. **Deploy database and Redis**
4. **Deploy the application**

### Environment Variables for Production

Make sure to set all required environment variables from `.env.example` in your production environment.

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

- [ ] Advanced search with Elasticsearch
- [ ] Real-time notifications with WebSockets
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Advanced vendor commission system
- [ ] Integration with shipping providers
- [ ] Mobile app development

---

Built with ❤️ using Next.js 14, PostgreSQL, and modern web technologies.