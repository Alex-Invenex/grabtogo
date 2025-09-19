import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ApiResponse } from './types/api';
import authRoutes from './routes/auth';
import vendorRoutes from './routes/vendors';
import subscriptionRoutes from './routes/subscriptions';
import adminRoutes from './routes/admin';
import productRoutes from './routes/products';
import offerRoutes from './routes/offers';
import storyRoutes from './routes/stories';
import customerRoutes from './routes/customers';
import chatRoutes from './routes/chat';
import searchRoutes from './routes/search';
import paymentRoutes from './routes/payments';
import invoiceRoutes from './routes/invoices';
import webhookRoutes from './routes/webhooks';
import upiSubscriptionRoutes from './routes/upiSubscriptions';
import addonRoutes from './routes/addons';
import referralRoutes from './routes/referrals';
import featureRoutes from './routes/features';
import ChatService from './services/chat';
import NotificationService from './services/notifications';
import './types/express';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Socket.io setup
const io = new SocketServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
});

// Initialize services
const notificationService = new NotificationService();
const chatService = new ChatService(io);
notificationService.setChatService(chatService);

// Rate limiting - 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP',
    error: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
}) as any;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: process.env.CORS_CREDENTIALS === 'true'
}));

app.use(morgan('combined'));

// Configure body parsers - skip JSON parsing for webhook endpoints
app.use((req, res, next) => {
  if (req.originalUrl === '/api/auth/webhooks/clerk' || req.originalUrl === '/api/webhooks/razorpay') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting after body parsing (commented out due to TypeScript issue)
// app.use(limiter);

// Health check endpoint
app.get('/health', (req, res: express.Response<ApiResponse>) => {
  res.json({
    success: true,
    message: 'GrabtoGo API is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || 'v1',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/upi-subscriptions', upiSubscriptionRoutes);
app.use('/api/addons', addonRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/features', featureRoutes);

// Socket.io connection handling is now managed by ChatService
// The ChatService handles all socket events and authentication

// Export io for use in other modules
export { io };

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 GrabtoGo API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.io server ready`);
});

export default app;