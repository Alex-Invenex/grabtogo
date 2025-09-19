import { Server as SocketServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: 'CUSTOMER' | 'VENDOR';
  customerId?: string;
  vendorId?: string;
}

interface UserSession {
  socketId: string;
  userId: string;
  userType: 'CUSTOMER' | 'VENDOR';
  customerId?: string;
  vendorId?: string;
  isOnline: boolean;
  lastSeen: Date;
}

class ChatService {
  private io: SocketServer;
  private onlineUsers = new Map<string, UserSession>();

  constructor(io: SocketServer) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Authenticate socket connection
      socket.on('authenticate', async (data: { token: string }) => {
        try {
          await this.authenticateSocket(socket, data.token);
        } catch (error) {
          console.error('Socket authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
          socket.disconnect();
        }
      });

      // Join conversation room
      socket.on('join_conversation', async (data: { conversationId: string }) => {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        try {
          await this.joinConversation(socket, data.conversationId);
        } catch (error) {
          console.error('Join conversation error:', error);
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      // Leave conversation room
      socket.on('leave_conversation', (data: { conversationId: string }) => {
        socket.leave(`conversation_${data.conversationId}`);
        console.log(`Socket ${socket.id} left conversation ${data.conversationId}`);
      });

      // Handle typing indicators
      socket.on('typing_start', (data: { conversationId: string }) => {
        socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
          userId: socket.userId,
          userType: socket.userType,
          isTyping: true
        });
      });

      socket.on('typing_stop', (data: { conversationId: string }) => {
        socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
          userId: socket.userId,
          userType: socket.userType,
          isTyping: false
        });
      });

      // Handle message read status
      socket.on('mark_messages_read', async (data: { conversationId: string }) => {
        if (!socket.userId) return;

        try {
          await this.markMessagesAsRead(socket, data.conversationId);
        } catch (error) {
          console.error('Mark messages read error:', error);
        }
      });

      // Handle online status
      socket.on('update_status', (data: { status: 'online' | 'away' | 'busy' }) => {
        this.updateUserStatus(socket.userId!, data.status);
      });

      // Get online users in conversation
      socket.on('get_online_users', (data: { conversationId: string }) => {
        const onlineUsers = this.getOnlineUsersInConversation(data.conversationId);
        socket.emit('online_users', { conversationId: data.conversationId, users: onlineUsers });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        if (socket.userId) {
          this.handleUserDisconnect(socket.userId);
        }
      });

      // Error handling
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  private async authenticateSocket(socket: AuthenticatedSocket, token: string) {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: true,
        vendor: true
      }
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Set socket user information
    socket.userId = user.id;
    socket.userType = user.customer ? 'CUSTOMER' : 'VENDOR';
    socket.customerId = user.customer?.id;
    socket.vendorId = user.vendor?.id;

    // Join user-specific room for notifications
    const userRoom = user.customer ? `customer_${user.customer.id}` : `vendor_${user.vendor?.id}`;
    socket.join(userRoom);

    // Track online user
    this.onlineUsers.set(userId, {
      socketId: socket.id,
      userId,
      userType: socket.userType,
      customerId: socket.customerId,
      vendorId: socket.vendorId,
      isOnline: true,
      lastSeen: new Date()
    });

    // Emit authentication success
    socket.emit('authenticated', {
      userId,
      userType: socket.userType,
      customerId: socket.customerId,
      vendorId: socket.vendorId
    });

    // Broadcast user online status to relevant conversations
    await this.broadcastUserOnlineStatus(userId, true);

