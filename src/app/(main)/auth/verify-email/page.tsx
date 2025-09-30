'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Mail, XCircle } from 'lucide-react';
import { Suspense } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

type VerificationState = 'loading' | 'success' | 'error' | 'expired' | 'invalid';

function VerifyEmailForm() {
  const [state, setState] = React.useState<VerificationState>('loading');
  const [message, setMessage] = React.useState('');
  const [isResending, setIsResending] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState('');

  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const token = searchParams.get('token');

  React.useEffect(() => {
    if (!token) {
      setState('invalid');
      setMessage('No verification token provided');
      return;
    }

    verifyToken(token);
  }, [token]);

  const verifyToken = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setState('success');
        setMessage('Your email has been verified successfully!');
        setUserEmail(data.user?.email || '');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login?message=EmailVerified');
        }, 3000);
      } else {
        if (response.status === 400) {
          if (data.error.includes('expired')) {
            setState('expired');
            setMessage('The verification link has expired');
          } else if (data.error.includes('already verified')) {
            setState('success');
            setMessage('Your email is already verified');
            setTimeout(() => {
              router.push('/auth/login?message=AlreadyVerified');
            }, 2000);
          } else {
            setState('invalid');
            setMessage(data.error || 'Invalid verification token');
          }
        } else {
          setState('error');
          setMessage('Verification failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setState('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  const resendVerification = async () => {
    if (!userEmail) {
      toast({
        title: 'Email Required',
        description: 'Please provide your email address to resend verification',
        variant: 'destructive',
      });
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Verification Email Sent',
          description: 'Please check your inbox for a new verification link',
        });
        setState('loading');
        setMessage('New verification email sent. Please check your inbox.');
      } else {
        toast({
          title: 'Failed to Resend',
          description: data.error || 'Failed to send verification email',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Verifying your email...</h2>
            <p className="text-muted-foreground">Please wait while we verify your email address.</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold mb-2 text-green-800">Email Verified!</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            <Alert className="mb-4">
              <AlertDescription>
                You will be redirected to the login page in a few seconds...
              </AlertDescription>
            </Alert>
            <Button asChild>
              <Link href="/auth/login">Continue to Login</Link>
            </Button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <h2 className="text-xl font-semibold mb-2 text-orange-800">Link Expired</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            <Alert className="mb-4">
              <AlertDescription>
                Verification links expire after 24 hours for security reasons.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button onClick={resendVerification} disabled={isResending} className="w-full">
                {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Mail className="mr-2 h-4 w-4" />
                Resend Verification Email
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/login">Back to Login</Link>
              </Button>
            </div>
          </div>
        );

      case 'invalid':
      case 'error':
      default:
        return (
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold mb-2 text-red-800">Verification Failed</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>
                The verification link is invalid or has been used already.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button onClick={resendVerification} disabled={isResending} className="w-full">
                {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Mail className="mr-2 h-4 w-4" />
                Resend Verification Email
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/register">Create New Account</Link>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Email Verification</h1>
          <p className="text-sm text-muted-foreground">Verifying your GrabtoGo account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Verify Email Address</CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}

            {(state === 'expired' || state === 'error') && (
              <div className="mt-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm">
          <Link href="/auth/login" className="text-muted-foreground hover:text-primary">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
