import express from 'express';
import { PrismaClient, SenderType, MessageType } from '@prisma/client';
import { clerkAuth } from '../middleware/clerk';
import { body, query, validationResult } from 'express-validator';
import { ApiResponse } from '../types/api';
import { io } from '../server';
import UploadService from '../services/upload';
import multer from 'multer';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mp3', 'audio/wav', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, audio, and PDF files are allowed.'));
    }
  }
});

// Validation middleware
const handleValidationErrors = (
  req: express.Request,
  res: express.Response<ApiResponse>,
  next: express.NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string[]> = {};
    errors.array().forEach((error) => {
      const field = 'path' in error ? error.path : 'unknown';
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(error.msg);
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'Please check the provided data',
      errors: formattedErrors
    });
    return;
  }
  next();
};

// GET /conversations - List customer's conversations with vendors
const conversationsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
];

router.get('/conversations',
  clerkAuth,
  conversationsValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.customer) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'Only customers can access conversations'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const [conversations, totalCount] = await Promise.all([
        prisma.conversation.findMany({
          where: {
            customerId: req.user.customer.id,
            isActive: true
          },
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                address: true,
                averageRating: true,
                isActive: true
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                content: true,
                messageType: true,
                senderType: true,
                isRead: true,
                createdAt: true
              }
            },
            _count: {
              select: {
                messages: {
                  where: {
                    senderType: 'VENDOR',
                    isRead: false
                  }
                }
              }
            }
          },
          orderBy: { lastMessageAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.conversation.count({
          where: {
            customerId: req.user.customer.id,
            isActive: true
          }
        })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        message: 'Conversations retrieved successfully',
        data: {
          conversations: conversations.map(conv => ({
            id: conv.id,
            vendor: conv.vendor,
            lastMessage: conv.messages[0] || null,
            unreadCount: conv._count.messages,
            lastMessageAt: conv.lastMessageAt,
            createdAt: conv.createdAt
          })),
          totalCount,
          page,
          totalPages,
          limit
        }
      });

    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversations',
        error: 'Internal server error'
      });
    }
  }
);

// GET /conversations/:id/messages - Get chat messages
const messagesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

router.get('/conversations/:id/messages',
  clerkAuth,
  messagesValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'Please log in to access messages'
        });
        return;
      }

      const conversationId = req.params.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      // Check if conversation exists and user has access
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { customerId: req.user.customer?.id || '' },
            { vendorId: req.user.vendor?.id || '' }
          ]
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          vendor: {
            select: {
              id: true,
              companyName: true
            }
          }
        }
      });

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found',
          error: 'Conversation not found or access denied'
        });
        return;
      }

      const [messages, totalCount] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId },
          include: {
            sender: {
              select: {
                id: true,
                customer: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                },
                vendor: {
                  select: {
                    companyName: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.message.count({
          where: { conversationId }
        })
      ]);

      // Mark messages as read if user is customer
      if (req.user.customer) {
        await prisma.message.updateMany({
          where: {
            conversationId,
            senderType: 'VENDOR',
            isRead: false
          },
          data: { isRead: true }
        });
      }

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        message: 'Messages retrieved successfully',
        data: {
          conversation: {
            id: conversation.id,
            customer: conversation.customer,
            vendor: conversation.vendor
          },
          messages: messages.reverse().map(msg => ({
            id: msg.id,
            content: msg.content,
            messageType: msg.messageType,
            mediaUrl: msg.mediaUrl,
            senderType: msg.senderType,
            sender: msg.senderType === 'CUSTOMER'
              ? `${msg.sender.customer?.firstName} ${msg.sender.customer?.lastName}`.trim()
              : msg.sender.vendor?.companyName,
            isRead: msg.isRead,
            createdAt: msg.createdAt
          })),
          totalCount,
          page,
          totalPages,
          limit
        }
      });

    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve messages',
        error: 'Internal server error'
      });
    }
  }
);

// POST /conversations/:id/messages - Send message
const sendMessageValidation = [
  body('content')
    .optional()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters'),
  body('messageType')
    .optional()
    .isIn(['TEXT', 'IMAGE', 'AUDIO', 'DOCUMENT'])
    .withMessage('Invalid message type'),
  handleValidationErrors
];

