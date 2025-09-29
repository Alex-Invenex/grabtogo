'use client'

import * as React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-states'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireAuth?: boolean
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  allowedRoles = [],
  requireAuth = true,
  fallback
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !session) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to be signed in to access this page.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/auth/login')}
              className="flex-1"
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/auth/register')}
              className="flex-1"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If specific roles are required, check user role
  if (allowedRoles.length > 0 && session) {
    const userRole = (session.user as any)?.role as UserRole

    if (!userRole || !allowedRoles.includes(userRole)) {
      return fallback || (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You don&apos;t have permission to access this page.
                {userRole && (
                  <span className="block mt-2 text-sm">
                    Current role: {userRole}. Required: {allowedRoles.join(', ')}.
                  </span>
                )}
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      )
    }
  }

  // If all checks pass, render children
  return <>{children}</>
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  const AuthenticatedComponent = (props: P) => {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    )
  }

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`

  return AuthenticatedComponent
}

// Hooks for checking authentication and roles
export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    role: (session?.user as any)?.role as UserRole | undefined,
  }
}

export function useRole() {
  const { role } = useAuth()

  return {
    role,
    isCustomer: role === 'CUSTOMER',
    isVendor: role === 'VENDOR',
    isAdmin: role === 'ADMIN',
    hasRole: (requiredRole: UserRole) => role === requiredRole,
    hasAnyRole: (requiredRoles: UserRole[]) => role ? requiredRoles.includes(role) : false,
  }
}