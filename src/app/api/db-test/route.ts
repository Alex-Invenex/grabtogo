import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('[DB Test] Testing database connection...');

  try {
    // Test 1: Simple query
    console.log('[DB Test] Attempting to query database...');
    const result = await db.$queryRaw`SELECT 1 as test`;
    console.log('[DB Test] ✅ Database query successful:', result);

    // Test 2: Check if vendor_registration_requests table exists
    console.log('[DB Test] Checking if vendor_registration_requests table exists...');
    const tableCheck = await db.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'vendor_registration_requests'
      );
    `;
    console.log('[DB Test] Table check result:', tableCheck);

    // Test 3: Count vendor registration requests
    console.log('[DB Test] Counting vendor registration requests...');
    const count = await db.vendorRegistrationRequest.count();
    console.log('[DB Test] Vendor registration count:', count);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      tests: {
        simpleQuery: 'passed',
        tableExists: 'passed',
        registrationCount: count,
      },
      environment: {
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
        directUrl: process.env.DIRECT_URL ? 'configured' : 'missing',
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error('[DB Test] ❌ Database connection failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';

    // Provide specific guidance based on error
    let recommendation = '';
    if (errorMessage.includes('Tenant or user not found')) {
      recommendation = `
        DATABASE PASSWORD ISSUE:

        The database password in your .env file is incorrect or has been reset.

        To fix this:
        1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/yyffdrkfimxxieoonksw
        2. Navigate to: Settings → Database
        3. Under "Connection string" → "Connection pooling" → Click "Reset database password"
        4. Copy the new password
        5. Update your .env file:
           - DATABASE_URL: Replace the password after "postgres.yyffdrkfimxxieoonksw:"
           - DIRECT_URL: Replace the password after "postgres.yyffdrkfimxxieoonksw:"
        6. Restart your development server: npm run dev

        Note: Both DATABASE_URL and DIRECT_URL should use the SAME password.
      `;
    } else if (errorMessage.includes('timeout')) {
      recommendation = 'Database connection timeout. Check your internet connection or Supabase service status.';
    } else if (errorMessage.includes('ENOTFOUND')) {
      recommendation = 'Database host not found. Verify the DATABASE_URL in your .env file.';
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        errorName,
        recommendation,
        environment: {
          databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
          directUrl: process.env.DIRECT_URL ? 'configured' : 'missing',
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 500 }
    );
  }
}
