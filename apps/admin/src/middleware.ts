import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login']

  // Check if the current path is a public route
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // For protected routes, check authentication in the browser
  // Since we can't access localStorage in middleware, we'll handle auth client-side
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}