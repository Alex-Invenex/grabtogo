# Vercel Deployment Guide for GrabtoGo

## Prerequisites
1. GitHub repository is already set up at: https://github.com/Alex-Invenex/grabtogo
2. Vercel account connected to your GitHub account

## Deployment Steps

### 1. Import Project to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import from GitHub: `Alex-Invenex/grabtogo`
4. Select the repository and click "Import"

### 2. Configure Project Settings
- **Framework Preset**: Next.js
- **Root Directory**: `apps/web` (IMPORTANT: Set this correctly)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Environment Variables
Add these environment variables in Vercel project settings:

#### Required Variables:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_URL=https://web.grabtogo.in
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

#### Optional Variables:
```
GOOGLE_VERIFICATION_ID=your_google_verification_id_here
```

### 4. Custom Domain Setup
1. In Vercel project settings, go to "Domains"
2. Add custom domain: `web.grabtogo.in`
3. Configure DNS records as instructed by Vercel:
   - Add CNAME record: `web` → `cname.vercel-dns.com`
   - Or A record pointing to Vercel's IP addresses

### 5. API Service Deployment
The API service needs to be deployed separately. Recommended platforms:

#### Option A: Railway
1. Go to [Railway](https://railway.app/)
2. Connect GitHub repository
3. Deploy from `services/api` directory
4. Set environment variables from `services/api/.env.example`

#### Option B: Render
1. Go to [Render](https://render.com/)
2. Create new Web Service
3. Connect GitHub repository
4. Set root directory: `services/api`
5. Build command: `npm install && npm run build`
6. Start command: `npm start`

### 6. Database Setup
1. Set up PostgreSQL database (recommended: Railway, Supabase, or Neon)
2. Update `DATABASE_URL` in API service environment variables
3. Run database migrations: `npx prisma migrate deploy`
4. Generate Prisma client: `npx prisma generate`

### 7. Update API URL
Once API is deployed, update the `NEXT_PUBLIC_API_URL` environment variable in Vercel with the actual API URL.

### 8. SSL and Security
- Vercel automatically provides SSL certificates
- Ensure all API calls use HTTPS in production
- Update CORS settings in API service to include your Vercel domain

## Post-Deployment Checklist
- [ ] Web app loads correctly at web.grabtogo.in
- [ ] Authentication works (Clerk integration)
- [ ] API connection is established
- [ ] Payment system is functional (test mode)
- [ ] Google Maps integration works
- [ ] Image uploads work (if using AWS S3)
- [ ] All environment variables are set correctly

## Troubleshooting

### Common Issues:
1. **Build fails**: Check Next.js version compatibility and dependencies
2. **API connection fails**: Verify CORS settings and API URL
3. **Authentication issues**: Check Clerk configuration and environment variables
4. **Payment issues**: Verify Razorpay keys and webhook URLs

### Debug Commands:
```bash
# Check build locally
npm run build

# Verify environment variables
npm run dev

# Test API connection
curl https://your-api-url/health
```

## Monitoring
- Use Vercel Analytics for frontend monitoring
- Set up error tracking (Sentry recommended)
- Monitor API performance and logs

## Scaling Considerations
- Enable Vercel Pro for better performance
- Use CDN for static assets
- Implement Redis caching for API
- Set up database read replicas for high traffic