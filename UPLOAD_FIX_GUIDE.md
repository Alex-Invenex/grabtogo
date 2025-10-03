# Upload Fix Guide - Supabase Storage Setup

## 🔧 Quick Fix for "Files Cannot Be Uploaded" Issue

This guide will help you fix the upload issue by properly configuring Supabase Storage buckets and permissions.

---

## 🎯 Step 1: Run Diagnostic Test

First, let's identify the exact issue by running the diagnostic endpoint:

```bash
# With development server running (npm run dev)
curl http://localhost:3000/api/vendor/upload/test

# Or visit in browser:
# http://localhost:3000/api/vendor/upload/test
```

This will show you:
- ✅ Which environment variables are set
- ✅ Which buckets exist
- ✅ Which buckets are accessible
- ❌ What's missing or misconfigured

---

## 🚀 Step 2: Quick Fix (Recommended)

### Option A: Run SQL Script (Fastest)

1. **Open Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Select your project: `grabtogo`

2. **Navigate to SQL Editor**:
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run the Quick Fix Script**:
   - Copy the contents of `supabase-storage-quick-fix.sql`
   - Paste into the SQL Editor
   - Click **Run** or press `Ctrl+Enter`

4. **Verify the results**:
   ```sql
   SELECT id, name, public
   FROM storage.buckets
   WHERE id IN ('vendor-documents', 'vendor-logos', 'vendor-photos', 'product-images');
   ```

   Expected results:
   - `vendor-documents`: public = **false** (private)
   - `vendor-logos`: public = **true** (public)
   - `vendor-photos`: public = **true** (public)
   - `product-images`: public = **true** (public)

### Option B: Manual Setup in Dashboard

If you prefer manual setup or SQL doesn't work:

1. **Go to Storage** in Supabase Dashboard

2. **For each PUBLIC bucket** (vendor-logos, vendor-photos, product-images):
   - Click on the bucket name
   - Click **Configuration** tab
   - Toggle **Public bucket** to **ON**
   - Click **Save**

3. **For PRIVATE bucket** (vendor-documents):
   - Click on the bucket name
   - Click **Configuration** tab
   - Ensure **Public bucket** is **OFF**
   - Click **Save**

---

## 🔍 Step 3: Verify Environment Variables

1. **Check your `.env` file**:
   ```bash
   cat .env | grep SUPABASE
   ```

2. **Ensure these variables are set**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://yyffdrkfimxxieoonksw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **The SERVICE_ROLE_KEY is CRITICAL**:
   - This key bypasses RLS policies
   - Without it, uploads will fail
   - Never commit this key to git
   - Get it from: Supabase Dashboard → Settings → API → service_role key

---

## 🧪 Step 4: Test the Upload

1. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Test the diagnostic endpoint again**:
   ```bash
   curl http://localhost:3000/api/vendor/upload/test
   ```

3. **Look for**:
   ```json
   {
     "success": true,
     "recommendations": [
       "✅ Service role key is configured",
       "✅ Bucket \"vendor-documents\" exists",
       "✅ Bucket \"vendor-logos\" exists",
       ...
     ]
   }
   ```

4. **Test actual upload**:
   - Go to http://localhost:3000/auth/register/vendor
   - Fill out the form steps 1-3
   - Try uploading a document in step 4
   - Watch the browser console for logs (F12 → Console)
   - Check your terminal for server logs

---

## 📊 Understanding the Fix

### Why Uploads Were Failing

1. **Missing Service Role Key**:
   - Supabase RLS policies block anonymous uploads
   - Service role key bypasses RLS automatically
   - Without it, all uploads are rejected

2. **Buckets Not Public**:
   - Public buckets need `public = true` flag
   - This allows public read access to uploaded images
   - Private bucket (documents) should stay `public = false`

3. **No RLS Policies**:
   - By default, buckets have RLS enabled
   - No policies = no access
   - Service role key fixes this OR policies needed

### How the Fix Works

The fix uses **Service Role Key** approach:
- ✅ Uploads use `SUPABASE_SERVICE_ROLE_KEY` in API routes
- ✅ Service role bypasses ALL RLS policies
- ✅ No need for complex policy configuration
- ✅ Works immediately after setup
- ✅ Secure because key is server-side only

