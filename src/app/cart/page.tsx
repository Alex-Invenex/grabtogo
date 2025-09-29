'use client'

import * as React from 'react'
import { Minus, Plus, X, ShoppingBag, ArrowRight, Truck, Shield, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/components/auth/protected-route'

interface CartItem {
  id: string
  productId: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  vendor: {
    id: string
    name: string
    avatar?: string
  }
  quantity: number
  maxQuantity: number
  category: string
}

interface PromoCode {
  code: string
  discount: number
  type: 'percentage' | 'fixed'
  minOrder?: number
}

export default function CartPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [cartItems, setCartItems] = React.useState<CartItem[]>([])
  const [promoCode, setPromoCode] = React.useState('')
  const [appliedPromo, setAppliedPromo] = React.useState<PromoCode | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    // Mock cart data
    const mockCartItems: CartItem[] = [
      {
        id: '1',
        productId: 'prod1',
        name: 'Fresh Organic Mangoes',
        description: 'Sweet and juicy Alphonso mangoes',
        price: 450,
        originalPrice: 500,
        image: '/api/placeholder/150/150',
        vendor: {
          id: 'vendor1',
          name: 'Fresh Fruits Co',
          avatar: '/api/placeholder/32/32'
        },
        quantity: 2,
        maxQuantity: 10,
        category: 'Fruits'
      },
      {
        id: '2',
        productId: 'prod2',
        name: 'Wireless Bluetooth Earbuds',
        description: 'Premium sound quality with noise cancellation',
        price: 2999,
        originalPrice: 3999,
        image: '/api/placeholder/150/150',
        vendor: {
          id: 'vendor2',
          name: 'TechZone India',
          avatar: '/api/placeholder/32/32'
        },
        quantity: 1,
        maxQuantity: 5,
        category: 'Electronics'
      },
      {
        id: '3',
        productId: 'prod3',
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable and eco-friendly cotton t-shirt',
        price: 799,
        image: '/api/placeholder/150/150',
        vendor: {
          id: 'vendor3',
          name: 'EcoWear',
          avatar: '/api/placeholder/32/32'
        },
        quantity: 1,
        maxQuantity: 8,
        category: 'Clothing'
      }
    ]
    setCartItems(mockCartItems)
  }, [isAuthenticated, router])

  const availablePromoCodes: PromoCode[] = [
    {
      code: 'WELCOME10',
      discount: 10,
      type: 'percentage',
      minOrder: 500
    },
    {
      code: 'SAVE100',
      discount: 100,
      type: 'fixed',
      minOrder: 1000
    }
  ]

  const updateQuantity = (itemId: string, newQuantity: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, Math.min(newQuantity, item.maxQuantity)) }
          : item
      )
    )
  }

  const removeItem = (itemId: string) => {
    setCartItems(items => items.filter(item => item.id !== itemId))
  }

  const applyPromoCode = () => {
    const promo = availablePromoCodes.find(p => p.code === promoCode.toUpperCase())
    if (promo && (!promo.minOrder || subtotal >= promo.minOrder)) {
      setAppliedPromo(promo)
      setPromoCode('')
    }
  }

  const removePromoCode = () => {
    setAppliedPromo(null)
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const savings = cartItems.reduce((sum, item) => {
    const originalPrice = item.originalPrice || item.price
    return sum + ((originalPrice - item.price) * item.quantity)
  }, 0)

  const promoDiscount = appliedPromo
    ? appliedPromo.type === 'percentage'
      ? (subtotal * appliedPromo.discount) / 100
      : appliedPromo.discount
    : 0

  const deliveryFee = subtotal > 500 ? 0 : 40
  const total = subtotal - promoDiscount + deliveryFee

  const handleCheckout = () => {
    setIsLoading(true)
    // Simulate processing
    setTimeout(() => {
      router.push('/checkout')
    }, 1000)
  }

  if (!isAuthenticated) {
    return null
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <ShoppingBag className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
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
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Shopping Cart</h1>
            <Badge variant="secondary">{cartItems.length} items</Badge>
          </div>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm md:text-base">{item.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>

                          <div className="flex items-center space-x-2 mt-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={item.vendor.avatar} alt={item.vendor.name} />
                              <AvatarFallback className="text-xs">
                                {item.vendor.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{item.vendor.name}</span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">₹{item.price}</span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              ₹{item.originalPrice}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.maxQuantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Promo Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Promo Code</CardTitle>
            </CardHeader>
            <CardContent>
              {appliedPromo ? (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <span className="font-medium text-green-800">{appliedPromo.code}</span>
                    <span className="text-sm text-green-600 ml-2">
                      {appliedPromo.type === 'percentage'
                        ? `${appliedPromo.discount}% off`
                        : `₹${appliedPromo.discount} off`}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removePromoCode}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={applyPromoCode} disabled={!promoCode.trim()}>
                    Apply
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>

              {savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Savings</span>
                  <span>-₹{savings}</span>
                </div>
              )}

              {appliedPromo && (
                <div className="flex justify-between text-green-600">
                  <span>Promo ({appliedPromo.code})</span>
                  <span>-₹{promoDiscount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{total}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Proceed to Checkout'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Free Delivery</p>
                    <p className="text-xs text-muted-foreground">On orders above ₹500</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Secure Payment</p>
                    <p className="text-xs text-muted-foreground">SSL encrypted transactions</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">Easy Returns</p>
                    <p className="text-xs text-muted-foreground">7-day return policy</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}