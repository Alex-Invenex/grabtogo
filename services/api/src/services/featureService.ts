import { PrismaClient, PlanType, Vendor } from '@prisma/client';

const prisma = new PrismaClient();

interface FeatureLimits {
  featureListing: 'none' | 'weekly_3_days' | 'unlimited';
  galleryImages: number | 'unlimited';
  videoModule: boolean;
  statusUpdatesPerDay: number | 'unlimited';
  analyticalDashboard: 'basic' | 'extended' | 'professional';
  socialMediaAds: boolean;
  campaignAccess: boolean;
  whatsappEmailBlast: boolean;
  whatsappEmailBlastFrequency?: 'weekly';
  futureDevAccess: boolean;
}

interface PlanFeatures {
  [key in PlanType]: FeatureLimits;
}

const PLAN_FEATURES: PlanFeatures = {
  BASIC: {
    featureListing: 'none',
    galleryImages: 3,
    videoModule: false,
    statusUpdatesPerDay: 5,
    analyticalDashboard: 'basic',
    socialMediaAds: false,
    campaignAccess: false,
    whatsappEmailBlast: false,
    futureDevAccess: false,
  },
  STANDARD: {
    featureListing: 'weekly_3_days',
    galleryImages: 5,
    videoModule: true,
    statusUpdatesPerDay: 10,
    analyticalDashboard: 'extended',
    socialMediaAds: false,
    campaignAccess: false,
    whatsappEmailBlast: false,
    futureDevAccess: false,
  },
  PREMIUM: {
    featureListing: 'unlimited',
    galleryImages: 'unlimited',
    videoModule: true,
    statusUpdatesPerDay: 'unlimited',
    analyticalDashboard: 'professional',
    socialMediaAds: true,
    campaignAccess: true,
    whatsappEmailBlast: true,
    whatsappEmailBlastFrequency: 'weekly',
    futureDevAccess: true,
  },
};

