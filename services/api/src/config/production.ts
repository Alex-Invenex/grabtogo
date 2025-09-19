import { config as baseConfig } from './base'

export const productionConfig = {
  ...baseConfig,

  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    host: '0.0.0.0',
    cors: {
      origin: [
        'https://grabtogo.in',
        'https://www.grabtogo.in',
        'https://admin.grabtogo.in',
        'https://api.grabtogo.in'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL!,
    ssl: {
      rejectUnauthorized: false
    },
    connectionLimit: 20,
    acquireTimeout: 60000,
    timeout: 60000,
    pool: {
      min: 5,
      max: 20,
      acquire: 30000,
      idle: 10000
    }
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL!,
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    family: 4,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    keyPrefix: 'grabtogo:prod:'
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: '7d',
    encryptionKey: process.env.ENCRYPTION_KEY!,
    bcryptRounds: 12,
    sessionSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET!,
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
          connectSrc: ["'self'", 'https://api.razorpay.com', 'wss:'],
          frameSrc: ['https://api.razorpay.com'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Different limits for different endpoints
    endpoints: {
      '/api/auth/login': { windowMs: 900000, max: 5 }, // 5 login attempts per 15 min
      '/api/auth/register': { windowMs: 3600000, max: 3 }, // 3 registrations per hour
      '/api/payments/create-order': { windowMs: 60000, max: 10 }, // 10 orders per minute
      '/api/vendors/search': { windowMs: 60000, max: 30 }, // 30 searches per minute
      '/api/products/search': { windowMs: 60000, max: 50 } // 50 product searches per minute
    }
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    maxFiles: parseInt(process.env.MAX_FILES_PER_UPLOAD || '5'),
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf'
    ],
    s3: {
      bucket: process.env.AWS_S3_BUCKET!,
      region: process.env.AWS_REGION!,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  },

  // Payment Configuration
  payment: {
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID!,
      keySecret: process.env.RAZORPAY_SECRET!,
      webhook: {
        secret: process.env.RAZORPAY_WEBHOOK_SECRET!
      }
    },
    currency: 'INR',
    minAmount: 50, // ₹0.50
    maxAmount: 5000000, // ₹50,000
    platformFeePercentage: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '10')
  },

  // Email Configuration
  email: {
    provider: 'ses',
    ses: {
      region: process.env.SES_REGION!,
      accessKeyId: process.env.SES_ACCESS_KEY_ID!,
      secretAccessKey: process.env.SES_SECRET_ACCESS_KEY!
    },
    from: process.env.FROM_EMAIL!,
    templates: {
      welcome: 'welcome-template',
      orderConfirmation: 'order-confirmation-template',
      vendorApproval: 'vendor-approval-template'
    }
  },

  // Push Notifications
  pushNotifications: {
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!
    }
  },

  // Logging Configuration
  logging: {
    level: 'info',
    format: 'json',
    timestamp: true,
    colorize: false,
    file: {
      enabled: true,
      filename: '/var/log/grabtogo/api.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    },
    database: {
      enabled: true,
      level: 'error'
    }
  },

  // Monitoring
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN!,
      environment: 'production',
      tracesSampleRate: 0.1,
      release: process.env.SENTRY_RELEASE
    },
    metrics: {
      enabled: true,
      interval: 60000, // 1 minute
      retention: 86400000 // 24 hours
    }
  },

  // Cache Configuration
  cache: {
    ttl: {
      short: 300,      // 5 minutes
      medium: 1800,    // 30 minutes
      long: 3600,      // 1 hour
      veryLong: 86400  // 24 hours
    },
    enabled: true
  },

  // Business Rules
  business: {
    vendorSubscriptionPlans: {
      BASIC: {
        price: 0,
        productLimit: 50,
        offerLimit: 5,
        analyticsEnabled: false,
        prioritySupport: false
      },
      STANDARD: {
        price: 999,
        productLimit: 200,
        offerLimit: 20,
        analyticsEnabled: true,
        prioritySupport: false
      },
      PREMIUM: {
        price: 2999,
        productLimit: -1, // unlimited
        offerLimit: -1, // unlimited
        analyticsEnabled: true,
        prioritySupport: true
      }
    },
    orderStatuses: [
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED'
    ],
    maxDeliveryDistance: 20, // km
    defaultDeliveryTime: 30 // minutes
  },

  // Feature Flags
  features: {
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    pushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
    socialLogin: process.env.ENABLE_SOCIAL_LOGIN === 'true',
    vendorSubscriptions: process.env.ENABLE_VENDOR_SUBSCRIPTIONS === 'true',
    realTimeTracking: true,
    multiLanguage: false,
    darkMode: true
  },

  // Health Check
  healthCheck: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
    endpoints: [
      '/health',
      '/health/database',
      '/health/redis',
      '/health/external-services'
    ]
  }
}