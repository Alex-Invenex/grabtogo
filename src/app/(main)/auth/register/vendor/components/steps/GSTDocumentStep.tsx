'use client';

import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import {
  Eye,
  Shield,
  Info,
  Loader2,
  CheckCircle,
  MapPin,
  Calendar,
  FileText,
  Upload,
  X,
  Check,
  XCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { verifyGST, getStateFromGST } from '../../lib/gstVerification';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function GSTDocumentStep() {
  const { control, setValue, watch } = useFormContext();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');

  const gstNumber = watch('gstNumber');
  const gstVerified = watch('gstVerified');
  const gstDetails = watch('gstDetails');
  const gstCertificate = watch('gstCertificate');

  const handleVerifyGST = async () => {
    if (!gstNumber) return;

    setIsVerifying(true);
    setVerificationError('');

    try {
      const details = await verifyGST(gstNumber);

      if (details) {
        setValue('gstVerified', true);
        setValue('gstDetails', details);
      } else {
        setVerificationError('Unable to verify GST number. Please check and try again.');
        setValue('gstVerified', false);
        setValue('gstDetails', null);
      }
    } catch {
      setVerificationError('Verification failed. Please try again later.');
      setValue('gstVerified', false);
      setValue('gstDetails', null);
    } finally {
      setIsVerifying(false);
    }
  };

  const formatGSTInput = (value: string) => {
    return value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setValue('gstCertificate', null);
      setPreview(null);
      setUploadProgress(0);
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

    // Validate file size
    if (file.size > maxSize) {
      setUploadError(
        `File size must be less than 5MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      );
      return;
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a PDF, JPG, or PNG file only.');
      return;
    }

    setUploadError('');

    // Simulate realistic upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Random progress between 5-20% each time
      setUploadProgress(Math.min(progress, 100));

      if (progress >= 100) {
        clearInterval(interval);
        setValue('gstCertificate', file);

        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          setPreview(null); // PDF files don&apos;t show preview
        }
      }
    }, 200);
  };

  const removeFile = () => {
    setValue('gstCertificate', null);
    setPreview(null);
    setUploadProgress(0);
    setUploadError('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">GST Verification & Document</h2>
        <p className="text-gray-600 mt-1">Verify your GST details and upload certificate</p>
      </div>

      {/* GST Verification Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-lg font-medium text-primary">
          <Shield className="w-5 h-5" />
          <span>Step 1: GST Verification</span>
        </div>

        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary/80">
            GST verification is mandatory for vendor registration. Your GST number will be verified
            with government records.
          </AlertDescription>
        </Alert>

        <FormField
          control={control}
          name="gstNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                GST Number
              </FormLabel>
              <FormControl>
                <div className="flex gap-3">
                  <Input
                    placeholder="22AAAAA0000A1Z5"
                    {...field}
                    onChange={(e) => field.onChange(formatGSTInput(e.target.value))}
                    className="h-12 font-mono uppercase text-lg"
                    maxLength={15}
                  />
                  <Button
                    type="button"
                    variant={gstVerified ? 'default' : 'outline'}
                    onClick={handleVerifyGST}
                    disabled={!gstNumber || gstNumber.length !== 15 || isVerifying}
                    className="px-6 h-12"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Verifying
                      </>
                    ) : gstVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verified
                      </>
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
              <p className="text-sm text-gray-500">Format: 22AAAAA0000A1Z5 (15 characters)</p>
              {gstNumber && gstNumber.length >= 2 && (
                <p className="text-sm text-primary font-medium">
                  State: {getStateFromGST(gstNumber)}
                </p>
              )}
            </FormItem>
          )}
        />

        {verificationError && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{verificationError}</AlertDescription>
          </Alert>
        )}

        {gstVerified && gstDetails && (
          <div className="p-6 bg-green-50 rounded-xl border border-green-200 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="font-semibold text-green-900 text-lg">
                GST Verified Successfully
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Legal Business Name</label>
                <p className="mt-1 font-semibold text-gray-900">{gstDetails.legalBusinessName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Trade Name</label>
                <p className="mt-1 font-semibold text-gray-900">{gstDetails.tradeName}</p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Business Address
                </label>
                <p className="mt-1 font-semibold text-gray-900">{gstDetails.businessAddress}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">GST Status</label>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      gstDetails.gstStatus === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {gstDetails.gstStatus}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Registration Date
                </label>
                <p className="mt-1 font-semibold text-gray-900">
                  {new Date(gstDetails.registrationDate).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-green-200">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Your GST details have been verified and saved
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Document Upload Section */}
      {gstVerified && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-lg font-medium text-primary">
            <FileText className="w-5 h-5" />
            <span>Step 2: Upload GST Certificate</span>
          </div>

          <FormField
            control={control}
            name="gstCertificate"
            render={() => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  GST Certificate <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    {!gstCertificate ? (
                      <label
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 mb-3 text-primary" />
                          <p className="mb-2 text-sm text-gray-700">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PDF, JPG, PNG (MAX. 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                        />
                      </label>
                    ) : (
                      <div className="relative p-4 border-2 border-green-300 rounded-xl bg-green-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {preview ? (
                              <img
                                src={preview}
                                alt="GST Certificate"
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <FileText className="w-8 h-8 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {(gstCertificate as File).name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {((gstCertificate as File).size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                              {uploadProgress > 0 && uploadProgress < 100 && (
                                <Progress value={uploadProgress} className="w-40 h-2 mt-2" />
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
                              onClick={removeFile}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {uploadProgress === 100 && (
                          <div className="flex items-center gap-2 mt-3 text-green-600">
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">Upload complete</span>
                          </div>
                        )}
                      </div>
                    )}

                    {uploadError && (
                      <Alert className="border-red-200 bg-red-50">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{uploadError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-primary/80">
              <strong>Note:</strong> Upload a clear copy of your GST certificate. This document will
              be verified by our team to ensure authenticity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
