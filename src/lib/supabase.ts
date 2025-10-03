import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Supabase client for client-side operations
 * Uses the anon key with Row Level Security (RLS)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're using NextAuth.js for auth
  },
});

/**
 * Supabase admin client for server-side operations
 * Uses the service role key and bypasses RLS
 * ONLY use this on the server side (API routes, server components)
 */
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/**
 * Get the public URL for a file in Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 * @returns The public URL for the file
 */
export function getSupabaseFileUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a file to Supabase Storage
 * Uses service role key (bypasses RLS) when available
 * @param bucket - The storage bucket name
 * @param path - The destination path in the bucket
 * @param file - The file to upload (File, Blob, or Buffer)
 * @param options - Upload options
 * @returns The path to the uploaded file
 */
export async function uploadToSupabase(
  bucket: string,
  path: string,
  file: File | Blob | Buffer,
  options?: {
    contentType?: string;
    cacheControl?: string;
    upsert?: boolean;
  }
): Promise<{ path: string; url: string }> {
  // IMPORTANT: Use admin client (service role) to bypass RLS policies
  // This ensures uploads work regardless of RLS configuration
  if (!supabaseAdmin) {
    console.warn(
      'SUPABASE_SERVICE_ROLE_KEY not configured - uploads may fail due to RLS policies'
    );
  }

  const client = supabaseAdmin || supabase;

  console.log('[Supabase Upload] Starting upload:', {
    bucket,
    path,
    fileSize: file instanceof File ? file.size : 'unknown',
    fileName: file instanceof File ? file.name : 'blob',
    contentType: options?.contentType || (file instanceof File ? file.type : 'unknown'),
  });

  const { data, error } = await client.storage.from(bucket).upload(path, file, {
    contentType: options?.contentType,
    cacheControl: options?.cacheControl || '3600',
    upsert: options?.upsert || false,
  });

  if (error) {
    console.error('[Supabase Upload] Upload failed:', {
      bucket,
      path,
      error: error.message,
      errorDetails: error,
    });
    throw new Error(`Failed to upload to ${bucket}/${path}: ${error.message}`);
  }

  console.log('[Supabase Upload] Upload successful:', {
    bucket,
    path: data.path,
  });

  const url = getSupabaseFileUrl(bucket, data.path);

  return {
    path: data.path,
    url,
  };
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 */
export async function deleteFromSupabase(
  bucket: string,
  path: string
): Promise<void> {
  const client = supabaseAdmin || supabase;

  const { error } = await client.storage.from(bucket).remove([path]);

  if (error) {
    console.error('Supabase delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete multiple files from Supabase Storage
 * @param bucket - The storage bucket name
 * @param paths - Array of file paths to delete
 */
export async function deleteMultipleFromSupabase(
  bucket: string,
  paths: string[]
): Promise<void> {
  const client = supabaseAdmin || supabase;

  const { error } = await client.storage.from(bucket).remove(paths);

  if (error) {
    console.error('Supabase delete error:', error);
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}

// Storage bucket names
export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  VENDOR_LOGOS: 'vendor-logos',
  VENDOR_PHOTOS: 'vendor-photos',
  VENDOR_DOCUMENTS: 'vendor-documents',
  REVIEW_IMAGES: 'review-images',
} as const;

/**
 * Create a signed URL for private files (1-hour expiry)
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 * @param expiresIn - Expiry time in seconds (default: 3600 = 1 hour)
 * @returns The signed URL
 */
export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = supabaseAdmin || supabase;

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Supabase signed URL error:', error);
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Get image URL with Supabase transformation parameters
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 * @param options - Transformation options
 * @returns The transformed image URL
 */
export function getImageWithTransform(
  bucket: string,
  path: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'origin';
  }
): string {
  const baseUrl = getSupabaseFileUrl(bucket, path);

  if (!options) return baseUrl;

  const params = new URLSearchParams();
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.format) params.append('format', options.format);

  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}

/**
 * Upload a file with progress tracking
 * @param bucket - The storage bucket name
 * @param path - The destination path in the bucket
 * @param file - The file to upload
 * @param onProgress - Progress callback (percentage: 0-100)
 * @param options - Upload options
 * @returns The path and URL of the uploaded file
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (percentage: number, uploadedBytes: number, totalBytes: number) => void,
  options?: {
    contentType?: string;
    cacheControl?: string;
    upsert?: boolean;
  }
): Promise<{ path: string; url: string }> {
  // Use admin client to bypass RLS
  if (!supabaseAdmin) {
    console.warn(
      'SUPABASE_SERVICE_ROLE_KEY not configured - uploads may fail due to RLS policies'
    );
  }

  const client = supabaseAdmin || supabase;

  // Supabase doesn't natively support progress tracking
  // We'll simulate it for better UX
  const totalBytes = file.size;
  let uploadedBytes = 0;

  console.log('[Supabase Upload with Progress] Starting upload:', {
    bucket,
    path,
    fileSize: file.size,
    fileName: file.name,
  });

  // Simulate progress during upload
  const progressInterval = setInterval(() => {
    if (uploadedBytes < totalBytes) {
      uploadedBytes = Math.min(uploadedBytes + totalBytes * 0.1, totalBytes * 0.9);
      const percentage = Math.floor((uploadedBytes / totalBytes) * 100);
      onProgress?.(percentage, uploadedBytes, totalBytes);
    }
  }, 100);

  try {
    const { data, error } = await client.storage.from(bucket).upload(path, file, {
      contentType: options?.contentType || file.type,
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert || false,
    });

    clearInterval(progressInterval);

    if (error) {
      onProgress?.(0, 0, totalBytes); // Reset progress on error
      console.error('[Supabase Upload with Progress] Upload failed:', {
        bucket,
        path,
        error: error.message,
        errorDetails: error,
      });
      throw new Error(`Failed to upload to ${bucket}/${path}: ${error.message}`);
    }

    // Complete progress
    onProgress?.(100, totalBytes, totalBytes);

    console.log('[Supabase Upload with Progress] Upload successful:', {
      bucket,
      path: data.path,
    });

    const url = getSupabaseFileUrl(bucket, data.path);

    return {
      path: data.path,
      url,
    };
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
}

/**
 * Upload multiple files in batch
 * @param bucket - The storage bucket name
 * @param files - Array of files with their destination paths
 * @param onProgress - Progress callback for overall progress
 * @returns Array of uploaded file paths and URLs
 */
export async function uploadBatch(
  bucket: string,
  files: Array<{ path: string; file: File }>,
  onProgress?: (completed: number, total: number) => void
): Promise<Array<{ path: string; url: string; originalPath: string }>> {
  const results: Array<{ path: string; url: string; originalPath: string }> = [];
  let completed = 0;

  for (const { path, file } of files) {
    try {
      const result = await uploadToSupabase(bucket, path, file);
      results.push({ ...result, originalPath: path });
      completed++;
      onProgress?.(completed, files.length);
    } catch (error) {
      console.error(`Failed to upload ${path}:`, error);
      throw error;
    }
  }

  return results;
}
