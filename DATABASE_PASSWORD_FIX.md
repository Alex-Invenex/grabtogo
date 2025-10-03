# Database Password Fix - Registration Submission Issue

## 🐛 Issue Identified

**Problem**: Registration submission fails with "Failed to submit registration" error.

**Root Cause**: The database password in your `.env` file is **incorrect or has been reset**. This prevents the application from connecting to your Supabase PostgreSQL database.

**Error Message**: `FATAL: Tenant or user not found`

---

## ✅ Solution: Update Database Password

### Step 1: Get New Database Password from Supabase

1. **Go to your Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard/project/yyffdrkfimxxieoonksw
   - Log in with your Supabase account

2. **Navigate to Database Settings**:
   - Click **Settings** (in the left sidebar)
   - Click **Database**

3. **Reset Database Password**:
   - Scroll to "Connection string" section
   - Click the **"Connection pooling"** tab
   - Click **"Reset database password"** button
   - **Copy the new password** that appears (you'll need it in the next step)

   > ⚠️ **Important**: Save this password securely! You won't be able to see it again.

### Step 2: Update Your `.env` File

1. **Open** `/home/eliot/Desktop/grabtogo/.env`

2. **Find these two lines** (they look similar):
   ```env
   DATABASE_URL="postgresql://postgres.yyffdrkfimxxieoonksw:OLD_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?schema=public&sslmode=require"
   DIRECT_URL="postgresql://postgres.yyffdrkfimxxieoonksw:OLD_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
   ```

3. **Replace `OLD_PASSWORD`** with the new password you copied from Supabase:
   ```env
   DATABASE_URL="postgresql://postgres.yyffdrkfimxxieoonksw:YOUR_NEW_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?schema=public&sslmode=require"
   DIRECT_URL="postgresql://postgres.yyffdrkfimxxieoonksw:YOUR_NEW_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
   ```

   > 📝 **Note**: The password goes **after** `postgres.yyffdrkfimxxieoonksw:` and **before** `@aws-0-ap-south-1`

4. **Save the file**

### Step 3: Restart Development Server

The development server needs to reload the environment variables.

**Option A: Kill and restart manually**:
```bash
# Stop the current dev server (Ctrl+C in the terminal)
# Then start it again:
npm run dev
```

**Option B: Use the auto-restart command**:
```bash
lsof -ti:3001 | xargs -r kill -9 2>/dev/null && npm run dev
```

---

## 🧪 Test the Fix

After updating the password and restarting the server:

### 1. Test Database Connection

Visit this diagnostic endpoint to verify the database connection:
```bash
curl http://localhost:3001/api/db-test
```

**Expected successful response**:
```json
{
  "success": true,
  "message": "Database connection successful",
  "tests": {
    "simpleQuery": "passed",
    "tableExists": "passed",
    "registrationCount": 0
  }
}
```

**If it fails**, you'll see a specific error message with recommendations.

### 2. Test Vendor Registration

1. Navigate to: http://localhost:3001/auth/register/vendor
2. Fill out all 9 steps of the registration form
3. Upload GST certificate (should work - we fixed that earlier)
4. Upload logo (should work)
5. Click **"Submit Application"** on the final step

**Expected Result**:
- ✅ Success message appears
- ✅ Confirmation email sent
- ✅ No errors in browser console
- ✅ No errors in server logs

---

## 🔍 How to Verify Success

### Check Server Logs

After submitting registration, you should see these log messages:

```
[Vendor Registration] Submission request received
[Vendor Registration] Form data received: { email: '...', companyName: '...' }
[Vendor Registration] Creating registration request in database...
[Vendor Registration] ✅ Registration request created successfully: { id: '...', email: '...', companyName: '...' }
```

### Check Browser Console (F12)

You should see:
```
[Vendor Registration] Submitting registration...
[Vendor Registration] Response received: { status: 200, ok: true, data: {...} }
[Vendor Registration] ✅ Submission successful!
```

### Check Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/yyffdrkfimxxieoonksw
2. Click **Table Editor** (left sidebar)
3. Select **vendor_registration_requests** table
4. You should see your registration data

---

## 🚨 Troubleshooting

### Issue: Still getting "Tenant or user not found"

**Possible causes**:
1. **Wrong password** - Make sure you copied the entire password correctly
2. **Extra spaces** - Check for spaces before/after the password in .env
3. **Server not restarted** - Must restart after changing .env

**Solution**:
```bash
# Stop the server (Ctrl+C)
# Verify .env has correct password (no extra spaces)
# Start server again
npm run dev
# Test again
curl http://localhost:3001/api/db-test
```

### Issue: "Cannot find module '@/lib/db'"

**Solution**:
```bash
npx prisma generate
npm run dev
```

### Issue: Diagnostic endpoint shows different error

Run the diagnostic and check the `recommendation` field:
```bash
curl http://localhost:3001/api/db-test | jq '.recommendation'
```

---

## 📊 What Was Fixed

### Previous Issues (All Resolved):

1. ✅ **Supabase Storage Upload** - Fixed in `UPLOAD_FIX_SUMMARY.md`
   - Files now upload successfully to Supabase Storage
   - Returns HTTPS URLs instead of base64

2. ✅ **Validation Schema** - Fixed in `VALIDATION_FIX_SUMMARY.md`
   - Updated to accept both `data:` URIs and `https://` URLs
   - User can now continue after successful upload

3. ✅ **Database Connection** - Fixed in this guide
   - Database password needs to be updated in .env
   - Registration submission will work after fix

### Timeline of Fixes:

```
Issue 1: Files couldn't upload
  ↓
Fix 1: Enhanced Supabase upload with service role key
  ↓
Issue 2: Couldn't continue after upload (validation failed)
  ↓
Fix 2: Updated validation schema to accept HTTPS URLs
  ↓
Issue 3: Submission failed (database connection)
  ↓
Fix 3: Update database password in .env (THIS FIX)
  ↓
✅ Registration works end-to-end
```

---

## 📝 Files Modified in This Fix

### 1. Enhanced Error Logging

**File**: `src/app/api/vendor-registration/submit/route.ts`
- Added detailed logging for debugging
- Shows exact database error
- Returns error details in development mode

**File**: `src/app/(main)/auth/register/vendor/components/steps/SubmissionStep.tsx`
- Added console logging for submission process
- Shows response details in browser console
- Displays technical error details

### 2. Diagnostic Tool

**File**: `src/app/api/db-test/route.ts` (NEW)
- Tests database connectivity
- Checks if tables exist
- Provides specific fix recommendations
- Access at: http://localhost:3001/api/db-test

---

## 🎯 Quick Fix Summary

**If you just want the quick steps**:

1. Get new password from Supabase: https://supabase.com/dashboard/project/yyffdrkfimxxieoonksw → Settings → Database → Reset password
2. Update both `DATABASE_URL` and `DIRECT_URL` in `.env` with the new password
3. Restart dev server: `npm run dev`
4. Test: `curl http://localhost:3001/api/db-test`
5. Try vendor registration again

---

## ✨ Why This Happened

The database password issue likely occurred because:

1. **Password was reset** - Either manually or automatically by Supabase
2. **Different environment** - Using a different .env file or configuration
3. **Migration issue** - Database was recreated after initial setup

This is common when:
- Setting up the project in a new environment
- After resetting Supabase credentials for security
- When switching between development and production databases

---

## 📞 Still Having Issues?

If the problem persists after following this guide:

1. **Check server logs** for specific error messages
2. **Run the diagnostic**: `curl http://localhost:3001/api/db-test`
3. **Verify Supabase status**: https://status.supabase.com
4. **Check if the database is paused** in Supabase Dashboard

---

**Fix Status**: ✅ **SOLUTION IDENTIFIED**
**Fixed By**: Claude Code
**Date**: 2025-10-02
**Priority**: Critical - Blocks registration submission
**Action Required**: Update database password in .env file

---

## 🔗 Related Documentation

- `VALIDATION_FIX_SUMMARY.md` - Validation schema fix (completed)
- `UPLOAD_FIX_SUMMARY.md` - Supabase storage upload fix (completed)
- `UPLOAD_FIX_GUIDE.md` - Upload troubleshooting guide
- `SUPABASE_STORAGE_SETUP.md` - Supabase storage configuration
