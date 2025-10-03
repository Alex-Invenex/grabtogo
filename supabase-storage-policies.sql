-- ============================================================================
-- Supabase Storage RLS Policies for GrabtoGo
-- ============================================================================
-- This script creates all necessary Row Level Security (RLS) policies for
-- the Supabase Storage buckets used in the vendor registration system.
--
-- IMPORTANT: Run this script in your Supabase SQL Editor
-- Navigate to: Supabase Dashboard → SQL Editor → New Query
-- ============================================================================

-- ============================================================================
-- VENDOR DOCUMENTS BUCKET (Private)
-- ============================================================================
-- This bucket stores sensitive vendor documents (GST, PAN, Business Reg, Bank Proof)
-- Access control: Authenticated users can upload, Admins and owners can read

-- Policy 1: Allow authenticated users to upload documents
CREATE POLICY "Allow authenticated uploads to vendor-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-documents'
);

-- Policy 2: Allow users to read their own documents
CREATE POLICY "Allow users to read own documents in vendor-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow admins to read all documents
-- Note: This assumes you have a function to check admin role
-- If you don't have this function, you'll need to create it first
CREATE POLICY "Allow admins to read all documents in vendor-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-documents'
  -- This checks if the user has admin role in your users table
  -- Adjust the table/column names if different in your schema
  AND EXISTS (
    SELECT 1 FROM public."User"
    WHERE id = auth.uid()::text
    AND role = 'ADMIN'
  )
);

-- Policy 4: Allow users to update their own documents
CREATE POLICY "Allow users to update own documents in vendor-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Allow users to delete their own documents
CREATE POLICY "Allow users to delete own documents in vendor-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- VENDOR LOGOS BUCKET (Public)
-- ============================================================================
-- This bucket stores vendor business logos
-- Access control: Public read, authenticated write

-- Policy 1: Allow public read access
CREATE POLICY "Allow public read access to vendor-logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-logos');

-- Policy 2: Allow authenticated users to upload logos
CREATE POLICY "Allow authenticated uploads to vendor-logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vendor-logos');

-- Policy 3: Allow users to update their own logos
CREATE POLICY "Allow users to update own logos in vendor-logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own logos
CREATE POLICY "Allow users to delete own logos in vendor-logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- VENDOR PHOTOS BUCKET (Public)
-- ============================================================================
-- This bucket stores vendor store banners and shop images
-- Access control: Public read, authenticated write

-- Policy 1: Allow public read access
CREATE POLICY "Allow public read access to vendor-photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-photos');

-- Policy 2: Allow authenticated users to upload photos
CREATE POLICY "Allow authenticated uploads to vendor-photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vendor-photos');

-- Policy 3: Allow users to update their own photos
CREATE POLICY "Allow users to update own photos in vendor-photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own photos
CREATE POLICY "Allow users to delete own photos in vendor-photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- PRODUCT IMAGES BUCKET (Public)
-- ============================================================================
-- This bucket stores product images
-- Access control: Public read, authenticated write

-- Policy 1: Allow public read access
CREATE POLICY "Allow public read access to product-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy 2: Allow authenticated users to upload product images
CREATE POLICY "Allow authenticated uploads to product-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Policy 3: Allow users to update their own product images
CREATE POLICY "Allow users to update own images in product-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own product images
CREATE POLICY "Allow users to delete own images in product-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the policies were created successfully

-- Check all storage policies
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check policies for specific bucket
-- SELECT * FROM pg_policies
-- WHERE tablename = 'objects'
-- AND schemaname = 'storage'
-- AND policyname LIKE '%vendor-documents%';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. These policies assume you're using NextAuth.js with Supabase
-- 2. The auth.uid() function returns the authenticated user's ID
-- 3. The ADMIN role check assumes you have a "User" table with a "role" column
-- 4. If you're using the service role key in your API routes, these policies
--    are automatically bypassed
-- 5. For public buckets, make sure to also mark them as "Public" in the
--    Supabase Dashboard: Storage → Bucket Settings → Public bucket
--
-- ============================================================================
-- IMPORTANT: ALTERNATIVE APPROACH
-- ============================================================================
-- If you're having issues with RLS policies, you can use the SERVICE ROLE KEY
-- in your API routes (which we're already doing). The service role key bypasses
-- all RLS policies, so uploads will work even without these policies.
--
-- However, these policies are still recommended for production security to:
-- 1. Prevent unauthorized access to private documents
-- 2. Ensure users can only modify their own files
-- 3. Control read access to sensitive documents
-- ============================================================================
