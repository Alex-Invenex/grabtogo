# Supabase Storage Setup Guide

This guide provides step-by-step instructions for setting up Supabase Storage for the GrabtoGo vendor registration system.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Create Storage Buckets](#create-storage-buckets)
3. [Configure Bucket Policies](#configure-bucket-policies)
4. [Environment Variables](#environment-variables)
5. [Testing the Integration](#testing-the-integration)
6. [Features Overview](#features-overview)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- A Supabase project created at [supabase.com](https://supabase.com)
- Project URL: `https://yyffdrkfimxxieoonksw.supabase.co`
- Anon (public) API key
- Service role (private) API key
- Admin access to your Supabase dashboard

---

## Create Storage Buckets

You need to create **4 storage buckets** in your Supabase project:

### 1. Login to Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `grabtogo` (or your project name)

### 2. Navigate to Storage
1. Click on **Storage** in the left sidebar
2. Click **Create a new bucket**

### 3. Create the Following Buckets

#### Bucket 1: `vendor-documents` (Private)
- **Name**: `vendor-documents`
- **Public**: **NO** (Keep this bucket private)
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`
- **Purpose**: Store sensitive vendor documents (GST certificates, PAN cards, business registrations, bank proofs)

#### Bucket 2: `vendor-logos` (Public)
- **Name**: `vendor-logos`
- **Public**: **YES** (Make this bucket public)
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/png`, `image/jpeg`, `image/jpg`, `image/svg+xml`
- **Purpose**: Store vendor business logos

#### Bucket 3: `vendor-photos` (Public)
- **Name**: `vendor-photos`
- **Public**: **YES** (Make this bucket public)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- **Purpose**: Store vendor store banners and shop images

#### Bucket 4: `product-images` (Public)
- **Name**: `product-images`
- **Public**: **YES** (Make this bucket public)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- **Purpose**: Store product images

---

## Configure Bucket Policies

For private buckets, you need to set up Row Level Security (RLS) policies.

### For `vendor-documents` Bucket:

1. Go to **Storage** → **Policies** tab
2. Click **New Policy** for the `vendor-documents` bucket

#### Policy 1: Allow Authenticated Uploads
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vendor-documents');
```

#### Policy 2: Allow Admin Read Access
```sql
CREATE POLICY "Allow admin read access"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-documents'
  AND auth.jwt() ->> 'role' = 'ADMIN'
);
```

#### Policy 3: Allow Owner Read Access
```sql
CREATE POLICY "Allow owner read access"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Environment Variables

Add the following to your `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yyffdrkfimxxieoonksw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Connection (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.yyffdrkfimxxieoonksw:Invenex%402025@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?schema=public&sslmode=require"
```

**Important Notes:**
- Replace `your_anon_key_here` with your actual Supabase anon key
- Replace `your_service_role_key_here` with your actual Supabase service role key
- The password `Invenex@2025` is URL-encoded as `Invenex%402025` in the DATABASE_URL
- Never commit your `.env` file to version control

---

## Testing the Integration

### 1. Test Vendor Registration Upload

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the vendor registration page:
   ```
   http://localhost:3000/auth/register/vendor
   ```

3. Fill out the registration form and test file uploads:
   - **Documents Step**: Upload GST certificate, PAN card, business registration, bank proof
   - **Logo & Branding Step**: Upload business logo and store banner
   - **GST Document Step**: Upload GST certificate (duplicate field for testing)

4. Verify uploads in Supabase:
   - Go to **Storage** → Select the appropriate bucket
   - Check that files are uploaded with the correct path structure:
     ```
     vendor-documents/{vendorId}/{documentType}/{fileName}
     vendor-logos/{vendorId}/logo/{fileName}
     vendor-photos/{vendorId}/photos/{fileName}
     ```

### 2. Test Admin Dashboard

1. Login as admin:
   - Email: `info@grabtogo.in`
   - Password: `admin`

2. Navigate to pending vendor approvals:
   ```
   http://localhost:3000/admin/vendors/pending
   ```

3. Click **View Details** on any pending vendor

4. Verify document viewing:
   - Private documents (GST, PAN, etc.) should use signed URLs (1-hour expiry)
   - Images (logo, banner) should show thumbnails with transformation parameters
   - Click on any document to open the DocumentViewer modal
   - Test zoom, rotate, and download features

---

## Features Overview

### 1. File Upload with Progress Tracking
- **Real-time progress bar** showing upload percentage (0-100%)
- **Bytes uploaded display**: Shows `uploadedBytes / totalBytes`
- **Error handling**: Displays clear error messages for file size or type violations
- **File validation**:
  - Documents: 10MB max (PDF, JPG, PNG)
  - Logos: 2MB max (PNG, JPG, SVG)
  - Photos/Banners: 5MB max (JPG, PNG, WEBP)

### 2. Supabase Storage Integration
- **Public buckets** for logos and photos (direct access via URL)
- **Private buckets** for documents with Row Level Security (RLS)
- **Signed URLs** for secure, time-limited access (1-hour expiry)
- **Image transformations** for thumbnails:
  ```
  ?width=200&height=200&quality=80
  ```

### 3. Admin Dashboard Features
- **Signed URL generation** for viewing private documents
- **Thumbnail previews** for all images (200x200 for logos, 200x100 for banners)
- **DocumentViewer component** with:
  - PDF viewer with iframe
  - Image viewer with zoom (50%-200%)
  - Image rotation (90° increments)
  - Download functionality
  - Full-screen modal view

### 4. Security Features
- **Admin-only access** to signed URL generation API
- **Authentication checks** on all upload endpoints
- **File type validation** on server-side
- **Size limits** enforced on both client and server
- **RLS policies** for private document access

---

## Troubleshooting

### Issue: "Failed to upload file"

**Possible causes:**
1. Bucket doesn't exist in Supabase
2. File exceeds size limit
3. Invalid MIME type
4. Network connectivity issues

**Solution:**
- Check Supabase dashboard to verify buckets exist
- Ensure file meets size and type requirements
- Check browser console for detailed error messages
- Verify environment variables are set correctly

### Issue: "Signed URL generation failed"

**Possible causes:**
1. `SUPABASE_SERVICE_ROLE_KEY` not set or incorrect
2. User is not authenticated as admin
3. Invalid Supabase URL format

**Solution:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Check that user has `ADMIN` role in database
- Ensure URL format is correct: `https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}`

### Issue: "Images not loading in admin dashboard"

**Possible causes:**
1. Public buckets not set to public
2. CORS issues
3. Invalid image URLs

**Solution:**
- Go to Storage → Bucket Settings → Make bucket public
- Check `next.config.js` has Supabase domain in `images.remotePatterns`
- Verify URLs in browser dev tools

### Issue: "Cannot connect to Supabase database"

**Possible causes:**
1. IPv6 connectivity required but not available
2. Incorrect connection string
3. Firewall blocking connection

**Solution:**
- Use connection pooler: `aws-0-ap-south-1.pooler.supabase.com:5432`
- Ensure password is URL-encoded in DATABASE_URL
- For manual migration, use Supabase SQL Editor (see `SUPABASE_MIGRATION_GUIDE.md`)

---

## API Endpoints

### Upload Endpoint: `/api/vendor/upload`
**Method**: POST
**Content-Type**: multipart/form-data
**Body**:
```typescript
{
  file: File,
  fileType: 'document' | 'image' | 'logo',
  vendorId: string,
  documentType?: string // Required for documents
}
```
**Response**:
```typescript
{
  success: true,
  url: string, // Supabase public URL
  path: string // Storage path
}
```

### Signed URL Endpoint: `/api/vendor/signed-url`
**Method**: POST
**Headers**: `Content-Type: application/json`
**Auth**: Admin role required
**Body**:
```typescript
{
  url: string, // Supabase file URL
  expiresIn?: number // Seconds (default: 3600 = 1 hour)
}
```
**Response**:
```typescript
{
  success: true,
  url: string // Signed URL with expiry
}
```

---

## Storage Path Structure

### Documents (Private)
```
vendor-documents/
  └── {vendorId}/
      ├── gst/
      │   └── {uniqueId}.pdf
      ├── pan/
      │   └── {uniqueId}.jpg
      ├── business_reg/
      │   └── {uniqueId}.pdf
      └── bank_proof/
          └── {uniqueId}.pdf
```

### Logos (Public)
```
vendor-logos/
  └── {vendorId}/
      └── logo/
          └── {uniqueId}.png
```

### Photos/Banners (Public)
```
vendor-photos/
  └── {vendorId}/
      └── photos/
          └── {uniqueId}.jpg
```

---

## Next Steps

After completing this setup:

1. **Test all upload flows** in vendor registration
2. **Verify admin dashboard** document viewing
3. **Configure RLS policies** for production security
4. **Set up monitoring** for storage usage and costs
5. **Implement cleanup jobs** for orphaned files (vendors who don't complete registration)
6. **Add analytics** for upload success/failure rates

---

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Image Transformations](https://supabase.com/docs/guides/storage/image-transformations)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)

---

## Support

For issues or questions:
- GitHub: [https://github.com/Alex-Invenex/grabtogo](https://github.com/Alex-Invenex/grabtogo)
- Supabase Support: [https://supabase.com/support](https://supabase.com/support)

---

**Last Updated**: 2025-10-02
**Version**: 1.0.0
