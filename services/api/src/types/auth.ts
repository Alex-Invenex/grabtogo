import { UserRole } from '@prisma/client';

export interface RegisterRequest {
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  // Customer specific fields
  firstName?: string;
  lastName?: string;
  // Vendor specific fields
  companyName?: string;
  gstNumber?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  categories?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  vendor?: {
    id: string;
    companyName: string;
    gstNumber?: string | null;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
    subscriptionStatus: string;
    trialEndsAt?: Date | null;
    isApproved: boolean;
    registrationFeePaid: boolean;
    averageRating?: number | null;
    totalRatings: number;
    isActive: boolean;
    businessHours?: any;
    categories: string[];
  } | null;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
    isActive: boolean;
  } | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token?: string;
    user: AuthUser;
  };
  error?: string;
}