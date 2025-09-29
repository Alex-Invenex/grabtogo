'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

type TokenState = 'validating' | 'valid' | 'invalid' | 'expired'

interface PasswordStrength {
  score: number
  feedback: string[]
  color: string
}

export default function ResetPasswordPage() {
  const [tokenState, setTokenState] = useState<TokenState>('validating')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: 'bg-gray-200'
  })

  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setTokenState('invalid')
      return
    }

    validateToken(token)
  }, [token])

  const validateToken = async (resetToken: string) => {
    try {
      const response = await fetch(`/api/auth/reset-password?token=${resetToken}`)
      const data = await response.json()

      if (response.ok) {
        setTokenState('valid')
        setEmail(data.email || '')
      } else {
        if (data.error?.includes('expired')) {
          setTokenState('expired')
        } else {
          setTokenState('invalid')
        }
      }
    } catch (error) {
      setTokenState('invalid')
    }
  }

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    let score = 0
    const feedback: string[] = []

    if (pwd.length >= 8) score += 1
    else feedback.push('At least 8 characters')

    if (/[A-Z]/.test(pwd)) score += 1
    else feedback.push('One uppercase letter')

    if (/[a-z]/.test(pwd)) score += 1
    else feedback.push('One lowercase letter')

    if (/\d/.test(pwd)) score += 1
    else feedback.push('One number')

    if (/[^A-Za-z0-9]/.test(pwd)) score += 1
    else feedback.push('One special character')

    let color = 'bg-red-500'
    if (score >= 3) color = 'bg-yellow-500'
    if (score >= 4) color = 'bg-green-500'

    return { score, feedback, color }
  }

  useEffect(() => {
    if (password) {
      setPasswordStrength(calculatePasswordStrength(password))
    } else {
      setPasswordStrength({ score: 0, feedback: [], color: 'bg-gray-200' })
    }
  }, [password])

  const validatePasswords = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {}

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Password is too weak. Please follow the requirements.'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePasswords()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        toast({
          title: 'Password Reset Successful',
          description: 'Your password has been updated. You can now log in.',
        })

        setTimeout(() => {
          router.push('/auth/login?message=PasswordReset')
        }, 3000)
      } else {
        if (response.status === 400) {
          if (data.error?.includes('expired')) {
            setTokenState('expired')
          } else if (data.error?.includes('Invalid')) {
            setTokenState('invalid')
          } else {
            toast({
              title: 'Validation Error',
              description: data.error || 'Please check your input and try again.',
              variant: 'destructive',
            })
          }
        } else {
          toast({
            title: 'Error',
            description: 'Failed to reset password. Please try again.',
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      toast({
        title: 'Network Error',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderContent = () => {
    switch (tokenState) {
      case 'validating':
        return (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Validating Reset Link</h2>
            <p className="text-muted-foreground">
              Please wait while we validate your reset link...
            </p>
          </div>
        )

      case 'valid':
        if (isSuccess) {
          return (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h2 className="text-xl font-semibold mb-2 text-green-800">Password Reset!</h2>
              <p className="text-muted-foreground mb-4">
                Your password has been successfully updated.
              </p>
              <Alert className="mb-4">
                <AlertDescription>
                  You will be redirected to the login page in a few seconds...
                </AlertDescription>
              </Alert>
              <Button asChild>
                <Link href="/auth/login">Continue to Login</Link>
              </Button>
            </div>
          )
        }

        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            {email && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Resetting password for: <strong>{email}</strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Strength:</span>
                    <Progress
                      value={(passwordStrength.score / 5) * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-sm font-medium">
                      {passwordStrength.score < 3 ? 'Weak' : passwordStrength.score < 5 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {passwordStrength.feedback.map((item, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || passwordStrength.score < 3}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </form>
        )

      case 'expired':
        return (
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <h2 className="text-xl font-semibold mb-2 text-orange-800">Reset Link Expired</h2>
            <p className="text-muted-foreground mb-4">
              This password reset link has expired.
            </p>
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>
                Password reset links expire after 1 hour for security reasons.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/forgot-password">Request New Reset Link</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/login">Back to Login</Link>
              </Button>
            </div>
          </div>
        )

      case 'invalid':
      default:
        return (
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold mb-2 text-red-800">Invalid Reset Link</h2>
            <p className="text-muted-foreground mb-4">
              This password reset link is invalid or has already been used.
            </p>
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>
                Please request a new password reset link to continue.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/forgot-password">Request New Reset Link</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/login">Back to Login</Link>
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a new secure password for your account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Reset Your Password</CardTitle>
            <CardDescription className="text-center">
              {tokenState === 'valid' && !isSuccess
                ? 'Enter your new password below'
                : tokenState === 'validating'
                ? 'Validating your reset link...'
                : 'Password reset verification'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>

        <div className="text-center text-sm">
          <Link
            href="/auth/login"
            className="text-muted-foreground hover:text-primary"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}