    console.log(`Socket ${socket.id} authenticated for user ${userId} (${socket.userType})`);
  }

  private async joinConversation(socket: AuthenticatedSocket, conversationId: string) {
    if (!socket.userId) {
      throw new Error('Socket not authenticated');
    }

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { customerId: socket.customerId || '' },
          { vendorId: socket.vendorId || '' }
        ]
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Join conversation room
    socket.join(`conversation_${conversationId}`);

    // Emit join confirmation
    socket.emit('conversation_joined', { conversationId });

    // Notify other participants
    socket.to(`conversation_${conversationId}`).emit('user_joined', {
      userId: socket.userId,
      userType: socket.userType,
      conversationId
    });

    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  }

  private async markMessagesAsRead(socket: AuthenticatedSocket, conversationId: string) {
    if (!socket.userId) return;

    // Only customers can mark vendor messages as read (and vice versa)
    const senderType = socket.userType === 'CUSTOMER' ? 'VENDOR' : 'CUSTOMER';

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderType,
        isRead: false
      },
      data: { isRead: true }
    });

    // Notify conversation participants about read status update
    socket.to(`conversation_${conversationId}`).emit('messages_read', {
      conversationId,
      readBy: socket.userId,
      userType: socket.userType
    });
  }

  private updateUserStatus(userId: string, status: 'online' | 'away' | 'busy') {
    const userSession = this.onlineUsers.get(userId);
    if (userSession) {
      userSession.isOnline = status === 'online';
      userSession.lastSeen = new Date();
      this.onlineUsers.set(userId, userSession);

      // Broadcast status change to relevant conversations
      this.broadcastUserOnlineStatus(userId, userSession.isOnline);
    }
  }

  private async broadcastUserOnlineStatus(userId: string, isOnline: boolean) {
    try {
      // Get user's conversations
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          customer: {
            include: {
              conversations: {
                select: { id: true }
              }
            }
          },
          vendor: {
            include: {
              conversations: {
                select: { id: true }
              }
            }
          }
        }
      });

      if (!user) return;

      const conversations = user.customer?.conversations || user.vendor?.conversations || [];

      // Broadcast to all conversation rooms
      conversations.forEach(conv => {
        this.io.to(`conversation_${conv.id}`).emit('user_status_change', {
          userId,
          isOnline,
          lastSeen: new Date()
        });
      });
    } catch (error) {
      console.error('Broadcast user status error:', error);
    }
  }

  private getOnlineUsersInConversation(conversationId: string): UserSession[] {
    const onlineUsers: UserSession[] = [];

    // Get all sockets in the conversation room
    const room = this.io.sockets.adapter.rooms.get(`conversation_${conversationId}`);
    if (room) {
      room.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId) as AuthenticatedSocket;
        if (socket?.userId) {
          const userSession = this.onlineUsers.get(socket.userId);
          if (userSession) {
            onlineUsers.push(userSession);
          }
        }
      });
    }

    return onlineUsers;
  }

  private handleUserDisconnect(userId: string) {
    const userSession = this.onlineUsers.get(userId);
    if (userSession) {
      userSession.isOnline = false;
      userSession.lastSeen = new Date();
      this.onlineUsers.set(userId, userSession);

      // Broadcast offline status
      this.broadcastUserOnlineStatus(userId, false);

      // Remove from online users after a delay (in case of quick reconnection)
      setTimeout(() => {
        const currentSession = this.onlineUsers.get(userId);
        if (currentSession && !currentSession.isOnline) {
          this.onlineUsers.delete(userId);
        }
      }, 30000); // 30 seconds delay
    }
  }

  // Public method to send notifications
  public async sendNotification(
    userId: string,
    type: 'message' | 'offer' | 'order' | 'general',
    data: any
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: true,
        vendor: true
      }
    });

    if (!user) return;

    const targetRoom = user.customer ? `customer_${user.customer.id}` : `vendor_${user.vendor?.id}`;

    this.io.to(targetRoom).emit('notification', {
      type,
      data,
      timestamp: new Date()
    });

    // Store notification in database
    await prisma.notification.create({
      data: {
        userId,
        title: data.title || 'New Notification',
        message: data.message,
        type,
        data: data
      }
    });
  }

  // Public method to broadcast to all users
  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  // Public method to get online users count
  public getOnlineUsersCount(): number {
    return Array.from(this.onlineUsers.values()).filter(user => user.isOnline).length;
  }

  // Public method to get user's online status
  public isUserOnline(userId: string): boolean {
    const userSession = this.onlineUsers.get(userId);
    return userSession?.isOnline || false;
  }

  // Public method to send message to specific user
  public async sendMessageToUser(userId: string, event: string, data: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: true,
        vendor: true
      }
    });

    if (!user) return;

    const targetRoom = user.customer ? `customer_${user.customer.id}` : `vendor_${user.vendor?.id}`;
    this.io.to(targetRoom).emit(event, data);
  }
}

export default ChatService;