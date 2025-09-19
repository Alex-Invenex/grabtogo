export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  category: string;
  images: string[];
  basePrice?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  vendor?: {
    id: string;
    companyName: string;
    address: string;
    latitude?: number;
    longitude?: number;
    categories: string[];
    averageRating?: number;
  };
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  category: string;
  basePrice?: number;
  images?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  isActive?: boolean;
}

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isActive?: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  alt?: string;
  order: number;
  createdAt: Date;
}

export const PRODUCT_CATEGORIES = [
  'Indian',
  'Chinese',
  'Italian',
  'Mexican',
  'Thai',
  'Japanese',
  'Fast Food',
  'Pizza',
  'Burgers',
  'Beverages',
  'Desserts',
  'Healthy',
  'Vegan',
  'Vegetarian',
  'Snacks',
  'Coffee',
  'Tea',
  'Smoothies',
  'Ice Cream',
  'Bakery'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];