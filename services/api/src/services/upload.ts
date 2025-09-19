import AWS from 'aws-sdk';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { CustomError } from '../types/api';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'grabtogo-uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB
const ALLOWED_TYPES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',');

export interface UploadResult {
  originalUrl: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ImageVariant {
  name: string;
  width: number;
  height?: number;
  quality: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class UploadService {

  // Image variants for different use cases
  private static imageVariants: Record<string, ImageVariant[]> = {
    product: [
      { name: 'thumbnail', width: 150, height: 150, quality: 80, format: 'webp' },
      { name: 'medium', width: 400, height: 400, quality: 85, format: 'webp' },
      { name: 'large', width: 800, height: 800, quality: 90, format: 'webp' }
    ],
    offer: [
      { name: 'thumbnail', width: 200, height: 150, quality: 80, format: 'webp' },
      { name: 'medium', width: 600, height: 400, quality: 85, format: 'webp' },
      { name: 'large', width: 1200, height: 800, quality: 90, format: 'webp' }
    ],
    story: [
      { name: 'thumbnail', width: 150, height: 267, quality: 75, format: 'webp' }, // 9:16 aspect ratio
      { name: 'medium', width: 400, height: 711, quality: 80, format: 'webp' },
      { name: 'large', width: 720, height: 1280, quality: 85, format: 'webp' }
    ]
  };

  // Validate file before upload
  static validateFile(file: Buffer, mimeType: string): void {
    if (file.length > MAX_FILE_SIZE) {
      throw new CustomError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`, 400);
    }

    if (!ALLOWED_TYPES.includes(mimeType)) {
      throw new CustomError(`File type ${mimeType} not allowed. Supported types: ${ALLOWED_TYPES.join(', ')}`, 400);
    }
  }

  // Generate unique filename
  static generateFileName(originalName: string, variant?: string): string {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const uniqueId = uuidv4().slice(0, 8);
    const timestamp = Date.now();

    if (variant) {
      return `${baseName}_${variant}_${timestamp}_${uniqueId}.webp`;
    }
    return `${baseName}_${timestamp}_${uniqueId}${ext}`;
  }

  // Upload file to S3
  static async uploadToS3(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string = 'general'
  ): Promise<string> {
    const key = `${folder}/${fileName}`;

    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read',
      CacheControl: 'max-age=31536000', // 1 year
      Metadata: {
        uploadedAt: new Date().toISOString(),
        originalSize: buffer.length.toString()
      }
    };

    try {
      const result = await s3.upload(uploadParams).promise();
      return result.Location;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new CustomError('Failed to upload file to storage', 500);
    }
  }

  // Process and upload image with variants
  static async uploadImageWithVariants(
    file: Buffer,
    originalName: string,
    mimeType: string,
    type: 'product' | 'offer' | 'story' = 'product'
  ): Promise<UploadResult> {
    this.validateFile(file, mimeType);

    const variants = this.imageVariants[type];
    const urls: Record<string, string> = {};
    let originalUrl = '';

    try {
      // Upload original image
      const originalFileName = this.generateFileName(originalName);
      originalUrl = await this.uploadToS3(file, originalFileName, mimeType, type);

      // Process and upload variants
      for (const variant of variants) {
        const processedBuffer = await this.processImage(file, variant);
        const variantFileName = this.generateFileName(originalName, variant.name);
        const variantMimeType = `image/${variant.format || 'webp'}`;

        const variantUrl = await this.uploadToS3(
          processedBuffer,
          variantFileName,
          variantMimeType,
          `${type}/variants`
        );

        urls[`${variant.name}Url`] = variantUrl;
      }

      return {
        originalUrl,
        thumbnailUrl: urls.thumbnailUrl,
        mediumUrl: urls.mediumUrl,
        fileName: path.basename(originalUrl),
        fileSize: file.length,
        mimeType
      };

    } catch (error) {
      console.error('Image upload error:', error);
      throw new CustomError('Failed to process and upload image', 500);
    }
  }

  // Process image with Sharp
  static async processImage(buffer: Buffer, variant: ImageVariant): Promise<Buffer> {
    try {
      let processor = sharp(buffer)
        .resize(variant.width, variant.height, {
          fit: 'cover',
          position: 'center'
        });

      // Apply format and quality
      switch (variant.format) {
        case 'jpeg':
          processor = processor.jpeg({ quality: variant.quality });
          break;
        case 'png':
          processor = processor.png({ quality: variant.quality });
          break;
        case 'webp':
        default:
          processor = processor.webp({ quality: variant.quality });
          break;
      }

      return await processor.toBuffer();
    } catch (error) {
      console.error('Image processing error:', error);
      throw new CustomError('Failed to process image', 500);
    }
  }

  // Upload single file (for direct uploads)
  static async uploadSingleFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'general'
  ): Promise<UploadResult> {
    this.validateFile(file, mimeType);

    const fileName = this.generateFileName(originalName);
    const url = await this.uploadToS3(file, fileName, mimeType, folder);

    return {
      originalUrl: url,
      fileName: path.basename(url),
      fileSize: file.length,
      mimeType
    };
  }

  // Delete file from S3
  static async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Remove leading slash

      const deleteParams: AWS.S3.DeleteObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      await s3.deleteObject(deleteParams).promise();
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new CustomError('Failed to delete file from storage', 500);
    }
  }

  // Get signed URL for temporary access
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: expiresIn
      };

      return s3.getSignedUrl('getObject', params);
    } catch (error) {
      console.error('Signed URL error:', error);
      throw new CustomError('Failed to generate signed URL', 500);
    }
  }

  // Bulk delete files
  static async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
    if (fileUrls.length === 0) return;

    try {
      const keys = fileUrls.map(url => {
        const urlObj = new URL(url);
        return { Key: urlObj.pathname.substring(1) };
      });

      const deleteParams: AWS.S3.DeleteObjectsRequest = {
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: keys,
          Quiet: true
        }
      };

      await s3.deleteObjects(deleteParams).promise();
    } catch (error) {
      console.error('Bulk delete error:', error);
      throw new CustomError('Failed to delete files from storage', 500);
    }
  }

  // Get image metadata
  static async getImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    try {
      return await sharp(buffer).metadata();
    } catch (error) {
      console.error('Image metadata error:', error);
      throw new CustomError('Failed to read image metadata', 400);
    }
  }

  // Compress image without resizing
  static async compressImage(
    buffer: Buffer,
    quality: number = 80,
    format: 'jpeg' | 'png' | 'webp' = 'webp'
  ): Promise<Buffer> {
    try {
      let processor = sharp(buffer);

      switch (format) {
        case 'jpeg':
          processor = processor.jpeg({ quality });
          break;
        case 'png':
          processor = processor.png({ quality });
          break;
        case 'webp':
        default:
          processor = processor.webp({ quality });
          break;
      }

      return await processor.toBuffer();
    } catch (error) {
      console.error('Image compression error:', error);
      throw new CustomError('Failed to compress image', 500);
    }
  }
}

export default UploadService;