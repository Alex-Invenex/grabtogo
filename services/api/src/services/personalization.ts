import { PrismaClient, ActivityType } from '@prisma/client';
import NotificationService from './notifications';

const prisma = new PrismaClient();

interface PersonalizationData {
  preferredCategories: string[];
  averageOrderValue: number;
  favoriteVendors: string[];
  searchPatterns: string[];
  visitFrequency: number;
  loyaltyScore: number;
  priceRange: { min: number; max: number };
}

class PersonalizationService {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  // Analyze customer behavior and update preferences
  async analyzeCustomerBehavior(customerId: string): Promise<PersonalizationData> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 100
          },
          favorites: {
            include: {
              vendor: {
                select: {
                  id: true,
                  companyName: true,
                  categories: true
                }
              }
            }
          },
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 50
          },
          loyaltyPoints: {
            where: { isUsed: false }
          }
        }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Analyze preferred categories
      const categoryActivity = this.analyzeCategoryPreferences(customer.activities);
      const vendorCategories = customer.favorites.flatMap(fav => fav.vendor.categories);
      const preferredCategories = this.mergeAndRankCategories(categoryActivity, vendorCategories);

      // Calculate average order value
      const averageOrderValue = customer.orders.length > 0
        ? customer.orders.reduce((sum, order) => sum + order.finalAmount, 0) / customer.orders.length
        : 0;

      // Get favorite vendors
      const favoriteVendors = customer.favorites.map(fav => fav.vendor.id);

      // Analyze search patterns
      const searchPatterns = this.analyzeSearchPatterns(customer.activities);

      // Calculate visit frequency (activities per week)
      const visitFrequency = this.calculateVisitFrequency(customer.activities);

      // Calculate loyalty score
      const loyaltyScore = this.calculateLoyaltyScore(customer);

      // Determine price range preferences
      const priceRange = this.analyzePriceRange(customer.orders);

      const personalizationData: PersonalizationData = {
        preferredCategories,
        averageOrderValue,
        favoriteVendors,
        searchPatterns,
        visitFrequency,
        loyaltyScore,
        priceRange
      };

      // Update customer preferences
      await this.updateCustomerPreferences(customerId, personalizationData);

      return personalizationData;

    } catch (error) {
      console.error('Analyze customer behavior error:', error);
      throw error;
    }
  }

  private analyzeCategoryPreferences(activities: any[]): Record<string, number> {
    const categoryCount: Record<string, number> = {};

    activities.forEach(activity => {
      if (activity.metadata && activity.metadata.category) {
        const category = activity.metadata.category;
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });

    return categoryCount;
  }

  private mergeAndRankCategories(
    activityCategories: Record<string, number>,
    vendorCategories: string[]
  ): string[] {
    const categoryScores: Record<string, number> = {};

    // Weight from activities
    Object.entries(activityCategories).forEach(([category, count]) => {
      categoryScores[category] = (categoryScores[category] || 0) + count * 2;
    });

    // Weight from favorite vendors
    vendorCategories.forEach(category => {
      categoryScores[category] = (categoryScores[category] || 0) + 5;
    });

    // Sort by score and return top categories
    return Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([category]) => category);
  }

  private analyzeSearchPatterns(activities: any[]): string[] {
    const searchTerms: Record<string, number> = {};

    activities
      .filter(activity => activity.activityType === 'SEARCH')
      .forEach(activity => {
        if (activity.metadata && activity.metadata.searchTerm) {
          const term = activity.metadata.searchTerm.toLowerCase();
          searchTerms[term] = (searchTerms[term] || 0) + 1;
        }
      });

    return Object.entries(searchTerms)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([term]) => term);
  }

  private calculateVisitFrequency(activities: any[]): number {
    if (activities.length === 0) return 0;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentActivities = activities.filter(
      activity => new Date(activity.createdAt) >= oneWeekAgo
    );

    return recentActivities.length;
  }

  private calculateLoyaltyScore(customer: any): number {
    let score = 0;

    // Base score from orders
    score += customer.orders.length * 10;

    // Score from loyalty points
    const totalPoints = customer.loyaltyPoints.reduce((sum: number, point: any) => sum + point.points, 0);
    score += totalPoints;

    // Score from favorites
    score += customer.favorites.length * 5;

    // Score from reviews (if any)
    // This would need to be added if you track reviews

    return Math.min(score, 1000); // Cap at 1000
  }

  private analyzePriceRange(orders: any[]): { min: number; max: number } {
    if (orders.length === 0) {
      return { min: 0, max: 1000 };
    }

    const amounts = orders.map(order => order.finalAmount).sort((a, b) => a - b);
    const q1 = amounts[Math.floor(amounts.length * 0.25)];
    const q3 = amounts[Math.floor(amounts.length * 0.75)];

    return {
      min: Math.max(0, q1 - (q3 - q1) * 0.5),
      max: q3 + (q3 - q1) * 0.5
    };
  }

  private async updateCustomerPreferences(
    customerId: string,
    data: PersonalizationData
  ): Promise<void> {
    try {
      await prisma.customerPreference.upsert({
        where: { customerId },
        update: {
          preferredCategories: data.preferredCategories,
          priceRangeMin: data.priceRange.min,
          priceRangeMax: data.priceRange.max,
          notificationSettings: {
            push: true,
            email: data.loyaltyScore > 100, // Email for loyal customers
            sms: false
          }
        },
        create: {
          customerId,
          preferredCategories: data.preferredCategories,
          priceRangeMin: data.priceRange.min,
          priceRangeMax: data.priceRange.max,
          notificationSettings: {
            push: true,
            email: data.loyaltyScore > 100,
            sms: false
          }
        }
      });
    } catch (error) {
      console.error('Update customer preferences error:', error);
    }
  }

  // Award daily check-in points
  async awardDailyCheckIn(customerId: string): Promise<{ points: number; message: string }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already checked in today
      const existingCheckIn = await prisma.customerActivity.findFirst({
        where: {
          customerId,
          activityType: 'CHECK_IN',
          createdAt: { gte: today }
        }
      });

      if (existingCheckIn) {
        return { points: 0, message: 'Already checked in today!' };
      }

      // Calculate consecutive days
      const consecutiveDays = await this.getConsecutiveCheckInDays(customerId);
      let points = 10; // Base points

      // Bonus for consecutive days
      if (consecutiveDays >= 7) points += 20; // Weekly bonus
      else if (consecutiveDays >= 3) points += 10; // 3-day streak bonus

      // Award points
      await prisma.loyaltyPoint.create({
        data: {
          customerId,
          points,
          reason: `daily_checkin_day_${consecutiveDays + 1}`,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      });

      // Log activity
      await prisma.customerActivity.create({
        data: {
          customerId,
          activityType: 'CHECK_IN',
          metadata: {
            consecutiveDays: consecutiveDays + 1,
            pointsAwarded: points
          }
        }
      });

      let message = `Earned ${points} points!`;
      if (consecutiveDays >= 6) {
        message += ` 🔥 Weekly streak bonus!`;
      } else if (consecutiveDays >= 2) {
        message += ` 📈 ${consecutiveDays + 1} day streak!`;
      }

      return { points, message };

    } catch (error) {
      console.error('Award daily check-in error:', error);
      throw error;
    }
  }

  private async getConsecutiveCheckInDays(customerId: string): Promise<number> {
    const checkIns = await prisma.customerActivity.findMany({
      where: {
        customerId,
        activityType: 'CHECK_IN'
      },
      orderBy: { createdAt: 'desc' },
      take: 30 // Look at last 30 days
    });

    let consecutiveDays = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const checkIn of checkIns) {
      const checkInDate = new Date(checkIn.createdAt);
      checkInDate.setHours(0, 0, 0, 0);

      // Check if this check-in is for yesterday
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);

      if (checkInDate.getTime() === yesterday.getTime()) {
        consecutiveDays++;
        currentDate = yesterday;
      } else {
        break;
      }
    }

    return consecutiveDays;
  }

  // Generate personalized offer recommendations
  async getPersonalizedOffers(
    customerId: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          preferences: true,
          favorites: true,
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 50
          }
        }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const preferences = customer.preferences;
      const favoriteVendorIds = customer.favorites.map(fav => fav.vendorId);

      // Build recommendation query
      const whereClause: any = {
        isActive: true,
        status: 'ACTIVE',
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
        vendor: {
          isActive: true,
          isApproved: true
        }
      };

      // Prioritize offers from favorite vendors
      const favoriteVendorOffers = favoriteVendorIds.length > 0 ? await prisma.offer.findMany({
        where: {
          ...whereClause,
          vendorId: { in: favoriteVendorIds }
        },
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              categories: true,
              averageRating: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        },
        take: Math.floor(limit * 0.6), // 60% from favorites
        orderBy: { discountPercentage: 'desc' }
      }) : [];

      // Get offers from preferred categories
      const categoryOffers = preferences?.preferredCategories ? await prisma.offer.findMany({
        where: {
          ...whereClause,
          vendorId: { notIn: favoriteVendorIds },
          OR: [
            { product: { category: { in: preferences.preferredCategories } } },
            { vendor: { categories: { hasSome: preferences.preferredCategories } } }
          ]
        },
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              categories: true,
              averageRating: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        },
        take: Math.floor(limit * 0.4), // 40% from preferred categories
        orderBy: { discountPercentage: 'desc' }
      }) : [];

      // Combine and deduplicate
      const allOffers = [...favoriteVendorOffers, ...categoryOffers];
      const uniqueOffers = allOffers.filter((offer, index, self) =>
        index === self.findIndex(o => o.id === offer.id)
      );

      // Score and sort offers
      const scoredOffers = uniqueOffers.map(offer => ({
        ...offer,
        personalizedScore: this.calculateOfferScore(offer, customer, preferences)
      }));

      return scoredOffers
        .sort((a, b) => b.personalizedScore - a.personalizedScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Get personalized offers error:', error);
      throw error;
    }
  }

  private calculateOfferScore(offer: any, customer: any, preferences: any): number {
    let score = 0;

    // Base score from discount
    score += offer.discountPercentage || 0;

    // Bonus for favorite vendor
    const isFavoriteVendor = customer.favorites.some((fav: any) => fav.vendorId === offer.vendorId);
    if (isFavoriteVendor) score += 50;

    // Bonus for preferred category
    if (preferences?.preferredCategories?.includes(offer.product?.category)) {
      score += 30;
    }

    // Bonus for vendor categories match
    if (preferences?.preferredCategories?.some((cat: string) =>
      offer.vendor.categories.includes(cat)
    )) {
      score += 20;
    }

    // Bonus for price range
    const price = offer.discountedPrice || offer.originalPrice;
    if (preferences?.priceRangeMin && preferences?.priceRangeMax) {
      if (price >= preferences.priceRangeMin && price <= preferences.priceRangeMax) {
        score += 25;
      }
    }

    // Bonus for high-rated vendors
    if (offer.vendor.averageRating >= 4.5) score += 15;
    else if (offer.vendor.averageRating >= 4.0) score += 10;

    // Bonus for flash deals
    if (offer.isFlashDeal) score += 20;

    return score;
  }

  // Track customer engagement
  async trackEngagement(customerId: string, engagementData: {
    action: string;
    offerId?: string;
    vendorId?: string;
    productId?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      let activityType: ActivityType;

      switch (engagementData.action) {
        case 'offer_view':
          activityType = 'OFFER_VIEW';
          break;
        case 'offer_claim':
          activityType = 'OFFER_CLAIM';
          break;
        case 'product_view':
          activityType = 'PRODUCT_VIEW';
          break;
        case 'vendor_visit':
          activityType = 'VENDOR_VISIT';
          break;
        case 'search':
          activityType = 'SEARCH';
          break;
        case 'category_browse':
          activityType = 'CATEGORY_BROWSE';
          break;
        default:
          activityType = 'OFFER_VIEW';
      }

      await prisma.customerActivity.create({
        data: {
          customerId,
          activityType,
          vendorId: engagementData.vendorId,
          offerId: engagementData.offerId,
          productId: engagementData.productId,
          metadata: engagementData.metadata || {}
        }
      });

      // Trigger behavior analysis periodically
      const activityCount = await prisma.customerActivity.count({
        where: { customerId }
      });

      // Re-analyze behavior every 10 activities
      if (activityCount % 10 === 0) {
        await this.analyzeCustomerBehavior(customerId);
      }

    } catch (error) {
      console.error('Track engagement error:', error);
    }
  }

  // Get customer loyalty status
  async getLoyaltyStatus(customerId: string): Promise<{
    totalPoints: number;
    usedPoints: number;
    availablePoints: number;
    tier: string;
    nextTierPoints: number;
  }> {
    try {
      const loyaltyPoints = await prisma.loyaltyPoint.findMany({
        where: { customerId }
      });

      const totalPoints = loyaltyPoints.reduce((sum, point) => sum + point.points, 0);
      const usedPoints = loyaltyPoints
        .filter(point => point.isUsed)
        .reduce((sum, point) => sum + point.points, 0);
      const availablePoints = totalPoints - usedPoints;

      // Determine tier
      let tier = 'Bronze';
      let nextTierPoints = 100;

      if (totalPoints >= 1000) {
        tier = 'Platinum';
        nextTierPoints = 0;
      } else if (totalPoints >= 500) {
        tier = 'Gold';
        nextTierPoints = 1000 - totalPoints;
      } else if (totalPoints >= 100) {
        tier = 'Silver';
        nextTierPoints = 500 - totalPoints;
      } else {
        nextTierPoints = 100 - totalPoints;
      }

      return {
        totalPoints,
        usedPoints,
        availablePoints,
        tier,
        nextTierPoints
      };

    } catch (error) {
      console.error('Get loyalty status error:', error);
      throw error;
    }
  }
}

export default PersonalizationService;