router.post('/conversations/:id/messages',
  clerkAuth,
  upload.single('file') as any,
  sendMessageValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'Please log in to send messages'
        });
        return;
      }

      const conversationId = req.params.id;
      const { content } = req.body;
      const file = req.file;

      // Validate that either content or file is provided
      if (!content && !file) {
        res.status(400).json({
          success: false,
          message: 'Message content or file required',
          error: 'Please provide message content or upload a file'
        });
        return;
      }

      // Check if conversation exists and user has access
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { customerId: req.user.customer?.id || '' },
            { vendorId: req.user.vendor?.id || '' }
          ]
        }
      });

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found',
          error: 'Conversation not found or access denied'
        });
        return;
      }

      // Determine sender type
      const senderType: SenderType = req.user.customer ? 'CUSTOMER' : 'VENDOR';
      const senderId = req.user.id;

      // Handle file upload if present
      let mediaUrl: string | null = null;
      let messageType: MessageType = 'TEXT';

      if (file) {
        try {
          const uploadResult = await UploadService.uploadSingleFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            'chat'
          );
          mediaUrl = uploadResult.originalUrl;

          // Determine message type based on file type
          if (file.mimetype.startsWith('image/')) {
            messageType = 'IMAGE';
          } else if (file.mimetype.startsWith('audio/')) {
            messageType = 'AUDIO';
          } else {
            messageType = 'DOCUMENT';
          }
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          res.status(500).json({
            success: false,
            message: 'Failed to upload file',
            error: 'File upload failed'
          });
          return;
        }
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          senderType,
          content: content || (file ? `Sent a ${messageType.toLowerCase()}` : ''),
          messageType,
          mediaUrl
        },
        include: {
          sender: {
            select: {
              id: true,
              customer: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
              vendor: {
                select: {
                  companyName: true
                }
              }
            }
          }
        }
      });

      // Update conversation's last message
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessage: content || `Sent a ${messageType.toLowerCase()}`,
          lastMessageAt: new Date()
        }
      });

      // Emit real-time message to conversation room
      const formattedMessage = {
        id: message.id,
        content: message.content,
        messageType: message.messageType,
        mediaUrl: message.mediaUrl,
        senderType: message.senderType,
        sender: message.senderType === 'CUSTOMER'
          ? `${message.sender.customer?.firstName} ${message.sender.customer?.lastName}`.trim()
          : message.sender.vendor?.companyName,
        isRead: false,
        createdAt: message.createdAt
      };

      // Emit to conversation room
      io.to(`conversation_${conversationId}`).emit('new_message', {
        conversationId,
        message: formattedMessage
      });

      // Emit to recipient's personal room for notifications
      const recipientType = senderType === 'CUSTOMER' ? 'vendor' : 'customer';
      const recipientId = senderType === 'CUSTOMER' ? conversation.vendorId : conversation.customerId;
      io.to(`${recipientType}_${recipientId}`).emit('message_notification', {
        conversationId,
        message: formattedMessage,
        senderName: formattedMessage.sender
      });

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message: formattedMessage }
      });

    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: 'Internal server error'
      });
    }
  }
);

// POST /conversations/start - Start new conversation with vendor
const startConversationValidation = [
  body('vendorId')
    .notEmpty()
    .withMessage('Vendor ID is required'),
  body('initialMessage')
    .optional()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Initial message must be between 1 and 1000 characters'),
  handleValidationErrors
];

router.post('/conversations/start',
  clerkAuth,
  startConversationValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.customer) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'Only customers can start conversations'
        });
        return;
      }

      const { vendorId, initialMessage } = req.body;

      // Check if vendor exists and is active
      const vendor = await prisma.vendor.findFirst({
        where: {
          id: vendorId,
          isActive: true,
          isApproved: true
        },
        select: {
          id: true,
          companyName: true
        }
      });

      if (!vendor) {
        res.status(404).json({
          success: false,
          message: 'Vendor not found',
          error: 'Vendor not found or not available for chat'
        });
        return;
      }

      // Check if conversation already exists
      let conversation = await prisma.conversation.findUnique({
        where: {
          customerId_vendorId: {
            customerId: req.user.customer.id,
            vendorId
          }
        }
      });

      // Create conversation if it doesn't exist
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            customerId: req.user.customer.id,
            vendorId
          }
        });
      } else {
        // Reactivate conversation if it was deactivated
        if (!conversation.isActive) {
          conversation = await prisma.conversation.update({
            where: { id: conversation.id },
            data: { isActive: true }
          });
        }
      }

      // Send initial message if provided
      let message = null;
      if (initialMessage) {
        message = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: req.user.id,
            senderType: 'CUSTOMER',
            content: initialMessage,
            messageType: 'TEXT'
          }
        });

        // Update conversation's last message
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessage: initialMessage,
            lastMessageAt: new Date()
          }
        });

        // Emit notification to vendor
        io.to(`vendor_${vendorId}`).emit('new_conversation', {
          conversationId: conversation.id,
          customer: `${req.user.customer.firstName} ${req.user.customer.lastName}`,
          initialMessage
        });
      }

      res.status(201).json({
        success: true,
        message: 'Conversation started successfully',
        data: {
          conversation: {
            id: conversation.id,
            vendorId,
            vendor: vendor,
            createdAt: conversation.createdAt
          },
          initialMessage: message
        }
      });

    } catch (error) {
      console.error('Start conversation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start conversation',
        error: 'Internal server error'
      });
    }
  }
);

export default router;