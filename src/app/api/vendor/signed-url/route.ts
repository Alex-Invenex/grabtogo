import { NextRequest, NextResponse } from 'next/server';
import { createSignedUrl } from '@/lib/supabase';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/prisma';

interface SignedUrlResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SignedUrlResponse>> {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth();
    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, expiresIn } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Extract bucket and path from Supabase URL
    // Format: https://yyffdrkfimxxieoonksw.supabase.co/storage/v1/object/public/bucket-name/path/to/file
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Find 'object' in path and get bucket and file path
    const objectIndex = pathParts.indexOf('object');
    if (objectIndex === -1 || pathParts.length < objectIndex + 3) {
      return NextResponse.json(
        { success: false, error: 'Invalid Supabase URL format' },
        { status: 400 }
      );
    }

    // Skip 'public' or 'private' if present
    let bucketIndex = objectIndex + 1;
    if (pathParts[bucketIndex] === 'public' || pathParts[bucketIndex] === 'private') {
      bucketIndex++;
    }

    const bucket = pathParts[bucketIndex];
    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    if (!bucket || !filePath) {
      return NextResponse.json(
        { success: false, error: 'Could not extract bucket and path from URL' },
        { status: 400 }
      );
    }

    // Create signed URL (default 1 hour expiry)
    const signedUrl = await createSignedUrl(bucket, filePath, expiresIn || 3600);

    return NextResponse.json({
      success: true,
      url: signedUrl,
    });
  } catch (error) {
    console.error('Signed URL generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate signed URL',
      },
      { status: 500 }
    );
  }
}
