import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

export interface SocketUser {
  id: string
  name: string
  role: string
  email: string
}

export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  message: string
  timestamp: Date
  type: 'text' | 'image' | 'file'
  status: 'sent' | 'delivered' | 'read'
}

export interface OrderUpdate {
  orderId: string
  status: string
  message: string
  timestamp: Date
  vendorId?: string
  customerId?: string
}

export interface Notification {
  id: string
  userId: string
  type: 'order' | 'message' | 'review' | 'vendor' | 'system'
  title: string
  message: string
  data?: any
  isRead: boolean
  timestamp: Date
}

export function initializeSocket(io: ServerIO) {
  io.use(async (socket, next) => {
    try {
      // Extract token from handshake auth
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Authentication error'))
      }

      // Verify JWT token (simplified - you'd want to properly verify the JWT)
      const user = await verifySocketToken(token)

      if (!user) {
        return next(new Error('Authentication error'))
      }

      socket.data.user = user
      next()
    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user as SocketUser
    console.log(`User ${user.name} connected:`, socket.id)

    // Join user to their personal room
    socket.join(`user:${user.id}`)

    // Join vendor-specific rooms if user is a vendor
    if (user.role === 'VENDOR') {
      socket.join(`vendor:${user.id}`)
    }

    // Handle joining chat rooms
    socket.on('join-chat', async (chatId: string) => {
      try {
        // Verify user has access to this chat
        const hasAccess = await verifyUserChatAccess(user.id, chatId)
        if (hasAccess) {
          socket.join(`chat:${chatId}`)
          socket.emit('joined-chat', { chatId })
        } else {
          socket.emit('error', { message: 'Access denied to chat room' })
        }
      } catch (error) {
        console.error('Error joining chat:', error)
        socket.emit('error', { message: 'Failed to join chat' })
      }
    })

    // Handle leaving chat rooms
    socket.on('leave-chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`)
      socket.emit('left-chat', { chatId })
    })

    // Handle sending messages
    socket.on('send-message', async (data: {
      chatId: string
      receiverId: string
      message: string
      type: 'text' | 'image' | 'file'
    }) => {
      try {
        // Save message to database
        const chatMessage = await saveChatMessage({
          senderId: user.id,
          receiverId: data.receiverId,
          message: data.message,
          type: data.type,
          chatId: data.chatId,
        })

        // Emit to chat room
        io.to(`chat:${data.chatId}`).emit('new-message', chatMessage)

        // Send notification to receiver if they're not in the chat
        const receiverSocketIds = await io.in(`user:${data.receiverId}`).allSockets()
        if (receiverSocketIds.size === 0) {
          await sendNotification({
            userId: data.receiverId,
            type: 'message',
            title: `New message from ${user.name}`,
            message: data.message.substring(0, 100),
            data: { chatId: data.chatId, senderId: user.id }
          })
        }
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Handle marking messages as read
    socket.on('mark-messages-read', async (data: { chatId: string, messageIds: string[] }) => {
      try {
        await markMessagesAsRead(data.messageIds, user.id)
        io.to(`chat:${data.chatId}`).emit('messages-read', {
          messageIds: data.messageIds,
          readBy: user.id
        })
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    })

    // Handle order status updates (for vendors)
    socket.on('update-order-status', async (data: {
      orderId: string
      status: string
      message?: string
    }) => {
      try {
        if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
          socket.emit('error', { message: 'Unauthorized' })
          return
        }

        // Update order status in database
        const order = await updateOrderStatus(data.orderId, data.status, user.id)

        if (order) {
          const orderUpdate: OrderUpdate = {
            orderId: data.orderId,
            status: data.status,
            message: data.message || `Order status updated to ${data.status}`,
            timestamp: new Date(),
            vendorId: user.id,
            customerId: order.userId,
          }

          // Emit to customer
          io.to(`user:${order.userId}`).emit('order-updated', orderUpdate)

          // Send notification
          await sendNotification({
            userId: order.userId,
            type: 'order',
            title: 'Order Status Update',
            message: orderUpdate.message,
            data: { orderId: data.orderId, status: data.status }
          })
        }
      } catch (error) {
        console.error('Error updating order status:', error)
        socket.emit('error', { message: 'Failed to update order status' })
      }
    })

    // Handle typing indicators
    socket.on('typing-start', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('user-typing', {
        userId: user.id,
        userName: user.name,
        chatId: data.chatId
      })
    })

    socket.on('typing-stop', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('user-stopped-typing', {
        userId: user.id,
        chatId: data.chatId
      })
    })

    // Handle vendor online status
    if (user.role === 'VENDOR') {
      socket.on('vendor-online', () => {
        socket.broadcast.emit('vendor-status-change', {
          vendorId: user.id,
          isOnline: true
        })
      })

      socket.on('vendor-offline', () => {
        socket.broadcast.emit('vendor-status-change', {
          vendorId: user.id,
          isOnline: false
        })
      })
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${user.name} disconnected:`, socket.id)

      if (user.role === 'VENDOR') {
        socket.broadcast.emit('vendor-status-change', {
          vendorId: user.id,
          isOnline: false
        })
      }
    })
  })
}

// Helper functions
async function verifySocketToken(token: string): Promise<SocketUser | null> {
  try {
    // This is a simplified version - you'd want to properly verify JWT
    // For now, we'll assume the token contains the user ID
    const user = await db.user.findUnique({
      where: { id: token }, // In real implementation, decode JWT to get user ID
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })

    return user ? {
      id: user.id,
      name: user.name || 'Anonymous',
      email: user.email,
      role: user.role,
    } : null
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

async function verifyUserChatAccess(userId: string, chatId: string): Promise<boolean> {
  try {
    // Check if user is part of this chat
    const chat = await db.chat.findFirst({
      where: {
        id: chatId,
        OR: [
          { participants: { some: { userId } } },
          { createdBy: userId }
        ]
      }
    })

    return !!chat
  } catch (error) {
    console.error('Chat access verification error:', error)
    return false
  }
}

async function saveChatMessage(data: {
  senderId: string
  receiverId: string
  message: string
  type: 'text' | 'image' | 'file'
  chatId: string
}): Promise<ChatMessage> {
  const message = await db.chatMessage.create({
    data: {
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.message,
      type: data.type,
      chatId: data.chatId,
      status: 'sent',
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        }
      }
    }
  })

  return {
    id: message.id,
    senderId: message.senderId,
    receiverId: message.receiverId,
    message: message.content,
    timestamp: message.createdAt,
    type: message.type as 'text' | 'image' | 'file',
    status: message.status as 'sent' | 'delivered' | 'read',
  }
}

async function markMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
  await db.chatMessage.updateMany({
    where: {
      id: { in: messageIds },
      receiverId: userId,
    },
    data: {
      status: 'read',
      readAt: new Date(),
    }
  })
}

async function updateOrderStatus(orderId: string, status: string, vendorId: string) {
  // Verify vendor owns this order
  const order = await db.order.findFirst({
    where: {
      id: orderId,
      items: {
        some: {
          product: {
            vendorId: vendorId
          }
        }
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  })

  if (!order) {
    throw new Error('Order not found or access denied')
  }

  // Update order status
  await db.order.update({
    where: { id: orderId },
    data: {
      status: status as any,
      updatedAt: new Date(),
    }
  })

  return order
}

async function sendNotification(notification: {
  userId: string
  type: 'order' | 'message' | 'review' | 'vendor' | 'system'
  title: string
  message: string
  data?: any
}): Promise<void> {
  await db.notification.create({
    data: {
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data ? JSON.stringify(notification.data) : null,
      isRead: false,
    }
  })
}