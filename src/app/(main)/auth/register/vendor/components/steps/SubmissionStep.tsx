'use client';

import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { Send, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SubmissionStep() {
  const { watch } = useFormContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<
    'ready' | 'submitting' | 'success' | 'error'
  >('ready');
  const [submissionError, setSubmissionError] = useState('');

  const formData = watch();

  const handleSubmission = async () => {
    setIsSubmitting(true);
    setSubmissionStatus('submitting');
    setSubmissionError('');

    try {
      const response = await fetch('/api/vendor-registration/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit registration');
      }

      setSubmissionStatus('success');
    } catch (error) {
      setSubmissionStatus('error');
      setSubmissionError(error instanceof Error ? error.message : 'Submission failed');
      setIsSubmitting(false);
    }
  };

  if (submissionStatus === 'success') {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-green-900">Application Submitted!</h2>
          <p className="text-gray-600 mt-2">
            Your vendor registration has been submitted for admin review.
          </p>
        </div>
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
          <div className="space-y-2 text-sm text-blue-800 text-left">
            <p>• You will receive a confirmation email within 5 minutes</p>
            <p>• Our admin team will review your application within 24-48 hours</p>
            <p>
              • Once approved, you'll get a <strong>20-day FREE premium trial</strong>
            </p>
            <p>• You will be notified via email once your account is approved</p>
            <p>• No payment required until your trial period ends</p>
          </div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-900">Premium Trial Benefits</span>
          </div>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>✓ Unlimited products and orders</p>
            <p>✓ Advanced analytics dashboard</p>
            <p>✓ Priority customer support</p>
            <p>✓ Enhanced store customization</p>
            <p>✓ Featured listing opportunities</p>
          </div>
        </div>
        <Button onClick={() => (window.location.href = '/auth/login')} className="w-full">
          Continue to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Submit Application</h2>
        <p className="text-gray-600 mt-1">Ready to submit your vendor registration for review</p>
      </div>

      {/* Application Summary */}
      <div className="p-6 bg-gray-50 rounded-lg space-y-4">
        <h3 className="font-semibold text-lg">Application Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
            <div className="space-y-1 text-gray-600">
              <p>
                <strong>Name:</strong> {formData.fullName}
              </p>
              <p>
                <strong>Email:</strong> {formData.email}
              </p>
              <p>
                <strong>Phone:</strong> {formData.phone}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Business Details</h4>
            <div className="space-y-1 text-gray-600">
              <p>
                <strong>Company:</strong> {formData.companyName}
              </p>
              <p>
                <strong>Business Type:</strong> {formData.businessType}
              </p>
              <p>
                <strong>Category:</strong> {formData.businessCategory}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Location</h4>
            <div className="space-y-1 text-gray-600">
              <p>
                <strong>City:</strong> {formData.city}
              </p>
              <p>
                <strong>State:</strong> {formData.state}
              </p>
              <p>
                <strong>PIN Code:</strong> {formData.pinCode}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Package Selection</h4>
            <div className="space-y-1 text-gray-600">
              <p>
                <strong>Package:</strong>{' '}
                {formData.selectedPackage?.charAt(0).toUpperCase() +
                  formData.selectedPackage?.slice(1)}
              </p>
              <p>
                <strong>Billing:</strong>{' '}
                {formData.billingCycle?.charAt(0).toUpperCase() + formData.billingCycle?.slice(1)}
              </p>
              <p className="text-green-600 font-medium">20-day FREE trial included</p>
            </div>
          </div>
        </div>
      </div>

      {/* Free Trial Info */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Great news!</strong> Your registration fee includes a 20-day premium trial. No
          payment required until your trial period ends.
        </AlertDescription>
      </Alert>

      {/* Submission Error */}
      {submissionStatus === 'error' && submissionError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{submissionError}</AlertDescription>
        </Alert>
      )}

      {/* Terms Reminder */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Before You Submit</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>✓ All information provided is accurate and complete</p>
          <p>✓ You have accepted our Terms of Service and Privacy Policy</p>
          <p>✓ You understand this application will be reviewed by our admin team</p>
          <p>✓ You will receive email notifications about your application status</p>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmission}
        disabled={isSubmitting || submissionStatus === 'submitting'}
        className="w-full h-12 text-lg"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Submitting Application...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Submit for Admin Review
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        By submitting this application, you confirm that all information provided is accurate and
        you agree to our Terms of Service.
      </p>
    </div>
  );
}
