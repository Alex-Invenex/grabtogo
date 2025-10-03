# Database Sync Guide - Preventing Schema Mismatch Errors

## The Problem

You keep getting errors like:
```
Invalid `prisma.vendorRegistrationRequest.findFirst()` invocation:
The column `vendor_registration_requests.approvedBy` does not exist in the current database
```

**Root Cause:** Your Prisma schema (schema.prisma) and Supabase database are out of sync.

## Why This Keeps Happening

1. **Supabase manages the database directly** - Changes aren't automatically tracked
2. **Prisma schema changes** - When schema.prisma is updated, the database isn't automatically updated
3. **No migration history** - Without proper migrations, changes get lost

## The Permanent Solution

### Step 1: Always Use This Workflow When Changing Schema

```bash
# 1. Edit prisma/schema.prisma with your changes
# 2. Push changes directly to Supabase (bypasses migration system)
npm run db:push

# 3. Regenerate Prisma client
npm run db:generate

# 4. Restart dev server
npm run dev
```

### Step 2: For Production - Use Supabase SQL Editor

For production changes, **ALWAYS** apply schema changes via Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration SQL manually
3. Then run `npm run db:generate` locally

### Step 3: Verification Script

I've created a script to check if your schema and database are in sync:

```bash
# Run this anytime to check for schema mismatches
npm run db:check
```

## Current Database State (2025-10-03)

All vendor_registration_requests columns are now present:
- ✅ approvedBy
- ✅ approvedAt
- ✅ rejectedBy
- ✅ rejectedAt
- ✅ rejectionReason
- ✅ adminNotes

## Commands Reference

```bash
# Push schema changes to Supabase (RECOMMENDED for development)
npm run db:push

# Regenerate Prisma client after schema changes
npm run db:generate

# Open Prisma Studio to inspect database
npm run db:studio

# Reset database (WARNING: Deletes all data)
npm run db:reset
```

## When Schema Changes Are Made

**BEFORE making schema changes:**
1. Backup your data if needed
2. Document what you're changing

**AFTER making schema changes:**
1. Run `npm run db:push` to sync to database
2. Run `npm run db:generate` to regenerate client
3. Test the application thoroughly
4. Commit BOTH schema.prisma AND generated client changes

## Why Not Use Prisma Migrate?

Supabase uses connection pooling (pgBouncer) which doesn't support Prisma Migrate's advisory locks. Instead:
- Use `prisma db push` for development
- Use Supabase SQL Editor for production
- Keep schema.prisma as source of truth

## Troubleshooting

### Error: Column doesn't exist
```bash
# This means schema and database are out of sync
# Fix it:
npm run db:push
npm run db:generate
```

### Error: Can't reach database server at port 6543
```bash
# Prisma Migrate can't use the pooler
# Use db:push instead:
npm run db:push
```

### Error: Connection pool timeout
```bash
# Too many connections, restart dev server:
# Ctrl+C to stop
npm run dev
```

## Prevention Checklist

Before deploying or making schema changes:

- [ ] Schema changes documented
- [ ] `npm run db:push` executed successfully
- [ ] `npm run db:generate` completed
- [ ] Application tested locally
- [ ] Changes committed to Git
- [ ] Production database updated via Supabase SQL Editor

## Contact

If you continue to see schema mismatch errors after following this guide, the issue is likely:
1. Schema.prisma was changed but `db:push` wasn't run
2. Database was modified directly without updating schema.prisma
3. Generated Prisma client is stale (run `db:generate`)
