'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  ShoppingCart,
  MessageSquare,
  Star,
  Package,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/components/providers/socket-provider';
import { NotificationSkeleton } from '@/components/ui/loading-states';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'message' | 'review' | 'vendor' | 'system';
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const { unreadCount, markAsRead, markAllAsRead, isConnected } = useNotifications();
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');
  const [loading, setLoading] = React.useState(true);

  // Mock notifications for demonstration
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Order Confirmed',
      message: 'Your order #12345 for Fresh Mangoes has been confirmed',
      type: 'order',
      data: { orderId: '12345', vendorName: 'Fresh Fruits Co' },
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: 'New Message',
      message: 'Rajesh Kumar sent you a message about your order',
      type: 'message',
      data: { chatId: 'chat1', senderId: 'vendor1' },
      isRead: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      title: 'Order Delivered',
      message: 'Your order #12344 has been delivered successfully',
      type: 'order',
      data: { orderId: '12344', status: 'delivered' },
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      title: 'New Review',
      message: 'You received a 5-star review for Wireless Earbuds',
      type: 'review',
      data: { productId: 'prod1', rating: 5 },
      isRead: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      title: 'Subscription Expiring',
      message: 'Your premium subscription expires in 3 days',
      type: 'vendor',
      data: { subscriptionType: 'premium', daysLeft: 3 },
      isRead: true,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '6',
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Sunday 2 AM - 4 AM',
      type: 'system',
      data: { maintenanceDate: '2024-01-15T02:00:00Z' },
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  React.useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-green-600" />;
      case 'review':
        return <Star className="h-5 w-5 text-yellow-600" />;
      case 'vendor':
        return <ShoppingCart className="h-5 w-5 text-purple-600" />;
      case 'system':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredNotifications =
    filter === 'unread' ? mockNotifications.filter((n) => !n.isRead) : mockNotifications;

  const handleMarkAsRead = (notificationId: string) => {
    if (markAsRead) {
      markAsRead(notificationId);
    }
  };

  const handleMarkAllAsRead = () => {
    if (markAllAsRead) {
      markAllAsRead();
    }
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div
      className={`p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors ${
        !notification.isRead ? 'bg-primary/5' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4
                className={`text-sm font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {!notification.isRead && <div className="w-2 h-2 bg-primary rounded-full" />}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.isRead && (
                    <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                      <Check className="mr-2 h-4 w-4" />
                      Mark as read
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {(unreadCount > 0 || mockNotifications.filter((n) => !n.isRead).length > 0) && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount || mockNotifications.filter((n) => !n.isRead).length}
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} disabled={!isConnected}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          </div>
        </div>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'unread')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({mockNotifications.filter((n) => !n.isRead).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <NotificationSkeleton key={i} />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications found</p>
              <p className="text-sm mt-1">
                {filter === 'unread'
                  ? 'All caught up!'
                  : "You'll see notifications here when they arrive"}
              </p>
            </div>
          ) : (
            <div>
              {filteredNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Notification bell component for header
export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [showCenter, setShowCenter] = React.useState(false);

  // Mock unread count
  const mockUnreadCount = 3;

  return (
    <DropdownMenu open={showCenter} onOpenChange={setShowCenter}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {(unreadCount > 0 || mockUnreadCount > 0) && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount || mockUnreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] p-0">
        <NotificationCenter />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
