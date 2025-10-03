'use client';

import { useFormContext } from 'react-hook-form';
import { useState, useCallback } from 'react';
import { FileText, Upload, Eye, X, Check, Loader2 } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { nanoid } from 'nanoid';

interface DocumentType {
  id: string;
  label: string;
  fieldName: string;
  documentType: string;
  maxSize: number;
  acceptedFormats: string[];
  required: boolean;
}

interface UploadState {
  progress: number;
  uploading: boolean;
  error: string | null;
  uploadedBytes: number;
  totalBytes: number;
}

const DOCUMENTS: DocumentType[] = [
  {
    id: 'gstCertificate',
    label: 'GST Certificate',
    fieldName: 'gstCertificate',
    documentType: 'gst',
    maxSize: 5 * 1024 * 1024,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    required: true,
  },
  {
    id: 'panCard',
    label: 'PAN Card',
    fieldName: 'panCard',
    documentType: 'pan',
    maxSize: 2 * 1024 * 1024,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    required: true,
  },
  {
    id: 'businessRegistration',
    label: 'Business Registration',
    fieldName: 'businessRegistration',
    documentType: 'business_reg',
    maxSize: 5 * 1024 * 1024,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    required: true,
  },
  {
    id: 'bankProof',
    label: 'Bank Account Proof',
    fieldName: 'bankProof',
    documentType: 'bank_proof',
    maxSize: 5 * 1024 * 1024,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    required: true,
  },
];

export default function DocumentUploadStep() {
  const { control, setValue, watch } = useFormContext();
  const [uploadStates, setUploadStates] = useState<{ [key: string]: UploadState }>({});
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});

  const handleFileSelect = useCallback(
    (fieldName: string, documentType: string, maxSize: number) =>
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;

        if (!file) {
          setValue(fieldName, null);
          setPreviews((prev) => {
            const newPreviews = { ...prev };
            delete newPreviews[fieldName];
            return newPreviews;
          });
          return;
        }

        if (file.size > maxSize) {
          setUploadStates((prev) => ({
            ...prev,
            [fieldName]: {
              progress: 0,
              uploading: false,
              error: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
              uploadedBytes: 0,
              totalBytes: file.size,
            },
          }));
          event.target.value = '';
          return;
        }

        // Generate temporary vendor ID for upload path
        const tempVendorId = nanoid();

        // Set initial upload state
        setUploadStates((prev) => ({
          ...prev,
          [fieldName]: {
            progress: 0,
            uploading: true,
            error: null,
            uploadedBytes: 0,
            totalBytes: file.size,
          },
        }));

        try {
          // Create FormData for upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fileType', 'document');
          formData.append('vendorId', tempVendorId);
          formData.append('documentType', documentType);

          // Simulate progress with intervals
          const progressInterval = setInterval(() => {
            setUploadStates((prev) => {
              const current = prev[fieldName];
              if (current && current.progress < 90) {
                return {
                  ...prev,
                  [fieldName]: {
                    ...current,
                    progress: Math.min(current.progress + Math.random() * 15, 90),
                  },
                };
              }
              return prev;
            });
          }, 200);

          // Upload to API
          const response = await fetch('/api/vendor/upload', {
            method: 'POST',
            body: formData,
          });

          clearInterval(progressInterval);

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
          }

          const result = await response.json();

          // Store Supabase URL in form
          setValue(fieldName, result.url);

          // Create preview for images
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
              setPreviews((prev) => ({ ...prev, [fieldName]: reader.result as string }));
            };
            reader.readAsDataURL(file);
          }

          // Complete upload
          setUploadStates((prev) => ({
            ...prev,
            [fieldName]: {
              progress: 100,
              uploading: false,
              error: null,
              uploadedBytes: file.size,
              totalBytes: file.size,
            },
          }));
        } catch (error) {
          console.error('Upload error:', error);
          setUploadStates((prev) => ({
            ...prev,
            [fieldName]: {
              progress: 0,
              uploading: false,
              error: error instanceof Error ? error.message : 'Upload failed',
              uploadedBytes: 0,
              totalBytes: file.size,
            },
          }));
          setValue(fieldName, null);
        }

        // Reset input
        event.target.value = '';
      },
    [setValue]
  );

  const removeFile = useCallback(
    (fieldName: string) => {
      setValue(fieldName, null);
      setUploadStates((prev) => {
        const newStates = { ...prev };
        delete newStates[fieldName];
        return newStates;
      });
      setPreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[fieldName];
        return newPreviews;
      });
    },
    [setValue]
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Document Upload</h2>
        <p className="text-gray-600 mt-1">Upload required business documents to Supabase Storage</p>
      </div>

      <div className="space-y-4">
        {DOCUMENTS.map((doc) => {
          const value = watch(doc.fieldName);
          const uploadState = uploadStates[doc.fieldName];
          const preview = previews[doc.fieldName];

          return (
            <FormField
              key={doc.id}
              control={control}
              name={doc.fieldName}
              render={() => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {doc.label}
                    {doc.required && <span className="text-red-500">*</span>}
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {!value ? (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.acceptedFormats.join(', ')} (MAX. {doc.maxSize / (1024 * 1024)}MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept={doc.acceptedFormats.join(',')}
                            onChange={handleFileSelect(doc.fieldName, doc.documentType, doc.maxSize)}
                            disabled={uploadState?.uploading}
                          />
                        </label>
                      ) : (
                        <div className="relative p-4 border-2 border-green-300 rounded-lg bg-green-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {preview ? (
                                <img
                                  src={preview}
                                  alt="Preview"
                                  className="w-16 h-16 object-cover rounded"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                  <FileText className="w-8 h-8 text-gray-500" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{doc.label}</p>
                                {uploadState && (
                                  <div className="space-y-1 mt-1">
                                    <p className="text-sm text-gray-500">
                                      {formatBytes(uploadState.uploadedBytes)} / {formatBytes(uploadState.totalBytes)}
                                    </p>
                                    {uploadState.uploading && (
                                      <Progress value={uploadState.progress} className="h-2" />
                                    )}
                                    {uploadState.uploading && (
                                      <div className="flex items-center gap-2 text-blue-600">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        <span className="text-xs">Uploading... {uploadState.progress}%</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {value && !uploadState?.uploading && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(value, '_blank')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(doc.fieldName)}
                                disabled={uploadState?.uploading}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {uploadState?.progress === 100 && !uploadState.uploading && (
                            <div className="flex items-center gap-2 mt-2 text-green-600">
                              <Check className="w-4 h-4" />
                              <span className="text-sm">Upload complete - Stored in Supabase</span>
                            </div>
                          )}
                          {uploadState?.error && (
                            <div className="mt-2 text-sm text-red-600">{uploadState.error}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> All documents are uploaded to Supabase Storage and will be verified by our team.
          Ensure all documents are clear and valid.
        </p>
      </div>
    </div>
  );
}
