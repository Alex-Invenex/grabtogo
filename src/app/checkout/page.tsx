'use client'

import * as React from 'react'
import { ArrowLeft, CreditCard, Wallet, Building, MapPin, Phone, Mail, Shield, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuth } from '@/components/auth/protected-route'
import { useToast } from '@/hooks/use-toast'

const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  paymentMethod: z.enum(['razorpay', 'upi', 'netbanking', 'cod'], {
    message: 'Please select a payment method'
  }),
  specialInstructions: z.string().optional()
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  vendor: string
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = React.useState(false)

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: user?.email || '',
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ')[1] || '',
      paymentMethod: 'razorpay'
    }
  })

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => setRazorpayLoaded(true)
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [isAuthenticated, router])

  // Mock order data
  const orderItems: OrderItem[] = [
    {
      id: '1',
      name: 'Fresh Organic Mangoes (2x)',
      price: 900,
      quantity: 2,
      vendor: 'Fresh Fruits Co'
    },
    {
      id: '2',
      name: 'Wireless Bluetooth Earbuds (1x)',
      price: 2999,
      quantity: 1,
      vendor: 'TechZone India'
    },
    {
      id: '3',
      name: 'Organic Cotton T-Shirt (1x)',
      price: 799,
      quantity: 1,
      vendor: 'EcoWear'
    }
  ]

  const subtotal = 4698
  const deliveryFee = 0
  const promoDiscount = 470
  const total = subtotal - promoDiscount + deliveryFee

  const onSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true)

    try {
      if (data.paymentMethod === 'cod') {
        // Handle Cash on Delivery
        await simulateOrderCreation(data, 'cod')
        toast({
          title: 'Order Placed Successfully!',
          description: 'Your order will be delivered within 2-3 business days.'
        })
        router.push('/orders')
      } else if (data.paymentMethod === 'razorpay' && razorpayLoaded) {
        // Handle Razorpay payment
        await handleRazorpayPayment(data)
      } else {
        // Handle other payment methods
        await handleOtherPayments(data)
      }
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRazorpayPayment = async (data: CheckoutFormData) => {
    // Create order on backend (simulated)
    const orderResponse = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: total * 100, // Razorpay expects amount in paise
        currency: 'INR',
        items: orderItems,
        customerInfo: data
      })
    }).catch(() => ({
      ok: false,
      json: () => Promise.resolve({
        id: 'order_' + Math.random().toString(36).substr(2, 9),
        amount: total * 100,
        currency: 'INR'
      })
    }))

    const orderData = await orderResponse.json()

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_sample_key',
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'GrabtoGo',
      description: 'Purchase from GrabtoGo Marketplace',
      order_id: orderData.id,
      handler: async (response: any) => {
        // Verify payment on backend (simulated)
        await verifyPayment(response, data)
        toast({
          title: 'Payment Successful!',
          description: 'Your order has been placed successfully.'
        })
        router.push('/orders')
      },
      prefill: {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        contact: data.phone
      },
      theme: {
        color: '#000000'
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false)
        }
      }
    }

    const razorpay = new window.Razorpay(options)
    razorpay.open()
  }

  const handleOtherPayments = async (data: CheckoutFormData) => {
    // Simulate payment processing for UPI/NetBanking
    await new Promise(resolve => setTimeout(resolve, 2000))

    await simulateOrderCreation(data, data.paymentMethod)
    toast({
      title: 'Payment Successful!',
      description: 'Your order has been placed successfully.'
    })
    router.push('/orders')
  }

  const simulateOrderCreation = async (data: CheckoutFormData, paymentMethod: string) => {
    // Simulate order creation API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Order created:', { data, paymentMethod, total })
  }

  const verifyPayment = async (paymentResponse: any, orderData: CheckoutFormData) => {
    // Simulate payment verification
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('Payment verified:', paymentResponse, orderData)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mail className="h-5 w-5" />
                      <span>Contact Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Shipping Address</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="House number, street name, area" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="specialInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Instructions (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Any special delivery instructions..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Payment Method</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="space-y-3"
                            >
                              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                                <RadioGroupItem value="razorpay" id="razorpay" />
                                <Label htmlFor="razorpay" className="flex items-center space-x-2 cursor-pointer flex-1">
                                  <CreditCard className="h-4 w-4" />
                                  <span>Credit/Debit Card</span>
                                  <Badge variant="secondary" className="ml-auto">Recommended</Badge>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                                <RadioGroupItem value="upi" id="upi" />
                                <Label htmlFor="upi" className="flex items-center space-x-2 cursor-pointer flex-1">
                                  <Wallet className="h-4 w-4" />
                                  <span>UPI</span>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                                <RadioGroupItem value="netbanking" id="netbanking" />
                                <Label htmlFor="netbanking" className="flex items-center space-x-2 cursor-pointer flex-1">
                                  <Building className="h-4 w-4" />
                                  <span>Net Banking</span>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                                <RadioGroupItem value="cod" id="cod" />
                                <Label htmlFor="cod" className="flex items-center space-x-2 cursor-pointer flex-1">
                                  <Phone className="h-4 w-4" />
                                  <span>Cash on Delivery</span>
                                  <Badge variant="outline" className="ml-auto">₹40 extra</Badge>
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Place Order - ₹${total}`}
                </Button>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground">{item.vendor}</p>
                      </div>
                      <span>₹{item.price}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{promoDiscount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </CardContent>
            </Card>

            {/* Security Badge */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Secure Checkout</p>
                    <p className="text-xs text-muted-foreground">
                      Your payment information is encrypted and secure
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}