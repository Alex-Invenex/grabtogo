import type {
  User,
  Product,
  Category,
  Order,
  VendorProfile,
  Address,
  CartItem,
  Review,
  UserRole,
  OrderStatus,
  PaymentStatus,
} from '../lib/prisma';

// Extended types with relations
export interface ProductWithDetails extends Product {
  vendor: User;
  category: Category;
  images: { id: string; url: string; altText?: string }[];
  reviews: Review[];
  _count: {
    reviews: number;
  };
}

export interface OrderWithDetails extends Order {
  user: User;
  items: Array<{
    id: string;
    product: Product;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
  shippingAddress: Address;
  billingAddress: Address;
  payments: Array<{
    id: string;
    status: PaymentStatus;
    amount: number;
    method?: string;
  }>;
}

export interface UserWithProfile extends User {
  vendorProfile?: VendorProfile;
  addresses: Address[];
}

export interface CartItemWithProduct extends CartItem {
  product: ProductWithDetails;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Search and Filter types
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  vendor?: string;
  search?: string;
  sortBy?: 'price' | 'name' | 'created' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

// Form types
export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export interface VendorOnboardingData {
  storeName: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  businessLicense?: string;
  taxId?: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  shortDesc?: string;
  categoryId: string;
  price: number;
  comparePrice?: number;
  quantity: number;
  weight?: number;
  dimensions?: string;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
}

export interface AddressFormData {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  type: 'shipping' | 'billing';
  isDefault: boolean;
}

// Payment types
export interface RazorpayOrderData {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Utility types
export type { UserRole, OrderStatus, PaymentStatus };
