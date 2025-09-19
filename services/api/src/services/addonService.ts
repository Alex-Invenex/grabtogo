import { PrismaClient, AddonType, AddonStatus } from '@prisma/client';
import Razorpay from 'razorpay';

const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

interface CreateAddonOrderOptions {
  vendorId: string;
  addonType: AddonType;
  userEmail: string;
  userName: string;
  userPhone?: string;
}

interface AddonPricing {
  [key in AddonType]: {
    name: string;
    description: string;
    price: number;
    validityDays: number;
    maxUsage?: number;
  };
}

const ADDON_PRICING: AddonPricing = {
  WHATSAPP_EMAIL_BLAST: {
    name: 'WhatsApp/Email Blast',
    description: 'Send bulk WhatsApp and email campaigns to your customers',
    price: 49,
    validityDays: 30,
    maxUsage: 4, // 1 per week for a month
  },
  CUSTOM_SOCIAL_ADS: {
    name: 'Custom Social Media Ads',
    description: 'Professional social media advertisement creation and management',
    price: 99,
    validityDays: 30,
    maxUsage: 1, // Limited to 1 per month
  },
  STATUS_BAR_ADDITIONAL: {
    name: 'Status Bar Additional',
    description: 'Additional status bar updates beyond your plan limit',
    price: 9,
    validityDays: 30,
    maxUsage: 10, // 10 additional status updates
  },
  FESTIVAL_CAMPAIGN: {
    name: 'Festival Campaign',
    description: 'Special festival campaign with enhanced visibility and promotion',
    price: 199,
    validityDays: 15, // 15-day campaign
    maxUsage: 1,
  },
  VIDEO_SHOOT_SUPPORT: {
    name: 'Video Shoot Support',
    description: 'Professional video shoot support and editing services',
    price: 0, // Coming soon - price TBD
    validityDays: 30,
    maxUsage: 1,
  },
};

export class AddonService {
  /**
   * Create a Razorpay order for addon purchase
   */
  async createAddonOrder(options: CreateAddonOrderOptions) {
    try {
      const { vendorId, addonType, userEmail, userName, userPhone } = options;

      // Check if vendor exists
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: { user: true },
      });

      if (!vendor) {
        return {
          success: false,
          error: 'Vendor not found',
        };
      }

      // Get addon pricing
      const addonInfo = ADDON_PRICING[addonType];
      if (!addonInfo) {
        return {
          success: false,
          error: 'Invalid addon type',
        };
      }

      // Check if addon is available (not coming soon)
      if (addonInfo.price === 0) {
        return {
          success: false,
          error: 'This addon is coming soon and not yet available',
        };
      }

      // Check for existing active addon of same type
      const existingAddon = await prisma.addon.findFirst({
        where: {
          vendorId,
          addonType,
          status: AddonStatus.ACTIVE,
          validUntil: {
            gte: new Date(),
          },
        },
      });

      if (existingAddon && existingAddon.maxUsage && existingAddon.usageCount >= existingAddon.maxUsage) {
        return {
          success: false,
          error: 'You have reached the usage limit for this addon. Please wait for it to expire or purchase a new one.',
        };
      }

