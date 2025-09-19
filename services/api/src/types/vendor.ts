import { PlanType, SubscriptionStatus } from '@prisma/client';

export interface VendorProfile {
  id: string;
  companyName: string;
  gstNumber?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: Date;
  isApproved: boolean;
  registrationFeePaid: boolean;
  averageRating?: number;
  totalRatings: number;
  isActive: boolean;
  businessHours?: BusinessHours;
  categories: string[];
  documents?: VendorDocument[];
  subscription?: VendorSubscription;
}

export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // "09:00"
  closeTime?: string; // "22:00"
  breaks?: TimeBreak[];
}

export interface TimeBreak {
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface VendorDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  status: DocumentStatus;
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewComments?: string;
}

export enum DocumentType {
  GST_CERTIFICATE = 'GST_CERTIFICATE',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  FSSAI_LICENSE = 'FSSAI_LICENSE',
  BANK_STATEMENT = 'BANK_STATEMENT',
  IDENTITY_PROOF = 'IDENTITY_PROOF',
  ADDRESS_PROOF = 'ADDRESS_PROOF'
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface VendorSubscription {
  id: string;
  planType: PlanType;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  amount: number;
  currency: string;
  billingCycle: string;
  razorpaySubscriptionId?: string;
  nextBillingDate?: Date;
  autoRenewal: boolean;
}

export interface UpdateVendorProfileRequest {
  companyName?: string;
  gstNumber?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  businessHours?: BusinessHours;
  categories?: string[];
}

export interface DocumentUploadRequest {
  type: DocumentType;
  fileName: string;
  fileUrl: string;
}

export interface VendorApprovalRequest {
  isApproved: boolean;
  comments?: string;
}