---

## 🔐 Security Notes

1. **Service Role Key**:
   - Has FULL admin access to your Supabase project
   - NEVER expose it to the client
   - Only use it in API routes (server-side)
   - Already configured correctly in `/api/vendor/upload/route.ts`

2. **Public Buckets**:
   - Anyone can READ files (that's the point)
   - Only authenticated requests can WRITE
   - Service role is used for writes in API

3. **Private Bucket**:
   - Stays private (`public = false`)
   - Admin dashboard uses signed URLs (1-hour expiry)
   - Regular users cannot access documents directly

---

## 🐛 Troubleshooting

### Issue: "Storage bucket not found"

**Cause**: Bucket doesn't exist in Supabase
**Fix**:
1. Go to Supabase Dashboard → Storage
2. Click **New bucket**
3. Create missing buckets:
   - `vendor-documents` (private)
   - `vendor-logos` (public)
   - `vendor-photos` (public)
   - `product-images` (public)

### Issue: "Upload failed due to permissions"

**Cause**: Service role key not set or incorrect
**Fix**:
1. Check `.env` file has `SUPABASE_SERVICE_ROLE_KEY`
2. Verify key is correct (copy from Supabase Dashboard → Settings → API)
3. Restart development server

### Issue: "CORS error" in browser console

**Cause**: Supabase CORS configuration
**Fix**:
1. Go to Supabase Dashboard → Settings → API
2. Add your domain to allowed origins:
   - Development: `http://localhost:3000`
   - Production: your actual domain
3. No restart needed

### Issue: Uploads work but images don't load

**Cause**: Public buckets not marked as public
**Fix**:
1. Run `supabase-storage-quick-fix.sql`
2. OR manually toggle **Public bucket** to ON for:
   - vendor-logos
   - vendor-photos
   - product-images

---

## 📝 Verification Checklist

After completing the fix, verify:

- [ ] Diagnostic test shows `success: true`
- [ ] All 4 buckets exist
- [ ] Public buckets have `public = true`
- [ ] Private bucket has `public = false`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
- [ ] Development server restarted
- [ ] Test upload completes successfully
- [ ] Uploaded images load in browser
- [ ] Admin dashboard can view documents

---

## 📞 Still Having Issues?

If uploads still don't work after following this guide:

1. **Check server logs** (`npm run dev` terminal):
   - Look for `[Upload API]` logs
   - Look for `[Supabase Upload]` logs
   - Copy any error messages

2. **Check browser console** (F12 → Console):
   - Look for network errors
   - Look for CORS errors
   - Check failed upload requests

3. **Run diagnostic endpoint**:
   ```bash
   curl http://localhost:3000/api/vendor/upload/test
   ```
   - Share the output

4. **Check Supabase Dashboard**:
   - Go to Storage → Policies
   - Verify no conflicting policies
   - Check bucket settings

5. **Verify environment variables**:
   ```bash
   echo $SUPABASE_SERVICE_ROLE_KEY
   # Should output the key, not empty
   ```

---

## 🎉 Success!

Once uploads are working:

1. ✅ Test all upload types:
   - Documents (GST, PAN, Business Reg, Bank Proof)
   - Logo
   - Banner

2. ✅ Verify in Supabase Dashboard:
   - Go to Storage → Buckets
   - Check files are uploaded
   - Verify file paths are correct

3. ✅ Test admin dashboard:
   - Login as admin
   - View pending vendors
   - Verify documents load with signed URLs

4. ✅ Optional: Run full RLS policies
   - See `supabase-storage-policies.sql`
   - For production-grade security
   - Not required if using service role key

---

## 📚 Additional Resources

- **Supabase Storage Docs**: https://supabase.com/docs/guides/storage
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security
- **Service Role**: https://supabase.com/docs/guides/api#the-service_role-key
- **Testing Guide**: `SUPABASE_INTEGRATION_TEST_GUIDE.md`
- **Setup Guide**: `SUPABASE_STORAGE_SETUP.md`

---

**Last Updated**: 2025-10-02
**Status**: Ready for Use
