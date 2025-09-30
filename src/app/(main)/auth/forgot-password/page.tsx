'use client'

import * as React from 'react'
import { useState } from 'react'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<{ email?: string }>({})

  const { toast } = useToast()

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address'
    }
    return undefined
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailError = validateEmail(email)
    if (emailError) {
      setErrors({ email: emailError })
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        toast({
          title: 'Reset Email Sent',
          description: 'Please check your inbox for password reset instructions',
        })
      } else {
        if (response.status === 429) {
          toast({
            title: 'Too Many Requests',
            description: data.message || 'Please wait before requesting another reset',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Something went wrong. Please try again.',
            variant: 'destructive',
          })
        }
      }
    } catch {
      toast({
        title: 'Network Error',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Check Your Email
            </h1>
            <p className="text-sm text-muted-foreground">
              Password reset instructions sent
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Email Sent</CardTitle>
              <CardDescription className="text-center">
                We&apos;ve sent password reset instructions to your email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h2 className="text-xl font-semibold mb-2 text-green-800">Instructions Sent!</h2>
                <p className="text-muted-foreground mb-4">
                  We&apos;ve sent password reset instructions to {email}
                </p>
                <Alert className="mb-4">
                  <AlertDescription>
                    If you don&apos;t see the email, check your spam folder. The reset link will expire in 1 hour.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setIsSubmitted(false)
                      setEmail('')
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Send Another Email
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/auth/login">Back to Login</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive reset instructions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Instructions
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm space-y-2">
          <Link
            href="/auth/login"
            className="text-muted-foreground hover:text-primary flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
          <div>
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="text-primary hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}