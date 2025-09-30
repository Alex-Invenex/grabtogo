import { UserRole } from '@/lib/prisma'

declare module 'next-auth' {
  interface User {
    role?: UserRole
    emailVerified?: Date | null
  }

  interface Session {
    user: {
      id: string
      role?: UserRole
      emailVerified?: Date | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole
    emailVerified?: Date | null
  }
}