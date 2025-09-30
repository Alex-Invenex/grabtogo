'use client';

import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { FileText, Upload, Eye, X, Check } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface DocumentType {
  id: string;
  label: string;
  fieldName: string;
  maxSize: number;
  acceptedFormats: string[];
  required: boolean;
}

const DOCUMENTS: DocumentType[] = [
  {
    id: 'gstCertificate',
    label: 'GST Certificate',
    fieldName: 'gstCertificate',
    maxSize: 5 * 1024 * 1024,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    required: true,
  },
  {
    id: 'panCard',
    label: 'PAN Card',
    fieldName: 'panCard',
    maxSize: 2 * 1024 * 1024,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    required: true,
  },
  {
    id: 'businessRegistration',
    label: 'Business Registration',
    fieldName: 'businessRegistration',
    maxSize: 5 * 1024 * 1024,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    required: true,
  },
  {
    id: 'bankProof',
    label: 'Bank Account Proof',
    fieldName: 'bankProof',
    maxSize: 5 * 1024 * 1024,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    required: true,
  },
];

export default function DocumentUploadStep() {
  const { control, setValue, watch } = useFormContext();
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});

  const handleFileSelect = (fieldName: string, file: File | null, maxSize: number) => {
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
      alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress((prev) => ({ ...prev, [fieldName]: progress }));

      if (progress >= 100) {
        clearInterval(interval);
        setValue(fieldName, file);

        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviews((prev) => ({ ...prev, [fieldName]: reader.result as string }));
          };
          reader.readAsDataURL(file);
        }
      }
    }, 100);
  };

  const removeFile = (fieldName: string) => {
    setValue(fieldName, null);
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fieldName];
      return newProgress;
    });
    setPreviews((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[fieldName];
      return newPreviews;
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Document Upload</h2>
        <p className="text-gray-600 mt-1">Upload required business documents</p>
      </div>

      <div className="space-y-4">
        {DOCUMENTS.map((doc) => {
          const value = watch(doc.fieldName);
          const progress = uploadProgress[doc.fieldName] || 0;
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
                              <span className="font-semibold">Click to upload</span> or drag and
                              drop
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.acceptedFormats.join(', ')} (MAX. {doc.maxSize / (1024 * 1024)}
                              MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept={doc.acceptedFormats.join(',')}
                            onChange={(e) =>
                              handleFileSelect(
                                doc.fieldName,
                                e.target.files?.[0] || null,
                                doc.maxSize
                              )
                            }
                          />
                        </label>
                      ) : (
                        <div className="relative p-4 border-2 border-green-300 rounded-lg bg-green-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
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
                              <div>
                                <p className="font-medium text-gray-900">{(value as File).name}</p>
                                <p className="text-sm text-gray-500">
                                  {((value as File).size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                                {progress > 0 && progress < 100 && (
                                  <Progress value={progress} className="w-32 h-2 mt-2" />
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {preview && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(preview, '_blank')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(doc.fieldName)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {progress === 100 && (
                            <div className="flex items-center gap-2 mt-2 text-green-600">
                              <Check className="w-4 h-4" />
                              <span className="text-sm">Upload complete</span>
                            </div>
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
          <strong>Note:</strong> All documents will be verified by our team. Ensure all documents
          are clear and valid.
        </p>
      </div>
    </div>
  );
}