      // Calculate total amount with GST (18%)
      const baseAmount = addonInfo.price * 100; // Convert to paisa
      const gstAmount = Math.round(baseAmount * 0.18);
      const totalAmount = baseAmount + gstAmount;

      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: totalAmount,
        currency: 'INR',
        receipt: `addon_${vendorId}_${Date.now()}`,
        notes: {
          vendorId,
          addonType,
          userEmail,
          userName,
          baseAmount: addonInfo.price,
          gstAmount: gstAmount / 100,
          totalAmount: totalAmount / 100,
        },
      });

      // Create addon record in database
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + addonInfo.validityDays);

      const addon = await prisma.addon.create({
        data: {
          vendorId,
          addonType,
          name: addonInfo.name,
          description: addonInfo.description,
          price: addonInfo.price,
          validUntil,
          maxUsage: addonInfo.maxUsage,
          metadata: {
            razorpayOrderId: razorpayOrder.id,
            gstAmount: gstAmount / 100,
            validityDays: addonInfo.validityDays,
          },
        },
      });

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          vendorId,
          addonId: addon.id,
          razorpayOrderId: razorpayOrder.id,
          paymentType: 'ADDON',
          amount: addonInfo.price,
          tax: gstAmount / 100,
          totalAmount: totalAmount / 100,
          description: `${addonInfo.name} addon purchase`,
        },
      });

      return {
        success: true,
        addon,
        payment,
        razorpayOrder,
        pricing: {
          baseAmount: addonInfo.price,
          gstAmount: gstAmount / 100,
          totalAmount: totalAmount / 100,
        },
      };
    } catch (error) {
      console.error('Create addon order error:', error);
      return {
        success: false,
        error: 'Failed to create addon order',
      };
    }
  }

  /**
   * Get available addons for a vendor
   */
  async getAvailableAddons(vendorId: string) {
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          addons: {
            where: {
              status: AddonStatus.ACTIVE,
              validUntil: {
                gte: new Date(),
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!vendor) {
        return {
          success: false,
          error: 'Vendor not found',
        };
      }

      // Get all addon types with pricing and availability
      const availableAddons = Object.entries(ADDON_PRICING).map(([type, info]) => {
        const existingAddon = vendor.addons.find(addon => addon.addonType === type);
        const isAvailable = info.price > 0; // Not coming soon
        const hasActiveAddon = !!existingAddon;
        const usageRemaining = existingAddon && existingAddon.maxUsage
          ? existingAddon.maxUsage - existingAddon.usageCount
          : null;

        return {
          type: type as AddonType,
          name: info.name,
          description: info.description,
          price: info.price,
          validityDays: info.validityDays,
          maxUsage: info.maxUsage,
          isAvailable,
          hasActiveAddon,
          usageRemaining,
          activeAddon: existingAddon || null,
        };
      });

      return {
        success: true,
        availableAddons,
        activeAddons: vendor.addons,
      };
    } catch (error) {
      console.error('Get available addons error:', error);
      return {
        success: false,
        error: 'Failed to get available addons',
      };
    }
  }

  /**
   * Use an addon (increment usage count)
   */
  async useAddon(vendorId: string, addonType: AddonType) {
    try {
      const addon = await prisma.addon.findFirst({
        where: {
          vendorId,
          addonType,
          status: AddonStatus.ACTIVE,
          validUntil: {
            gte: new Date(),
          },
        },
      });

      if (!addon) {
        return {
          success: false,
          error: 'Active addon not found',
        };
      }

      if (addon.maxUsage && addon.usageCount >= addon.maxUsage) {
        return {
          success: false,
          error: 'Addon usage limit exceeded',
        };
      }

      const updatedAddon = await prisma.addon.update({
        where: { id: addon.id },
        data: {
          usageCount: addon.usageCount + 1,
          status: addon.maxUsage && addon.usageCount + 1 >= addon.maxUsage
            ? AddonStatus.EXPIRED
            : AddonStatus.ACTIVE,
        },
      });

      return {
        success: true,
        addon: updatedAddon,
        remainingUsage: updatedAddon.maxUsage
          ? updatedAddon.maxUsage - updatedAddon.usageCount
          : null,
      };
    } catch (error) {
      console.error('Use addon error:', error);
      return {
        success: false,
        error: 'Failed to use addon',
      };
    }
  }

  /**
   * Cancel an addon
   */
  async cancelAddon(vendorId: string, addonId: string) {
    try {
      const addon = await prisma.addon.findFirst({
        where: {
          id: addonId,
          vendorId,
        },
      });

      if (!addon) {
        return {
          success: false,
          error: 'Addon not found',
        };
      }

      const updatedAddon = await prisma.addon.update({
        where: { id: addonId },
        data: {
          status: AddonStatus.CANCELLED,
        },
      });

      return {
        success: true,
        addon: updatedAddon,
      };
    } catch (error) {
      console.error('Cancel addon error:', error);
      return {
        success: false,
        error: 'Failed to cancel addon',
      };
    }
  }

  /**
   * Get addon usage statistics for a vendor
   */
  async getAddonUsageStats(vendorId: string) {
    try {
      const addons = await prisma.addon.findMany({
        where: { vendorId },
        include: {
          payments: {
            where: { status: 'SUCCESS' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const stats = {
        totalAddons: addons.length,
        activeAddons: addons.filter(addon =>
          addon.status === AddonStatus.ACTIVE &&
          addon.validUntil > new Date()
        ).length,
        totalSpent: addons.reduce((sum, addon) =>
          sum + addon.payments.reduce((paySum, payment) => paySum + payment.totalAmount, 0), 0
        ),
        usageByType: {} as Record<AddonType, { count: number; totalUsage: number; totalSpent: number }>,
      };

      // Calculate usage by addon type
      addons.forEach(addon => {
        if (!stats.usageByType[addon.addonType]) {
          stats.usageByType[addon.addonType] = { count: 0, totalUsage: 0, totalSpent: 0 };
        }
        stats.usageByType[addon.addonType].count++;
        stats.usageByType[addon.addonType].totalUsage += addon.usageCount;
        stats.usageByType[addon.addonType].totalSpent += addon.payments.reduce(
          (sum, payment) => sum + payment.totalAmount, 0
        );
      });

      return {
        success: true,
        stats,
        addons,
      };
    } catch (error) {
      console.error('Get addon usage stats error:', error);
      return {
        success: false,
        error: 'Failed to get addon usage statistics',
      };
    }
  }
}

export const addonService = new AddonService();