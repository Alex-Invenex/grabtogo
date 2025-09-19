export interface Offer {
  id: string;
  vendorId: string;
  productId?: string;
  title: string;
  description: string;
  offerType: OfferType;
  discountType: DiscountType;
  originalPrice: number;
  discountedPrice?: number;
  discountPercentage?: number;
  discountAmount?: number;
  maxCustomersPerDay?: number;
  maxCustomersTotal?: number;
  currentCustomerCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  status: OfferStatus;
  termsAndConditions?: string;
  images: string[];
  location?: OfferLocation;
  tags: string[];
  isFlashDeal: boolean;
  flashDealEndsAt?: Date;
  bogoDetails?: BOGODetails;
  createdAt: Date;
  updatedAt: Date;
  vendor?: VendorInfo;
  product?: ProductInfo;
}

export interface OfferLocation {
  latitude: number;
  longitude: number;
  address: string;
  radius?: number; // in km
}

export interface BOGODetails {
  buyQuantity: number;
  getQuantity: number;
  applicableItems?: string[]; // product IDs
}

export interface VendorInfo {
  id: string;
  companyName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  averageRating?: number;
  totalRatings: number;
  categories: string[];
}

export interface ProductInfo {
  id: string;
  name: string;
  category: string;
  images: string[];
}

// Import Prisma enums
import { OfferType as PrismaOfferType, DiscountType as PrismaDiscountType } from '@prisma/client';

// Re-export for convenience
export type OfferType = PrismaOfferType;
export type DiscountType = PrismaDiscountType;

export enum OfferStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  PAUSED = 'PAUSED',
  SOLD_OUT = 'SOLD_OUT'
}

export interface CreateOfferRequest {
  productId?: string;
  title: string;
  description: string;
  offerType?: OfferType;
  discountType?: DiscountType;
  originalPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  maxCustomersPerDay?: number;
  maxCustomersTotal?: number;
  validFrom: Date;
  validUntil: Date;
  termsAndConditions?: string;
  images?: string[];
  tags?: string[];
  isFlashDeal?: boolean;
  flashDealEndsAt?: Date;
  bogoDetails?: BOGODetails;
}

export interface UpdateOfferRequest {
  title?: string;
  description?: string;
  originalPrice?: number;
  discountPercentage?: number;
  discountAmount?: number;
  maxCustomersPerDay?: number;
  maxCustomersTotal?: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
  termsAndConditions?: string;
  images?: string[];
  tags?: string[];
  isFlashDeal?: boolean;
  flashDealEndsAt?: Date;
  bogoDetails?: BOGODetails;
}

export interface OfferFilter {
  category?: string;
  offerType?: OfferType;
  discountType?: DiscountType;
  minDiscount?: number;
  maxDiscount?: number;
  isActive?: boolean;
  isFlashDeal?: boolean;
  search?: string;
  tags?: string[];
  latitude?: number;
  longitude?: number;
  radius?: number; // in km
}

export interface NearbyOffersRequest {
  latitude: number;
  longitude: number;
  radius?: number; // default 10km
  category?: string;
  limit?: number;
  offset?: number;
}

export interface OfferClaimRequest {
  customerId: string;
  quantity?: number;
}

export interface OfferClaimResponse {
  success: boolean;
  message: string;
  remainingQuantity?: number;
  claimCode?: string;
  redemptionInstructions?: string;
}

export interface LocationBasedOffer extends Offer {
  distance: number; // in km
  estimatedDeliveryTime?: number; // in minutes
}

export interface OfferDiscoveryResult {
  offers: LocationBasedOffer[];
  totalCount: number;
  searchRadius: number;
  searchLocation: {
    latitude: number;
    longitude: number;
  };
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
}

export interface FlashDeal extends Offer {
  timeRemaining: number; // in seconds
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  claimedPercentage: number;
}

export interface OfferAnalytics {
  totalViews: number;
  totalClaims: number;
  conversionRate: number;
  topCategories: { category: string; count: number }[];
  peakHours: { hour: number; claims: number }[];
  averageDistance: number;
}