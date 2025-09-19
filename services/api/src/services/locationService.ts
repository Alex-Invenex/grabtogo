import { PrismaClient } from '@prisma/client';
import {
  NearbyOffersRequest,
  OfferDiscoveryResult,
  LocationBasedOffer,
  OfferFilter
} from '../types/offer';

const prisma = new PrismaClient();

export class LocationService {

  // Calculate distance between two points using Haversine formula
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get bounding box for efficient database query
  static getBoundingBox(latitude: number, longitude: number, radiusKm: number) {
    const latRadian = this.toRadians(latitude);
    const degLatKm = 110.54; // km per degree of latitude
    const degLonKm = 110.54 * Math.cos(latRadian); // km per degree of longitude

    const deltaLat = radiusKm / degLatKm;
    const deltaLon = radiusKm / degLonKm;

    return {
      minLat: latitude - deltaLat,
      maxLat: latitude + deltaLat,
      minLon: longitude - deltaLon,
      maxLon: longitude + deltaLon
    };
  }

  // Discover nearby offers with advanced filtering
  static async discoverNearbyOffers(
    request: NearbyOffersRequest
  ): Promise<OfferDiscoveryResult> {
    const {
      latitude,
      longitude,
      radius = 10, // default 10km
      category,
      limit = 20,
      offset = 0
    } = request;

    // Get bounding box for initial filtering
    const bbox = this.getBoundingBox(latitude, longitude, radius);

    // Build where clause
    const whereClause: any = {
      isActive: true,
      status: 'ACTIVE',
      validFrom: { lte: new Date() },
      validUntil: { gte: new Date() },
      vendor: {
        isActive: true,
        isApproved: true,
        subscriptionStatus: { in: ['TRIAL', 'ACTIVE'] },
        latitude: {
          gte: bbox.minLat,
          lte: bbox.maxLat
        },
        longitude: {
          gte: bbox.minLon,
          lte: bbox.maxLon
        }
      }
    };

    if (category) {
      whereClause.vendor.categories = {
        has: category
      };
    }

    try {
      // Get offers within bounding box
      const offers = await prisma.offer.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              address: true,
              latitude: true,
              longitude: true,
              averageRating: true,
              totalRatings: true,
              categories: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              images: true
            }
          }
        },
        orderBy: [
          { isFlashDeal: 'desc' },
          { discountPercentage: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      // Calculate exact distances and filter by radius
      const offersWithDistance: LocationBasedOffer[] = offers
        .map(offer => {
          if (!offer.vendor.latitude || !offer.vendor.longitude) {
            return null;
          }

          const distance = this.calculateDistance(
            latitude,
            longitude,
            offer.vendor.latitude,
            offer.vendor.longitude
          );

          if (distance <= radius) {
            return {
              ...offer,
              distance,
              estimatedDeliveryTime: this.estimateDeliveryTime(distance),
              vendor: offer.vendor,
              product: offer.product
            } as LocationBasedOffer;
          }
          return null;
        })
        .filter((offer): offer is LocationBasedOffer => offer !== null)
        .sort((a, b) => {
          // Prioritize flash deals, then by distance
          if (a.isFlashDeal && !b.isFlashDeal) return -1;
          if (!a.isFlashDeal && b.isFlashDeal) return 1;
          return a.distance - b.distance;
        });

      // Apply pagination
      const paginatedOffers = offersWithDistance.slice(offset, offset + limit);

      // Calculate analytics
      const categories = [...new Set(offersWithDistance.map(o => o.product?.category || 'General'))];
      const prices = offersWithDistance.map(o => o.discountedPrice || o.originalPrice);
      const priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };

      return {
        offers: paginatedOffers,
        totalCount: offersWithDistance.length,
        searchRadius: radius,
        searchLocation: { latitude, longitude },
        categories,
        priceRange
      };

    } catch (error) {
      console.error('Nearby offers discovery error:', error);
      throw new Error('Failed to discover nearby offers');
    }
  }

  // Estimate delivery time based on distance
  private static estimateDeliveryTime(distanceKm: number): number {
    // Base time + travel time (assuming 30 km/h average speed)
    const baseTimeMinutes = 15; // preparation time
    const travelTimeMinutes = (distanceKm / 30) * 60;
    return Math.round(baseTimeMinutes + travelTimeMinutes);
  }

  // Get offers by vendor with distance calculation
  static async getVendorOffersWithDistance(
    vendorId: string,
    userLatitude?: number,
    userLongitude?: number
  ): Promise<LocationBasedOffer[]> {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { latitude: true, longitude: true }
    });

    const offers = await prisma.offer.findMany({
      where: {
        vendorId,
        isActive: true,
        status: 'ACTIVE',
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() }
      },
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
            address: true,
            latitude: true,
            longitude: true,
            averageRating: true,
            totalRatings: true,
            categories: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            images: true
          }
        }
      },
      orderBy: [
        { isFlashDeal: 'desc' },
        { discountPercentage: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Add distance if user location is provided
    return offers.map(offer => {
      let distance = 0;
      let estimatedDeliveryTime = 30; // default

      if (userLatitude && userLongitude && vendor?.latitude && vendor?.longitude) {
        distance = this.calculateDistance(
          userLatitude,
          userLongitude,
          vendor.latitude,
          vendor.longitude
        );
        estimatedDeliveryTime = this.estimateDeliveryTime(distance);
      }

      return {
        ...offer,
        distance,
        estimatedDeliveryTime,
        vendor: offer.vendor,
        product: offer.product
      } as LocationBasedOffer;
    });
  }

  // Search offers with advanced filters
  static async searchOffers(filter: OfferFilter): Promise<OfferDiscoveryResult> {
    const {
      category,
      offerType,
      discountType,
      minDiscount,
      maxDiscount,
      isActive = true,
      isFlashDeal,
      search,
      tags,
      latitude,
      longitude,
      radius = 10
    } = filter;

    let whereClause: any = {
      isActive,
      status: 'ACTIVE',
      validFrom: { lte: new Date() },
      validUntil: { gte: new Date() },
      vendor: {
        isActive: true,
        isApproved: true,
        subscriptionStatus: { in: ['TRIAL', 'ACTIVE'] }
      }
    };

    // Add filters
    if (category) {
      whereClause.OR = [
        { product: { category } },
        { vendor: { categories: { has: category } } }
      ];
    }

    if (offerType) {
      whereClause.offerType = offerType;
    }

    if (discountType) {
      whereClause.discountType = discountType;
    }

    if (minDiscount !== undefined) {
      whereClause.discountPercentage = { gte: minDiscount };
    }

    if (maxDiscount !== undefined) {
      whereClause.discountPercentage = { ...whereClause.discountPercentage, lte: maxDiscount };
    }

    if (isFlashDeal !== undefined) {
      whereClause.isFlashDeal = isFlashDeal;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { vendor: { companyName: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (tags && tags.length > 0) {
      whereClause.tags = { hasSome: tags };
    }

    // Add location filter if provided
    if (latitude && longitude) {
      const bbox = this.getBoundingBox(latitude, longitude, radius);
      whereClause.vendor.latitude = {
        gte: bbox.minLat,
        lte: bbox.maxLat
      };
      whereClause.vendor.longitude = {
        gte: bbox.minLon,
        lte: bbox.maxLon
      };
    }

    try {
      const offers = await prisma.offer.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              address: true,
              latitude: true,
              longitude: true,
              averageRating: true,
              totalRatings: true,
              categories: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              images: true
            }
          }
        },
        orderBy: [
          { isFlashDeal: 'desc' },
          { discountPercentage: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      // Calculate distances if location provided
      const offersWithDistance: LocationBasedOffer[] = offers.map(offer => {
        let distance = 0;
        let estimatedDeliveryTime = 30;

        if (latitude && longitude && offer.vendor.latitude && offer.vendor.longitude) {
          distance = this.calculateDistance(
            latitude,
            longitude,
            offer.vendor.latitude,
            offer.vendor.longitude
          );
          estimatedDeliveryTime = this.estimateDeliveryTime(distance);

          // Filter by radius if location-based search
          if (distance > radius) {
            return null;
          }
        }

        return {
          ...offer,
          distance,
          estimatedDeliveryTime,
          vendor: offer.vendor,
          product: offer.product
        } as LocationBasedOffer;
      }).filter((offer): offer is LocationBasedOffer => offer !== null);

      // Calculate analytics
      const categories = [...new Set(offersWithDistance.map(o => o.product?.category || 'General'))];
      const prices = offersWithDistance.map(o => o.discountedPrice || o.originalPrice);
      const priceRange = prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices)
      } : { min: 0, max: 0 };

      return {
        offers: offersWithDistance,
        totalCount: offersWithDistance.length,
        searchRadius: radius,
        searchLocation: latitude && longitude ? { latitude, longitude } : { latitude: 0, longitude: 0 },
        categories,
        priceRange
      };

    } catch (error) {
      console.error('Offer search error:', error);
      throw new Error('Failed to search offers');
    }
  }

  // Get trending offers based on claims and views
  static async getTrendingOffers(
    latitude?: number,
    longitude?: number,
    radius: number = 10,
    limit: number = 10
  ): Promise<LocationBasedOffer[]> {
    let whereClause: any = {
      isActive: true,
      status: 'ACTIVE',
      validFrom: { lte: new Date() },
      validUntil: { gte: new Date() },
      vendor: {
        isActive: true,
        isApproved: true,
        subscriptionStatus: { in: ['TRIAL', 'ACTIVE'] }
      }
    };

    // Add location filter if provided
    if (latitude && longitude) {
      const bbox = this.getBoundingBox(latitude, longitude, radius);
      whereClause.vendor.latitude = {
        gte: bbox.minLat,
        lte: bbox.maxLat
      };
      whereClause.vendor.longitude = {
        gte: bbox.minLon,
        lte: bbox.maxLon
      };
    }

    try {
      const offers = await prisma.offer.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              address: true,
              latitude: true,
              longitude: true,
              averageRating: true,
              totalRatings: true,
              categories: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              images: true
            }
          }
        },
        orderBy: [
          { currentCustomerCount: 'desc' }, // Most claimed offers first
          { discountPercentage: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit * 2 // Get more to filter by distance
      });

      // Calculate distances and filter
      const offersWithDistance: LocationBasedOffer[] = offers
        .map(offer => {
          let distance = 0;
          let estimatedDeliveryTime = 30;

          if (latitude && longitude && offer.vendor.latitude && offer.vendor.longitude) {
            distance = this.calculateDistance(
              latitude,
              longitude,
              offer.vendor.latitude,
              offer.vendor.longitude
            );

            if (distance > radius) {
              return null;
            }

            estimatedDeliveryTime = this.estimateDeliveryTime(distance);
          }

          return {
            ...offer,
            distance,
            estimatedDeliveryTime,
            vendor: offer.vendor,
            product: offer.product
          } as LocationBasedOffer;
        })
        .filter((offer): offer is LocationBasedOffer => offer !== null)
        .slice(0, limit);

      return offersWithDistance;

    } catch (error) {
      console.error('Trending offers error:', error);
      throw new Error('Failed to get trending offers');
    }
  }
}

export default LocationService;