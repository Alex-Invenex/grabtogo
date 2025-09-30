'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = React.createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
  connect: () => {},
  disconnect: () => {},
});

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState<string | null>(null);
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = React.useRef(0);
  const maxReconnectAttempts = 5;

  const connect = React.useCallback(() => {
    if (socket?.connected || !session?.user) return;

    try {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
        auth: {
          token: session.user?.id,
          userId: session.user?.id,
          role: (session.user as any)?.role,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;

        // Join user-specific room
        if (session.user?.id) {
          newSocket.emit('join-user-room', session.user.id);
        }

        toast({
          title: 'Connected',
          description: 'Real-time features are now available',
        });
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);

        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect automatically
          setConnectionError('Disconnected by server');
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);

        // Exponential backoff for reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            newSocket.connect();
          }, delay);
        } else {
          toast({
            title: 'Connection Failed',
            description: 'Unable to connect to real-time services. Some features may be limited.',
            variant: 'destructive',
          });
        }
      });

      // Real-time event handlers
      newSocket.on('new-notification', (notification) => {
        toast({
          title: notification.title,
          description: notification.message,
        });
      });

      newSocket.on('order-update', (update) => {
        toast({
          title: 'Order Update',
          description: `Order #${update.orderId} status changed to ${update.status}`,
        });
      });

      newSocket.on('new-message', () => {
        // Handle new chat message
        // This will be used by the chat components
      });

      newSocket.on('typing-start', () => {
        // Handle typing indicator
      });

      newSocket.on('typing-stop', () => {
        // Handle typing indicator stop
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Failed to create socket connection:', error);
      setConnectionError('Failed to initialize connection');
    }
  }, [session, toast]);

  const disconnect = React.useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
    }
  }, [socket]);

  // Auto connect when user is authenticated
  React.useEffect(() => {
    if (session?.user && !socket) {
      connect();
    } else if (!session?.user && socket) {
      disconnect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [session, socket, connect, disconnect]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value = React.useMemo(
    () => ({
      socket,
      isConnected,
      connectionError,
      connect,
      disconnect,
    }),
    [socket, isConnected, connectionError, connect, disconnect]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

// Hook to use socket context
export function useSocket() {
  const context = React.useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Hook for chat functionality
export function useChat(chatId?: string) {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = React.useState<any[]>([]);
  const [typing, setTyping] = React.useState<string[]>([]);

  const sendMessage = React.useCallback(
    (message: string, chatId: string) => {
      if (socket && isConnected) {
        socket.emit('send-message', {
          chatId,
          message,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [socket, isConnected]
  );

  const startTyping = React.useCallback(
    (chatId: string) => {
      if (socket && isConnected) {
        socket.emit('typing-start', { chatId });
      }
    },
    [socket, isConnected]
  );

  const stopTyping = React.useCallback(
    (chatId: string) => {
      if (socket && isConnected) {
        socket.emit('typing-stop', { chatId });
      }
    },
    [socket, isConnected]
  );

  React.useEffect(() => {
    if (!socket || !chatId) return;

    const handleNewMessage = (message: any) => {
      if (message.chatId === chatId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleTypingStart = (data: any) => {
      if (data.chatId === chatId) {
        setTyping((prev) => [...prev.filter((id) => id !== data.userId), data.userId]);
      }
    };

    const handleTypingStop = (data: any) => {
      if (data.chatId === chatId) {
        setTyping((prev) => prev.filter((id) => id !== data.userId));
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('typing-start', handleTypingStart);
    socket.on('typing-stop', handleTypingStop);

    // Join chat room
    socket.emit('join-chat', chatId);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('typing-start', handleTypingStart);
      socket.off('typing-stop', handleTypingStop);
      socket.emit('leave-chat', chatId);
    };
  }, [socket, chatId]);

  return {
    messages,
    typing,
    sendMessage,
    startTyping,
    stopTyping,
    isConnected,
  };
}

// Hook for notifications
export function useNotifications() {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: any) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('new-notification', handleNewNotification);

    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [socket]);

  const markAsRead = React.useCallback(
    (notificationId: string) => {
      if (socket && isConnected) {
        socket.emit('mark-notification-read', notificationId);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    [socket, isConnected]
  );

  const markAllAsRead = React.useCallback(() => {
    if (socket && isConnected) {
      socket.emit('mark-all-notifications-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  }, [socket, isConnected]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isConnected,
  };
}
