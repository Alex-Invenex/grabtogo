# Supabase Migration Guide for GrabtoGo

## Overview

This guide will help you migrate your GrabtoGo application from local PostgreSQL to Supabase.

**Status:** ✅ Migration Complete and Working | ✅ Database Connection Verified

## What's Been Done

✅ Updated `.env` with Supabase credentials
✅ Added Supabase image domains to `next.config.js`
✅ Installed `@supabase/supabase-js` package
✅ Created Supabase client utility at `src/lib/supabase.ts`
✅ Updated Prisma schema with `directUrl` configuration
✅ **Database migration completed successfully**
✅ **Vendor registration flow to admin dashboard verified working**
✅ **Supabase Storage integration operational**

## ✅ Verification Confirmed (2025-10-02)

The following systems have been tested and verified working:
- ✅ Database connection established successfully
- ✅ Vendor registration flow complete
- ✅ Admin dashboard integration working
- ✅ File uploads to Supabase Storage functioning
- ✅ Document viewing and signed URLs operational
- ✅ All database operations working as expected

## Database Migration (Run in Supabase SQL Editor)

Due to IPv6 connectivity requirements, you need to run the database migration directly in Supabase:

### Step 1: Enable PostGIS Extension

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Run this SQL:

```sql
-- Enable PostGIS extension for geospatial features
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Step 2: Run Database Migration

Copy and paste the contents of `prisma/migrations/0_init/migration.sql` into the SQL Editor and execute it.

**OR** use Prisma Migrate from a machine with IPv6:

```bash
npm run db:migrate
```

### Step 3: Verify Migration

Run this query to verify all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see 30+ tables including:
- users
- vendor_profiles
- products
- orders
- payments
- etc.

### Step 4: Create Admin User

After migration, create an admin user:

```bash
npm run create-admin
```

**Or** manually via SQL Editor:

```sql
INSERT INTO users (id, email, name, password, role, "emailVerified", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'info@grabtogo.in',
  'Admin',
  -- You'll need to hash the password using bcrypt (10 rounds)
  '$2a$10$hashedpasswordhere',
  'ADMIN',
  NOW(),
  true,
  NOW(),
  NOW()
);
```

## Supabase Storage Setup

### Create Storage Buckets

1. Go to **Supabase Dashboard** → **Storage**
2. Create these buckets with the following settings:

#### Bucket: `product-images`
- **Public:** ✅ Yes
- **File size limit:** 5MB
- **Allowed MIME types:** image/jpeg, image/png, image/webp, image/avif

#### Bucket: `vendor-logos`
- **Public:** ✅ Yes
- **File size limit:** 2MB
- **Allowed MIME types:** image/jpeg, image/png, image/svg+xml, image/webp

#### Bucket: `vendor-banners`
- **Public:** ✅ Yes
- **File size limit:** 5MB
- **Allowed MIME types:** image/jpeg, image/png, image/webp

#### Bucket: `gst-documents`
- **Public:** ❌ No (Private)
- **File size limit:** 10MB
- **Allowed MIME types:** application/pdf, image/jpeg, image/png

#### Bucket: `review-images`
- **Public:** ✅ Yes
- **File size limit:** 3MB
- **Allowed MIME types:** image/jpeg, image/png, image/webp

### Configure Storage Policies (Optional - Row Level Security)

For better security, you can set up RLS policies for each bucket:

#### Product Images Policy (Public Read, Authenticated Upload)

```sql
-- Allow public to read product images
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid() = owner);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid() = owner);
```

Repeat similar policies for other public buckets (`vendor-logos`, `vendor-banners`, `review-images`).

#### GST Documents Policy (Private - Owner Only)

```sql
-- Only allow owners to access their GST documents
CREATE POLICY "Users can only access their own GST documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'gst-documents' AND auth.uid() = owner);

CREATE POLICY "Users can upload their own GST documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gst-documents');

CREATE POLICY "Users can update their own GST documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gst-documents' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own GST documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gst-documents' AND auth.uid() = owner);
```

## Testing the Migration

### 1. Test Database Connection

```bash
npm run db:studio
```

This opens Prisma Studio to browse your Supabase database.

### 2. Test Application

```bash
npm run dev
```

Navigate to `http://localhost:3000` and verify:
- ✅ Homepage loads
- ✅ User registration works
- ✅ Login works
- ✅ Admin panel accessible at `/admin/login`

### 3. Test File Uploads

Create a test product or register as a vendor to test Supabase Storage integration.

## Connection String Formats

Your `.env` is configured with:

```env
# Session mode for migrations (via pooler with IPv4)
DATABASE_URL="postgresql://postgres.yyffdrkfimxxieoonksw:Invenex%402025@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?schema=public&sslmode=require"

DIRECT_URL="postgresql://postgres.yyffdrkfimxxieoonksw:Invenex%402025@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

**Note:** If you enable IPv6 on your machine, you can use the direct connection:

```env
DATABASE_URL="postgresql://postgres:Invenex%402025@db.yyffdrkfimxxieoonksw.supabase.co:5432/postgres?schema=public&sslmode=require"
```

## Troubleshooting

### IPv6 Connectivity Issues

**Problem:** Can't connect to database from local machine
**Solution:** Run migrations via Supabase SQL Editor or deploy from cloud environment

### Connection Pooler Issues

**Problem:** "Tenant or user not found" error
**Solution:** Verify you're using the correct pooler URL format from Supabase dashboard

### PostGIS Extension

**Problem:** Migrations fail with PostGIS errors
**Solution:** Ensure PostGIS extension is enabled first (see Step 1)

### File Upload Errors

**Problem:** 403 errors when uploading files
**Solution:** Verify storage buckets are created and policies are configured

## Next Steps

1. ✅ ~~Complete database migration via Supabase SQL Editor~~ **DONE**
2. ✅ ~~Create storage buckets in Supabase dashboard~~ **DONE**
3. ✅ ~~Test the application thoroughly~~ **VERIFIED WORKING**
4. 🚀 Ready for deployment to Vercel/production with environment variables

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [PostGIS Documentation](https://postgis.net/documentation/)

## Rollback Plan

If you need to rollback to local PostgreSQL:

1. Revert `.env` to use local connection string
2. Restart local PostgreSQL
3. No code changes needed (configuration-only migration)

---

**Migration Status:** ✅ Complete and Operational
**Verification Date:** 2025-10-02
**Current Status:** All systems working - Registration flow, Admin dashboard, and Supabase integration verified
