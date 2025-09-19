import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateReferralOptions {
  referrerVendorId: string;
  referredEmail: string;
}

interface ProcessReferralSignupOptions {
  referralCode: string;
  referredVendorId: string;
}

export class ReferralService {
  /**
   * Generate a unique referral code for a vendor
   */
  private generateReferralCode(vendorId: string): string {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GRAB${vendorId.substring(0, 4).toUpperCase()}${randomSuffix}`;
  }

  /**
   * Create a new referral for a vendor
   */
  async createReferral(options: CreateReferralOptions) {
    try {
      const { referrerVendorId, referredEmail } = options;

      // Check if referrer vendor exists
      const referrerVendor = await prisma.vendor.findUnique({
        where: { id: referrerVendorId },
        include: { user: true },
      });

      if (!referrerVendor) {
        return {
          success: false,
          error: 'Referrer vendor not found',
        };
      }

      // Check if referred email is already registered
      const existingUser = await prisma.user.findUnique({
        where: { email: referredEmail },
      });

      if (existingUser) {
        return {
          success: false,
          error: 'This email is already registered in the system',
        };
      }

      // Check if there's already a pending referral for this email
      const existingReferral = await prisma.referralProgram.findFirst({
        where: {
          referrerVendorId,
          referredEmail,
          referredVendorJoined: false,
        },
      });

      if (existingReferral) {
        return {
          success: true,
          referral: existingReferral,
          message: 'Referral already exists for this email',
        };
      }

      // Generate unique referral code
      let referralCode: string;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 5) {
        referralCode = this.generateReferralCode(referrerVendorId);
        const existingCode = await prisma.referralProgram.findUnique({
          where: { referralCode },
        });
        if (!existingCode) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return {
          success: false,
          error: 'Failed to generate unique referral code',
        };
      }

      // Create referral record
      const referral = await prisma.referralProgram.create({
        data: {
          referrerVendorId,
          referredEmail,
          referralCode: referralCode!,
          commissionRate: 10.0, // 10% commission
        },
        include: {
          referrerVendor: {
            include: { user: true },
          },
        },
      });

      return {
        success: true,
        referral,
        referralLink: `${process.env.WEB_APP_URL}/register?ref=${referralCode}`,
      };
    } catch (error) {
      console.error('Create referral error:', error);
      return {
        success: false,
        error: 'Failed to create referral',
      };
    }
  }

  /**
   * Process referral when a referred user signs up
   */
  async processReferralSignup(options: ProcessReferralSignupOptions) {
    try {
      const { referralCode, referredVendorId } = options;

      // Find the referral record
      const referral = await prisma.referralProgram.findUnique({
        where: { referralCode },
        include: {
          referrerVendor: {
            include: { user: true },
          },
        },
      });

      if (!referral) {
        return {
          success: false,
          error: 'Invalid referral code',
        };
      }

      if (referral.referredVendorJoined) {
        return {
          success: false,
          error: 'Referral code has already been used',
        };
      }

      // Check if referred vendor exists
      const referredVendor = await prisma.vendor.findUnique({
        where: { id: referredVendorId },
        include: { user: true },
      });

      if (!referredVendor) {
        return {
          success: false,
          error: 'Referred vendor not found',
        };
      }

      // Update referral record
      const updatedReferral = await prisma.referralProgram.update({
        where: { id: referral.id },
        data: {
          referredVendorId,
          referredVendorJoined: true,
        },
        include: {
          referrerVendor: {
            include: { user: true },
          },
          referredVendor: {
            include: { user: true },
          },
        },
      });

      return {
        success: true,
        referral: updatedReferral,
        message: 'Referral processed successfully',
      };
    } catch (error) {
      console.error('Process referral signup error:', error);
      return {
        success: false,
        error: 'Failed to process referral signup',
      };
    }
  }

  /**
   * Calculate and pay commission for a successful referral
   */
  async calculateAndPayCommission(referralId: string, referredVendorFirstPayment: number) {
    try {
      const referral = await prisma.referralProgram.findUnique({
        where: { id: referralId },
        include: {
          referrerVendor: {
            include: { user: true },
          },
          referredVendor: {
            include: { user: true },
          },
        },
      });

      if (!referral) {
        return {
          success: false,
          error: 'Referral not found',
        };
      }

      if (referral.isRewardClaimed) {
        return {
          success: false,
          error: 'Commission has already been paid for this referral',
        };
      }

      if (!referral.referredVendorJoined) {
        return {
          success: false,
          error: 'Referred vendor has not joined yet',
        };
      }

      // Calculate commission (10% of first payment)
      const commissionAmount = (referredVendorFirstPayment * referral.commissionRate) / 100;

      // Update referral record with commission details
      const updatedReferral = await prisma.referralProgram.update({
        where: { id: referralId },
        data: {
          isRewardClaimed: true,
          rewardAmount: commissionAmount,
          commissionPaidAt: new Date(),
        },
        include: {
          referrerVendor: {
            include: { user: true },
          },
          referredVendor: {
            include: { user: true },
          },
        },
      });

      // TODO: Implement actual payment transfer to referrer
      // This could be:
      // 1. Credit to wallet/account balance
      // 2. Direct bank transfer
      // 3. Discount on next subscription payment
      // 4. Store credit

      return {
        success: true,
        referral: updatedReferral,
        commissionAmount,
        message: `Commission of ₹${commissionAmount} calculated for referral`,
      };
    } catch (error) {
      console.error('Calculate and pay commission error:', error);
      return {
        success: false,
        error: 'Failed to calculate and pay commission',
      };
    }
  }

  /**
   * Get referral statistics for a vendor
   */
  async getReferralStats(vendorId: string) {
    try {
      const referrals = await prisma.referralProgram.findMany({
        where: { referrerVendorId: vendorId },
        include: {
          referredVendor: {
            include: { user: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const stats = {
        totalReferrals: referrals.length,
        successfulReferrals: referrals.filter(r => r.referredVendorJoined).length,
        pendingReferrals: referrals.filter(r => !r.referredVendorJoined).length,
        totalCommissionEarned: referrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0),
        claimedCommissions: referrals.filter(r => r.isRewardClaimed).length,
        pendingCommissions: referrals.filter(r => r.referredVendorJoined && !r.isRewardClaimed).length,
      };

      return {
        success: true,
        stats,
        referrals,
      };
    } catch (error) {
      console.error('Get referral stats error:', error);
      return {
        success: false,
        error: 'Failed to get referral statistics',
      };
    }
  }

  /**
   * Get referral by code (for validation during signup)
   */
  async getReferralByCode(referralCode: string) {
    try {
      const referral = await prisma.referralProgram.findUnique({
        where: { referralCode },
        include: {
          referrerVendor: {
            include: { user: true },
          },
        },
      });

      if (!referral) {
        return {
          success: false,
          error: 'Invalid referral code',
        };
      }

      if (referral.referredVendorJoined) {
        return {
          success: false,
          error: 'Referral code has already been used',
        };
      }

      return {
        success: true,
        referral,
        referrerInfo: {
          companyName: referral.referrerVendor.companyName,
          referrerName: referral.referrerVendor.user.email,
        },
      };
    } catch (error) {
      console.error('Get referral by code error:', error);
      return {
        success: false,
        error: 'Failed to validate referral code',
      };
    }
  }

  /**
   * Get all referrals for a vendor (both as referrer and referred)
   */
  async getAllReferralsForVendor(vendorId: string) {
    try {
      // Get referrals made by this vendor
      const referralsMade = await prisma.referralProgram.findMany({
        where: { referrerVendorId: vendorId },
        include: {
          referredVendor: {
            include: { user: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get referrals where this vendor was referred
      const referralsReceived = await prisma.referralProgram.findMany({
        where: { referredVendorId: vendorId },
        include: {
          referrerVendor: {
            include: { user: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        referralsMade,
        referralsReceived,
      };
    } catch (error) {
      console.error('Get all referrals for vendor error:', error);
      return {
        success: false,
        error: 'Failed to get referrals for vendor',
      };
    }
  }
}

export const referralService = new ReferralService();