export class FeatureService {
  /**
   * Get feature limits for a vendor based on their subscription plan
   */
  async getVendorFeatureLimits(vendorId: string): Promise<FeatureLimits | null> {
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          subscriptions: {
            where: {
              status: 'ACTIVE',
              endDate: {
                gte: new Date(),
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!vendor || !vendor.subscriptions.length) {
        return null;
      }

      const activeSubscription = vendor.subscriptions[0];
      return PLAN_FEATURES[activeSubscription.planType];
    } catch (error) {
      console.error('Get vendor feature limits error:', error);
      return null;
    }
  }

  /**
   * Check if vendor can add more gallery images
   */
  async canAddGalleryImages(vendorId: string, currentCount: number, additionalCount: number = 1): Promise<boolean> {
    const limits = await this.getVendorFeatureLimits(vendorId);
    if (!limits) return false;

    if (limits.galleryImages === 'unlimited') return true;
    return currentCount + additionalCount <= (limits.galleryImages as number);
  }

  /**
   * Check if vendor can create more status updates today
   */
  async canCreateStatusUpdate(vendorId: string): Promise<boolean> {
    const limits = await this.getVendorFeatureLimits(vendorId);
    if (!limits) return false;

    if (limits.statusUpdatesPerDay === 'unlimited') return true;

    // Get today's status update count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await prisma.story.count({
      where: {
        vendorId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return todayCount < (limits.statusUpdatesPerDay as number);
  }

  /**
   * Check if vendor can access video module
   */
  async canUseVideoModule(vendorId: string): Promise<boolean> {
    const limits = await this.getVendorFeatureLimits(vendorId);
    if (!limits) return false;
    return limits.videoModule;
  }

  /**
   * Check if vendor can access social media ads
   */
  async canUseSocialMediaAds(vendorId: string): Promise<boolean> {
    const limits = await this.getVendorFeatureLimits(vendorId);
    if (!limits) return false;
    return limits.socialMediaAds;
  }

  /**
   * Check if vendor can access campaign features
   */
  async canUseCampaigns(vendorId: string): Promise<boolean> {
    const limits = await this.getVendorFeatureLimits(vendorId);
    if (!limits) return false;
    return limits.campaignAccess;
  }

  /**
   * Check if vendor can use WhatsApp/Email blast
   */
  async canUseWhatsAppEmailBlast(vendorId: string): Promise<boolean> {
    const limits = await this.getVendorFeatureLimits(vendorId);
    if (!limits) return false;
    return limits.whatsappEmailBlast;
  }

  /**
   * Check if vendor can access future development features
   */
  async canUseFutureDevAccess(vendorId: string): Promise<boolean> {
    const limits = await this.getVendorFeatureLimits(vendorId);
    if (!limits) return false;
    return limits.futureDevAccess;
  }

  /**
   * Get feature listing eligibility
   */
  async getFeatureListingEligibility(vendorId: string): Promise<{
    canList: boolean;
    listingType: 'none' | 'weekly_3_days' | 'unlimited';
    nextAvailableDate?: Date;
  }> {
    const limits = await this.getVendorFeatureLimits(vendorId);
    if (!limits) {
      return { canList: false, listingType: 'none' };
    }

    const listingType = limits.featureListing;

    if (listingType === 'none') {
      return { canList: false, listingType: 'none' };
    }

    if (listingType === 'unlimited') {
      return { canList: true, listingType: 'unlimited' };
    }

    // For weekly_3_days plan, check if they can list this week
    if (listingType === 'weekly_3_days') {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      // Count feature listings this week
      const thisWeekListings = await prisma.offer.count({
        where: {
          vendorId,
          isFlashDeal: true, // Assuming feature listing is marked as flash deal
          createdAt: {
            gte: startOfWeek,
            lt: endOfWeek,
          },
        },
      });

      const canList = thisWeekListings < 3; // 3 days per week
      const nextAvailableDate = canList ? undefined : endOfWeek;

      return { canList, listingType: 'weekly_3_days', nextAvailableDate };
    }

    return { canList: false, listingType: 'none' };
  }

  /**
   * Get analytical dashboard level
   */
  async getAnalyticalDashboardLevel(vendorId: string): Promise<'basic' | 'extended' | 'professional' | null> {
    const limits = await this.getVendorFeatureLimits(vendorId);
    if (!limits) return null;
    return limits.analyticalDashboard;
  }

  /**
   * Get comprehensive feature status for a vendor
   */
  async getVendorFeatureStatus(vendorId: string) {
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          subscriptions: {
            where: {
              status: 'ACTIVE',
              endDate: {
                gte: new Date(),
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          products: true,
          stories: {
            where: {
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          },
        },
      });

      if (!vendor || !vendor.subscriptions.length) {
        return {
          success: false,
          error: 'No active subscription found',
        };
      }

      const activeSubscription = vendor.subscriptions[0];
      const limits = PLAN_FEATURES[activeSubscription.planType];

      // Get current usage counts
      const galleryImageCount = vendor.products.reduce((total, product) => total + product.images.length, 0);
      const todayStatusCount = vendor.stories.length;

      // Get feature listing eligibility
      const featureListingEligibility = await this.getFeatureListingEligibility(vendorId);

      const featureStatus = {
        planType: activeSubscription.planType,
        subscriptionEndDate: activeSubscription.endDate,
        features: {
          galleryImages: {
            limit: limits.galleryImages,
            used: galleryImageCount,
            canAddMore: await this.canAddGalleryImages(vendorId, galleryImageCount),
          },
          statusUpdates: {
            dailyLimit: limits.statusUpdatesPerDay,
            usedToday: todayStatusCount,
            canCreateMore: await this.canCreateStatusUpdate(vendorId),
          },
          videoModule: {
            enabled: limits.videoModule,
            canUse: await this.canUseVideoModule(vendorId),
          },
          featureListing: featureListingEligibility,
          analyticalDashboard: {
            level: limits.analyticalDashboard,
            canAccess: true,
          },
          socialMediaAds: {
            enabled: limits.socialMediaAds,
            canUse: await this.canUseSocialMediaAds(vendorId),
          },
          campaignAccess: {
            enabled: limits.campaignAccess,
            canUse: await this.canUseCampaigns(vendorId),
          },
          whatsappEmailBlast: {
            enabled: limits.whatsappEmailBlast,
            frequency: limits.whatsappEmailBlastFrequency,
            canUse: await this.canUseWhatsAppEmailBlast(vendorId),
          },
          futureDevAccess: {
            enabled: limits.futureDevAccess,
            canUse: await this.canUseFutureDevAccess(vendorId),
          },
        },
      };

      return {
        success: true,
        featureStatus,
      };
    } catch (error) {
      console.error('Get vendor feature status error:', error);
      return {
        success: false,
        error: 'Failed to get vendor feature status',
      };
    }
  }

  /**
   * Check if vendor can perform a specific action
   */
  async canPerformAction(vendorId: string, action: string, additionalData?: any): Promise<boolean> {
    try {
      switch (action) {
        case 'add_gallery_image':
          const currentImageCount = additionalData?.currentCount || 0;
          return await this.canAddGalleryImages(vendorId, currentImageCount);

        case 'create_status_update':
          return await this.canCreateStatusUpdate(vendorId);

        case 'upload_video':
          return await this.canUseVideoModule(vendorId);

        case 'create_social_ad':
          return await this.canUseSocialMediaAds(vendorId);

        case 'access_campaigns':
          return await this.canUseCampaigns(vendorId);

        case 'send_whatsapp_blast':
          return await this.canUseWhatsAppEmailBlast(vendorId);

        case 'feature_listing':
          const eligibility = await this.getFeatureListingEligibility(vendorId);
          return eligibility.canList;

        default:
          return false;
      }
    } catch (error) {
      console.error(`Can perform action ${action} error:`, error);
      return false;
    }
  }
}

export const featureService = new FeatureService();