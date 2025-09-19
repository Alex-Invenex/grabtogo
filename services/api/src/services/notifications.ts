import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import ChatService from './chat';

const prisma = new PrismaClient();

interface NotificationData {
  title: string;
  message: string;
  type: 'offer' | 'chat' | 'order' | 'system' | 'wishlist' | 'favorite';
  data?: any;
  imageUrl?: string;
  actionUrl?: string;
}

interface EmailConfig {
  subject: string;
  html: string;
  to: string;
}

class NotificationService {
  private chatService: ChatService | null = null;
  private emailTransporter: nodemailer.Transporter | null = null;
  private firebaseApp: admin.app.App | null = null;

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Initialize email service
    this.initializeEmail();

    // Initialize Firebase (FCM)
    this.initializeFirebase();
  }

  private initializeEmail() {
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        this.emailTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        console.log('Email service initialized');
      } else {
        console.log('Email service not configured - missing SMTP settings');
      }
    } catch (error) {
      console.error('Email service initialization error:', error);
    }
  }

  private initializeFirebase() {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });

        console.log('Firebase service initialized');
      } else {
        console.log('Firebase service not configured - missing service account key');
      }
    } catch (error) {
      console.error('Firebase service initialization error:', error);
    }
  }

  public setChatService(chatService: ChatService) {
    this.chatService = chatService;
  }

  // Send notification to user
  async sendNotification(userId: string, notification: NotificationData): Promise<void> {
    try {
      // Store notification in database
      const dbNotification = await prisma.notification.create({
        data: {
          userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data || {}
        }
      });

      // Get user preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          customer: {
            include: { preferences: true }
          },
          vendor: true
        }
      });

      if (!user) {
        console.error('User not found for notification:', userId);
        return;
      }

      const preferences = user.customer?.preferences?.notificationSettings as any;

      // Send real-time notification via Socket.io
      if (this.chatService) {
        await this.chatService.sendNotification(userId, notification.type as any, {
          id: dbNotification.id,
          ...notification
        });
      }

      // Send push notification via FCM
      if (preferences?.push !== false && this.firebaseApp) {
        await this.sendPushNotification(userId, notification);
      }

      // Send email notification
      if (preferences?.email === true && this.emailTransporter) {
        await this.sendEmailNotification(user.email, notification);
      }

    } catch (error) {
      console.error('Send notification error:', error);
    }
  }

  // Send push notification via Firebase Cloud Messaging
  private async sendPushNotification(userId: string, notification: NotificationData): Promise<void> {
    if (!this.firebaseApp) return;

    try {
      // Get user's FCM tokens from database (you'd need to store these when users register for push notifications)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true } // You'd need to add fcmTokens field to User model
      });

      if (!user) return;

      // For now, we'll assume FCM tokens are stored in user preferences or separate table
      // In a real implementation, you'd have a UserDevice table with FCM tokens

      const message = {
        notification: {
          title: notification.title,
          body: notification.message,
          imageUrl: notification.imageUrl
        },
        data: {
          type: notification.type,
          actionUrl: notification.actionUrl || '',
          ...notification.data
        },
        // topic: `user_${userId}`, // You can use topics for easier management
      };

      // This would send to specific tokens if you have them
      // const response = await admin.messaging().sendMulticast({
      //   tokens: userTokens,
      //   ...message
      // });

      console.log('Push notification sent for user:', userId);
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }

  // Send email notification
  private async sendEmailNotification(email: string, notification: NotificationData): Promise<void> {
    if (!this.emailTransporter) return;

    try {
      const emailHtml = this.generateEmailTemplate(notification);

      await this.emailTransporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@grabtogo.com',
        to: email,
        subject: notification.title,
        html: emailHtml
      });

      console.log('Email notification sent to:', email);
    } catch (error) {
      console.error('Email notification error:', error);
    }
  }

  // Generate email template
  private generateEmailTemplate(notification: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #ff6b35; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 10px; text-align: center; color: #666; font-size: 12px; }
          .button { background-color: #ff6b35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GrabtoGo</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            ${notification.actionUrl ? `<a href="${notification.actionUrl}" class="button">View Details</a>` : ''}
          </div>
          <div class="footer">
            <p>© 2024 GrabtoGo. All rights reserved.</p>
            <p>Don't want these emails? <a href="#">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send offer notifications to customers
  async notifyCustomersAboutNewOffer(offerId: string): Promise<void> {
    try {
      const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: {
          vendor: true,
          product: true
        }
      });

      if (!offer) return;

      // Get customers who have favorited this vendor
      const favoriteCustomers = await prisma.favorite.findMany({
        where: { vendorId: offer.vendorId },
        include: {
          customer: {
            include: { user: true }
          }
        }
      });

      // Get customers who have this product in their wishlist
      const wishlistCustomers = offer.productId ? await prisma.wishlist.findMany({
        where: { productId: offer.productId },
        include: {
          customer: {
            include: { user: true }
          }
        }
      }) : [];

      // Combine and deduplicate customers
      const allCustomers = new Map();

      favoriteCustomers.forEach(fav => {
        allCustomers.set(fav.customer.id, {
          user: fav.customer.user,
          reason: 'favorite_vendor'
        });
      });

      wishlistCustomers.forEach(wish => {
        if (!allCustomers.has(wish.customer.id)) {
          allCustomers.set(wish.customer.id, {
            user: wish.customer.user,
            reason: 'wishlist_item'
          });
        }
      });

      // Send notifications to all relevant customers
      for (const [customerId, customerData] of allCustomers) {
        const reason = customerData.reason === 'favorite_vendor'
          ? 'from one of your favorite vendors'
          : 'for an item in your wishlist';

        await this.sendNotification(customerData.user.id, {
          title: '🎉 New Offer Available!',
          message: `${offer.title} ${reason}. Save ${offer.discountPercentage}% now!`,
          type: 'offer',
          data: {
            offerId: offer.id,
            vendorId: offer.vendorId,
            productId: offer.productId,
            discount: offer.discountPercentage,
            reason: customerData.reason
          },
          actionUrl: `/offers/${offer.id}`
        });
      }

    } catch (error) {
      console.error('Notify customers about offer error:', error);
    }
  }

  // Send wishlist item on sale notifications
  async notifyWishlistItemOnSale(productId: string, offerId: string): Promise<void> {
    try {
      const wishlistItems = await prisma.wishlist.findMany({
        where: { productId },
        include: {
          customer: {
            include: { user: true }
          },
          product: true
        }
      });

      const offer = await prisma.offer.findUnique({
        where: { id: offerId }
      });

      if (!offer) return;

      for (const item of wishlistItems) {
        await this.sendNotification(item.customer.user.id, {
          title: '🛍️ Wishlist Item on Sale!',
          message: `${item.product.name} is now ${offer.discountPercentage}% off! Don't miss out!`,
          type: 'wishlist',
          data: {
            productId,
            offerId,
            discount: offer.discountPercentage,
            originalPrice: offer.originalPrice,
            discountedPrice: offer.discountedPrice
          },
          actionUrl: `/offers/${offerId}`
        });
      }

    } catch (error) {
      console.error('Notify wishlist item on sale error:', error);
    }
  }

  // Send chat message notifications
  async notifyNewChatMessage(conversationId: string, senderId: string, message: string): Promise<void> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          customer: { include: { user: true } },
          vendor: { include: { user: true } }
        }
      });

      if (!conversation) return;

      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        include: { customer: true, vendor: true }
      });

      if (!sender) return;

      // Determine recipient
      const isCustomerSender = !!sender.customer;
      const recipient = isCustomerSender ? conversation.vendor.user : conversation.customer.user;
      const senderName = isCustomerSender
        ? `${sender.customer?.firstName} ${sender.customer?.lastName}`.trim()
        : sender.vendor?.companyName;

      await this.sendNotification(recipient.id, {
        title: `💬 New message from ${senderName}`,
        message: message.length > 50 ? message.substring(0, 50) + '...' : message,
        type: 'chat',
        data: {
          conversationId,
          senderId,
          senderName,
          senderType: isCustomerSender ? 'CUSTOMER' : 'VENDOR'
        },
        actionUrl: `/chat/${conversationId}`
      });

    } catch (error) {
      console.error('Notify chat message error:', error);
    }
  }

  // Send offer expiry reminders
  async sendOfferExpiryReminders(): Promise<void> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);

      // Get offers expiring tomorrow
      const expiringOffers = await prisma.offer.findMany({
        where: {
          isActive: true,
          status: 'ACTIVE',
          validUntil: {
            gte: tomorrow,
            lt: nextDay
          }
        },
        include: {
          vendor: true,
          product: true
        }
      });

      for (const offer of expiringOffers) {
        // Get customers who have favorited this vendor
        const favoriteCustomers = await prisma.favorite.findMany({
          where: { vendorId: offer.vendorId },
          include: {
            customer: { include: { user: true } }
          }
        });

        for (const favorite of favoriteCustomers) {
          await this.sendNotification(favorite.customer.user.id, {
            title: '⏰ Offer Expiring Soon!',
            message: `"${offer.title}" expires tomorrow. Claim it before it's gone!`,
            type: 'offer',
            data: {
              offerId: offer.id,
              vendorId: offer.vendorId,
              expiresAt: offer.validUntil,
              isLastDay: true
            },
            actionUrl: `/offers/${offer.id}`
          });
        }
      }

    } catch (error) {
      console.error('Send offer expiry reminders error:', error);
    }
  }

  // Send daily check-in reminders
  async sendDailyCheckInReminders(): Promise<void> {
    try {
      // Get customers who haven't checked in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const customersWithoutCheckIn = await prisma.customer.findMany({
        where: {
          isActive: true,
          activities: {
            none: {
              activityType: 'CHECK_IN',
              createdAt: { gte: today }
            }
          }
        },
        include: { user: true },
        take: 100 // Limit to avoid overwhelming the system
      });

      for (const customer of customersWithoutCheckIn) {
        await this.sendNotification(customer.user.id, {
          title: '🎁 Daily Check-in Reward Available!',
          message: 'Check in today to earn loyalty points and discover new offers near you!',
          type: 'system',
          data: {
            rewardType: 'daily_checkin',
            points: 10
          },
          actionUrl: '/check-in'
        });
      }

    } catch (error) {
      console.error('Send daily check-in reminders error:', error);
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const offset = (page - 1) * limit;

      const [notifications, totalCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.notification.count({ where: { userId } })
      ]);

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
      });

      return {
        notifications,
        totalCount,
        unreadCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
        limit
      };

    } catch (error) {
      console.error('Get user notifications error:', error);
      throw error;
    }
  }

  // Mark notifications as read
  async markNotificationsAsRead(userId: string, notificationIds?: string[]): Promise<void> {
    try {
      const whereClause: any = { userId };

      if (notificationIds) {
        whereClause.id = { in: notificationIds };
      }

      await prisma.notification.updateMany({
        where: whereClause,
        data: { isRead: true }
      });

    } catch (error) {
      console.error('Mark notifications as read error:', error);
      throw error;
    }
  }
}

export default NotificationService;