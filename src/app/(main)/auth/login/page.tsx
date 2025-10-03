'use client';

import * as React from 'react';
import Link from 'next/link';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { signInSchema } from '@/lib/password';

type LoginFormValues = z.infer<typeof signInSchema>;

function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const message = searchParams.get('message');

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  React.useEffect(() => {
    if (message) {
      switch (message) {
        case 'EmailVerified':
          toast({
            title: 'Email Verified!',
            description: 'Your email has been verified successfully. You can now sign in.',
          });
          break;
        case 'AlreadyVerified':
          toast({
            title: 'Already Verified',
            description: 'Your email is already verified. You can sign in normally.',
          });
          break;
        case 'PasswordReset':
          toast({
            title: 'Password Reset Complete',
            description:
              'Your password has been updated. You can now sign in with your new password.',
          });
          break;
        default:
          break;
      }
    }
  }, [message, toast]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Enhanced error handling for different authentication failure scenarios
        const errorMessage = result.error.toLowerCase();

        if (errorMessage.includes('too many')) {
          toast({
            title: 'Account Temporarily Locked',
            description: 'Too many failed login attempts. Please try again later.',
            variant: 'destructive',
          });
        } else if (errorMessage.includes('verify your email')) {
          toast({
            title: 'Email Verification Required',
            description: 'Please verify your email address before signing in.',
            variant: 'destructive',
          });
        } else if (errorMessage.includes('locked')) {
          toast({
            title: 'Account Locked',
            description: 'Your account has been locked due to multiple failed attempts.',
            variant: 'destructive',
          });
        } else if (errorMessage.includes('inactive')) {
          toast({
            title: 'Account Inactive',
            description: 'Your account is inactive. Please contact support.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Login Failed',
            description: 'Invalid email or password',
            variant: 'destructive',
          });
        }
      } else {
        // Get session to check user role and redirect accordingly
        const session = await getSession();
        const userRole = session?.user?.role as string | undefined;

        toast({
          title: 'Welcome back!',
          description: 'Login successful',
        });

        // Redirect based on user role
        switch (userRole) {
          case 'ADMIN':
            router.push('/admin');
            break;
          case 'VENDOR':
            router.push('/vendor/dashboard');
            break;
          default:
            router.push('/');
        }
      }
    } catch {
      toast({
        title: 'Network Error',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex min-h-screen w-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white py-12">
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
        <div className="flex flex-col space-y-3 text-center">
          <div className="mx-auto h-20 w-20 mb-2 flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="GrabtoGo Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-600">
            Enter your email and password to sign in to your account
          </p>
        </div>

        {message && (message === 'EmailVerified' || message === 'PasswordReset') && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {message === 'EmailVerified' &&
                'Your email has been verified! You can now sign in to your account.'}
              {message === 'PasswordReset' &&
                'Your password has been reset successfully! You can now sign in with your new password.'}
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl text-center font-display font-bold text-gray-900">
              Login
            </CardTitle>
            <CardDescription className="text-center text-sm text-gray-600">
              Sign in to your GrabtoGo account
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="john@example.com"
                          type="email"
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect="off"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter your password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            disabled={isLoading}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {showPassword ? 'Hide password' : 'Show password'}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center text-sm">
              <Link
                href="/auth/forgot-password"
                className="text-gray-600 hover:text-primary font-medium transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">Don&apos;t have an account? </span>
              <Link
                href="/auth/register"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
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
      <LoginForm />
    </Suspense>
  );
}
