import { NextRequest, NextResponse } from 'next/server';
import { uploadToSupabase, STORAGE_BUCKETS } from '@/lib/supabase';
import { nanoid } from 'nanoid';

const MAX_FILE_SIZES = {
  document: 10 * 1024 * 1024, // 10MB for documents
  image: 5 * 1024 * 1024, // 5MB for images
  logo: 2 * 1024 * 1024, // 2MB for logos
};

const ALLOWED_MIME_TYPES = {
  document: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ],
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
  logo: [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/svg+xml',
  ],
};

interface UploadResponse {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  console.log('[Upload API] Received upload request');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileType = formData.get('fileType') as 'document' | 'image' | 'logo' | null;
    const vendorId = formData.get('vendorId') as string | null;
    const documentType = formData.get('documentType') as string | null;

    console.log('[Upload API] Request details:', {
      hasFile: !!file,
      fileType,
      vendorId: vendorId?.substring(0, 8) + '...',
      documentType,
      fileName: file?.name,
      fileSize: file?.size,
      mimeType: file?.type,
    });

    // Validation
    if (!file) {
      console.error('[Upload API] Validation failed: No file provided');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!fileType || !['document', 'image', 'logo'].includes(fileType)) {
      console.error('[Upload API] Validation failed: Invalid file type:', fileType);
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Must be document, image, or logo' },
        { status: 400 }
      );
    }

    if (!vendorId) {
      console.error('[Upload API] Validation failed: No vendor ID');
      return NextResponse.json(
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = MAX_FILE_SIZES[fileType];
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      console.error('[Upload API] Validation failed: File too large:', {
        fileName: file.name,
        fileSize: fileSizeMB + 'MB',
        maxSize: maxSizeMB + 'MB',
      });
      return NextResponse.json(
        {
          success: false,
          error: `File size (${fileSizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB`,
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    const allowedTypes = ALLOWED_MIME_TYPES[fileType];
    if (!allowedTypes.includes(file.type)) {
      console.error('[Upload API] Validation failed: Invalid MIME type:', {
        fileName: file.name,
        mimeType: file.type,
        allowedTypes,
      });
      return NextResponse.json(
        {
          success: false,
          error: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    console.log('[Upload API] Validation passed, proceeding with upload');

    // Determine bucket and path
    let bucket: string;
    let path: string;
    const fileExt = file.name.split('.').pop() || 'bin';
    const uniqueFileName = `${nanoid()}.${fileExt}`;

    switch (fileType) {
      case 'document':
        bucket = STORAGE_BUCKETS.VENDOR_DOCUMENTS;
        path = documentType
          ? `${vendorId}/${documentType}/${uniqueFileName}`
          : `${vendorId}/${uniqueFileName}`;
        break;
      case 'image':
        bucket = STORAGE_BUCKETS.VENDOR_PHOTOS;
        path = `${vendorId}/photos/${uniqueFileName}`;
        break;
      case 'logo':
        bucket = STORAGE_BUCKETS.VENDOR_LOGOS;
        path = `${vendorId}/logo/${uniqueFileName}`;
        break;
      default:
        console.error('[Upload API] Invalid fileType in switch:', fileType);
        return NextResponse.json(
          { success: false, error: 'Invalid file type' },
          { status: 400 }
        );
    }

    console.log('[Upload API] Upload destination:', {
      bucket,
      path,
      uniqueFileName,
    });

    // Upload to Supabase
    console.log('[Upload API] Starting Supabase upload...');
    const result = await uploadToSupabase(bucket, path, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

    console.log('[Upload API] Upload successful!', {
      bucket,
      path: result.path,
      url: result.url.substring(0, 50) + '...',
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    });
  } catch (error) {
    console.error('[Upload API] Upload failed with error:', error);
    console.error('[Upload API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Provide more detailed error messages
    let errorMessage = 'Failed to upload file';
    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific Supabase errors
      if (error.message.includes('new row violates row-level security policy')) {
        errorMessage = 'Upload failed due to permissions. Please contact support.';
        console.error('[Upload API] RLS policy error - bucket may need policies configured');
      } else if (error.message.includes('bucket not found')) {
        errorMessage = 'Storage bucket not found. Please ensure buckets are created in Supabase.';
        console.error('[Upload API] Bucket not found error - buckets may not be created');
      } else if (error.message.includes('not found')) {
        errorMessage = 'Storage configuration error. Please check Supabase setup.';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
