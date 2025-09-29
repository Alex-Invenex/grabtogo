'use client'

import * as React from 'react'
import { Package, Truck, CheckCircle, Clock, X, ArrowRight, Star, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/auth/protected-route'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  vendor: {
    id: string
    name: string
    avatar?: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  items: OrderItem[]
  total: number
  createdAt: string
  estimatedDelivery?: string
  deliveredAt?: string
  trackingNumber?: string
  paymentMethod: 'razorpay' | 'upi' | 'netbanking' | 'cod'
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
  }
}

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState('all')

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  const mockOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-12345',
      status: 'delivered',
      items: [
        {
          id: '1',
          name: 'Fresh Organic Mangoes',
          price: 450,
          quantity: 2,
          image: '/api/placeholder/80/80',
          vendor: {
            id: 'vendor1',
            name: 'Fresh Fruits Co',
            avatar: '/api/placeholder/32/32'
          }
        }
      ],
      total: 900,
      createdAt: '2024-01-25T10:30:00Z',
      deliveredAt: '2024-01-27T14:20:00Z',
      trackingNumber: 'TRK123456789',
      paymentMethod: 'razorpay',
      shippingAddress: {
        name: 'John Doe',
        address: '123 Main St, Apartment 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      }
    },
    {
      id: '2',
      orderNumber: 'ORD-12346',
      status: 'shipped',
      items: [
        {
          id: '2',
          name: 'Wireless Bluetooth Earbuds',
          price: 2999,
          quantity: 1,
          image: '/api/placeholder/80/80',
          vendor: {
            id: 'vendor2',
            name: 'TechZone India',
            avatar: '/api/placeholder/32/32'
          }
        }
      ],
      total: 2999,
      createdAt: '2024-01-27T15:45:00Z',
      estimatedDelivery: '2024-01-30T18:00:00Z',
      trackingNumber: 'TRK123456790',
      paymentMethod: 'upi',
      shippingAddress: {
        name: 'John Doe',
        address: '123 Main St, Apartment 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      }
    },
    {
      id: '3',
      orderNumber: 'ORD-12347',
      status: 'confirmed',
      items: [
        {
          id: '3',
          name: 'Organic Cotton T-Shirt',
          price: 799,
          quantity: 1,
          image: '/api/placeholder/80/80',
          vendor: {
            id: 'vendor3',
            name: 'EcoWear',
            avatar: '/api/placeholder/32/32'
          }
        }
      ],
      total: 799,
      createdAt: '2024-01-28T09:15:00Z',
      estimatedDelivery: '2024-02-02T18:00:00Z',
      paymentMethod: 'cod',
      shippingAddress: {
        name: 'John Doe',
        address: '123 Main St, Apartment 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      }
    },
    {
      id: '4',
      orderNumber: 'ORD-12348',
      status: 'cancelled',
      items: [
        {
          id: '4',
          name: 'Premium Coffee Beans',
          price: 650,
          quantity: 2,
          image: '/api/placeholder/80/80',
          vendor: {
            id: 'vendor4',
            name: 'Brew Masters',
            avatar: '/api/placeholder/32/32'
          }
        }
      ],
      total: 1300,
      createdAt: '2024-01-20T12:00:00Z',
      paymentMethod: 'netbanking',
      shippingAddress: {
        name: 'John Doe',
        address: '123 Main St, Apartment 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      }
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'confirmed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Confirmed</Badge>
      case 'shipped':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Shipped</Badge>
      case 'delivered':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Delivered</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'shipped':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <Package className="h-4 w-4" />
      case 'cancelled':
        return <X className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const filteredOrders = activeTab === 'all'
    ? mockOrders
    : mockOrders.filter(order => order.status === activeTab)

  if (!isAuthenticated) {
    return null
  }

  if (mockOrders.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <Package className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">No orders yet</h1>
          <p className="text-muted-foreground mb-6">
            You haven't placed any orders yet. Start shopping to see your orders here!
          </p>
          <Button onClick={() => router.push('/products')} size="lg">
            Start Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No {activeTab === 'all' ? '' : activeTab} orders found</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span>Order {order.orderNumber}</span>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(order.status)}
                        <p className="text-sm font-medium mt-1">₹{order.total}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={item.vendor.avatar} alt={item.vendor.name} />
                                <AvatarFallback className="text-xs">
                                  {item.vendor.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">{item.vendor.name}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{item.price}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Order Status & Actions */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        {order.status === 'shipped' && order.estimatedDelivery && (
                          <p className="text-sm text-muted-foreground">
                            Expected delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}
                          </p>
                        )}
                        {order.status === 'delivered' && order.deliveredAt && (
                          <p className="text-sm text-green-600">
                            Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-IN')}
                          </p>
                        )}
                        {order.trackingNumber && (order.status === 'shipped' || order.status === 'delivered') && (
                          <p className="text-sm text-muted-foreground">
                            Tracking: {order.trackingNumber}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {order.status === 'delivered' && (
                          <>
                            <Button variant="outline" size="sm">
                              <Star className="h-4 w-4 mr-1" />
                              Rate
                            </Button>
                            <Button variant="outline" size="sm">
                              Buy Again
                            </Button>
                          </>
                        )}
                        {(order.status === 'shipped' || order.status === 'confirmed') && (
                          <Button variant="outline" size="sm">
                            <Truck className="h-4 w-4 mr-1" />
                            Track Order
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Contact Vendor
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}