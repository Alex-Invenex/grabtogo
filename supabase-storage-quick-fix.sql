-- ============================================================================
-- Supabase Storage Quick Fix for GrabtoGo
-- ============================================================================
-- This is a SIMPLIFIED version that allows uploads to work immediately
-- WITHOUT complex RLS policies by using the service role key approach.
--
-- Since we're using SUPABASE_SERVICE_ROLE_KEY in the API routes,
-- it bypasses RLS policies automatically.
--
-- IMPORTANT: Run this script in your Supabase SQL Editor
-- Navigate to: Supabase Dashboard → SQL Editor → New Query
-- ============================================================================

-- ============================================================================
-- OPTION 1: Enable Public Access (Recommended for Quick Fix)
-- ============================================================================
-- This makes the buckets publicly accessible for reading
-- Uploads still require authentication via service role key

-- Make vendor-logos bucket public for reading
UPDATE storage.buckets
SET public = true
WHERE id = 'vendor-logos';

-- Make vendor-photos bucket public for reading
UPDATE storage.buckets
SET public = true
WHERE id = 'vendor-photos';

-- Make product-images bucket public for reading
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';

-- Keep vendor-documents private (for sensitive documents)
UPDATE storage.buckets
SET public = false
WHERE id = 'vendor-documents';

-- ============================================================================
-- OPTION 2: Simple RLS Policies (If Option 1 doesn't work)
-- ============================================================================
-- These are minimal policies that allow service role uploads
-- Run these ONLY if Option 1 doesn't work

-- Allow service role to do everything (service role bypasses RLS anyway)
CREATE POLICY IF NOT EXISTS "Service role full access to vendor-documents"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'vendor-documents');

CREATE POLICY IF NOT EXISTS "Service role full access to vendor-logos"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'vendor-logos');

CREATE POLICY IF NOT EXISTS "Service role full access to vendor-photos"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'vendor-photos');

CREATE POLICY IF NOT EXISTS "Service role full access to product-images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'product-images');

-- Allow public SELECT for public buckets
CREATE POLICY IF NOT EXISTS "Public read vendor-logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-logos');

CREATE POLICY IF NOT EXISTS "Public read vendor-photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-photos');

CREATE POLICY IF NOT EXISTS "Public read product-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check bucket public status
SELECT id, name, public
FROM storage.buckets
WHERE id IN ('vendor-documents', 'vendor-logos', 'vendor-photos', 'product-images');

-- Expected results:
-- vendor-documents: public = false
-- vendor-logos: public = true
-- vendor-photos: public = true
-- product-images: public = true

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. The service role key (SUPABASE_SERVICE_ROLE_KEY) in your .env file
--    automatically bypasses ALL RLS policies
-- 2. Setting buckets to public = true only affects read access
-- 3. Uploads are controlled by the service role key in your API routes
-- 4. This is the QUICKEST way to get uploads working
-- 5. For production, consider implementing the full RLS policies from
--    supabase-storage-policies.sql for better security
-- ============================================================================
