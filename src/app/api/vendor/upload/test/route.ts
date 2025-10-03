import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase';

interface TestResult {
  success: boolean;
  timestamp: string;
  environment: {
    hasSupabaseUrl: boolean;
    hasAnonKey: boolean;
    hasServiceRoleKey: boolean;
    supabaseUrl?: string;
  };
  buckets: {
    [key: string]: {
      exists: boolean;
      error?: string;
      publicUrl?: string;
      canList?: boolean;
      listError?: string;
    };
  };
  recommendations: string[];
}

export async function GET(request: NextRequest): Promise<NextResponse<TestResult>> {
  console.log('[Upload Test] Starting diagnostic test...');

  const result: TestResult = {
    success: true,
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    buckets: {},
    recommendations: [],
  };

  // Check environment variables
  if (!result.environment.hasSupabaseUrl) {
    result.success = false;
    result.recommendations.push('❌ NEXT_PUBLIC_SUPABASE_URL is not set in environment variables');
  }

  if (!result.environment.hasAnonKey) {
    result.success = false;
    result.recommendations.push('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables');
  }

  if (!result.environment.hasServiceRoleKey) {
    result.success = false;
    result.recommendations.push(
      '❌ SUPABASE_SERVICE_ROLE_KEY is not set - uploads will fail due to RLS policies'
    );
    result.recommendations.push(
      '   → Add SUPABASE_SERVICE_ROLE_KEY to your .env file'
    );
  } else {
    result.recommendations.push('✅ Service role key is configured (uploads will bypass RLS)');
  }

  // Test each bucket
  const bucketsToTest = [
    { key: 'VENDOR_DOCUMENTS', name: STORAGE_BUCKETS.VENDOR_DOCUMENTS, shouldBePublic: false },
    { key: 'VENDOR_LOGOS', name: STORAGE_BUCKETS.VENDOR_LOGOS, shouldBePublic: true },
    { key: 'VENDOR_PHOTOS', name: STORAGE_BUCKETS.VENDOR_PHOTOS, shouldBePublic: true },
    { key: 'PRODUCT_IMAGES', name: STORAGE_BUCKETS.PRODUCT_IMAGES, shouldBePublic: true },
  ];

  const client = supabaseAdmin || supabase;

  for (const bucket of bucketsToTest) {
    console.log(`[Upload Test] Testing bucket: ${bucket.name}`);

    try {
      // Try to list files in the bucket (will fail if bucket doesn't exist)
      const { data, error } = await client.storage.from(bucket.name).list('', {
        limit: 1,
      });

      if (error) {
        result.buckets[bucket.key] = {
          exists: false,
          error: error.message,
          canList: false,
          listError: error.message,
        };
        result.success = false;

        if (error.message.includes('not found')) {
          result.recommendations.push(
            `❌ Bucket "${bucket.name}" does not exist - create it in Supabase Dashboard`
          );
        } else {
          result.recommendations.push(
            `⚠️  Bucket "${bucket.name}" error: ${error.message}`
          );
        }
      } else {
        result.buckets[bucket.key] = {
          exists: true,
          canList: true,
          publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket.name}/test.jpg`,
        };

        if (bucket.shouldBePublic) {
          result.recommendations.push(
            `✅ Bucket "${bucket.name}" exists - ensure it's marked as PUBLIC in Supabase Dashboard`
          );
        } else {
          result.recommendations.push(
            `✅ Bucket "${bucket.name}" exists and should remain private`
          );
        }
      }
    } catch (error) {
      result.buckets[bucket.key] = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        canList: false,
      };
      result.success = false;
      result.recommendations.push(
        `❌ Failed to test bucket "${bucket.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Add general recommendations
  if (!result.success) {
    result.recommendations.push('');
    result.recommendations.push('📋 NEXT STEPS:');
    result.recommendations.push('1. Go to Supabase Dashboard → Storage');
    result.recommendations.push('2. Create missing buckets (vendor-documents, vendor-logos, vendor-photos, product-images)');
    result.recommendations.push('3. Mark public buckets as PUBLIC (vendor-logos, vendor-photos, product-images)');
    result.recommendations.push('4. Run the SQL script: supabase-storage-quick-fix.sql');
    result.recommendations.push('5. Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env file');
    result.recommendations.push('6. Restart your development server');
  } else {
    result.recommendations.push('');
    result.recommendations.push('✅ All checks passed! Upload should work.');
    result.recommendations.push('📝 Run supabase-storage-quick-fix.sql for optimal configuration');
  }

  console.log('[Upload Test] Test completed:', result.success ? 'PASSED' : 'FAILED');

  return NextResponse.json(result, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
