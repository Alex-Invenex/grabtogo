'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Package, Percent, Calendar, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  images: { url: string }[];
}

export default function NewOfferPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stockLimit, setStockLimit] = useState('');

  // Fetch vendor products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?vendorOnly=true&isActive=true');
        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: 'Error',
          description: 'Failed to load products',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  // Set default dates
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);

    setStartDate(now.toISOString().slice(0, 16));
    setEndDate(tomorrow.toISOString().slice(0, 16));
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const calculateDiscountedPrice = () => {
    if (!selectedProduct || !discountValue) return 0;

    const value = parseFloat(discountValue);
    if (discountType === 'percentage') {
      return selectedProduct.price * (1 - value / 100);
    } else {
      return selectedProduct.price - value;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedProductId) {
      toast({
        title: 'Product required',
        description: 'Please select a product',
        variant: 'destructive',
      });
      return;
    }

    const value = parseFloat(discountValue);
    if (!value || value <= 0) {
      toast({
        title: 'Invalid discount',
        description: 'Please enter a valid discount value',
        variant: 'destructive',
      });
      return;
    }

    if (discountType === 'percentage' && value > 100) {
      toast({
        title: 'Invalid percentage',
        description: 'Discount percentage cannot exceed 100%',
        variant: 'destructive',
      });
      return;
    }

    if (discountType === 'fixed' && selectedProduct && value >= selectedProduct.price) {
      toast({
        title: 'Invalid discount',
        description: 'Fixed discount cannot be equal to or greater than product price',
        variant: 'destructive',
      });
      return;
    }

    const limit = parseInt(stockLimit);
    if (!limit || limit <= 0) {
      toast({
        title: 'Invalid stock limit',
        description: 'Please enter a valid stock limit',
        variant: 'destructive',
      });
      return;
    }

    if (selectedProduct && limit > selectedProduct.stockQuantity) {
      toast({
        title: 'Stock limit too high',
        description: `Maximum stock available is ${selectedProduct.stockQuantity}`,
        variant: 'destructive',
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      toast({
        title: 'Invalid dates',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      const offerData = {
        productId: selectedProductId,
        discountType,
        discountValue: value,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        stockLimit: limit,
      };

      const response = await fetch('/api/vendor/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create offer');
      }

      toast({
        title: 'Success',
        description: 'Offer created successfully',
      });

      router.push('/vendor/offers');
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create offer',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products available</h3>
        <p className="text-gray-600 mb-4">
          You need to add products before creating offers
        </p>
        <Link href="/vendor/products/new">
          <Button>Add Your First Product</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vendor/offers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Offer</h1>
            <p className="text-gray-600 mt-1">Set up a limited-time flash sale</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Product</CardTitle>
              <CardDescription>Choose the product you want to offer a discount on</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product">Product *</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - ₹{product.price.toFixed(2)} ({product.stockQuantity} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-4">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img
                      src={selectedProduct.images[0].url}
                      alt={selectedProduct.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{selectedProduct.name}</h3>
                    <p className="text-sm text-gray-600">
                      Regular Price: ₹{selectedProduct.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Stock: {selectedProduct.stockQuantity} units
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discount Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Discount Configuration</CardTitle>
              <CardDescription>Set up your discount details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Discount Type *</Label>
                <RadioGroup value={discountType} onValueChange={(value) => setDiscountType(value as 'percentage' | 'fixed')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage" className="font-normal cursor-pointer">
                      Percentage (%)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="font-normal cursor-pointer">
                      Fixed Amount (₹)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="discount-value">
                  Discount Value * {discountType === 'percentage' ? '(%)' : '(₹)'}
                </Label>
                <Input
                  id="discount-value"
                  type="number"
                  min="0"
                  step={discountType === 'percentage' ? '1' : '0.01'}
                  max={discountType === 'percentage' ? '100' : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 50.00'}
                />
              </div>

              <div>
                <Label htmlFor="stock-limit">Stock Limit *</Label>
                <Input
                  id="stock-limit"
                  type="number"
                  min="1"
                  value={stockLimit}
                  onChange={(e) => setStockLimit(e.target.value)}
                  placeholder="Number of units available for this offer"
                />
                {selectedProduct && (
                  <p className="text-sm text-gray-600 mt-1">
                    Maximum: {selectedProduct.stockQuantity} units
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Duration */}
          <Card>
            <CardHeader>
              <CardTitle>Offer Duration</CardTitle>
              <CardDescription>Set when your offer starts and ends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="start-date">Start Date & Time *</Label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="end-date">End Date & Time *</Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Offer Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProduct && discountValue ? (
                <>
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Percent className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold text-primary">
                        {discountType === 'percentage'
                          ? `${discountValue}% OFF`
                          : `₹${discountValue} OFF`}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 line-through">
                        ₹{selectedProduct.price.toFixed(2)}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        ₹{calculateDiscountedPrice().toFixed(2)}
                      </p>
                      <p className="text-sm text-green-600 font-medium">
                        You save ₹
                        {(selectedProduct.price - calculateDiscountedPrice()).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original Price:</span>
                      <span className="font-medium">₹{selectedProduct.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discounted Price:</span>
                      <span className="font-medium text-primary">
                        ₹{calculateDiscountedPrice().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Savings:</span>
                      <span className="font-medium text-green-600">
                        ₹{(selectedProduct.price - calculateDiscountedPrice()).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Stock Limit:</span>
                      <span className="font-medium">{stockLimit || 0} units</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">
                    Select a product and enter discount to see preview
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Offer...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Offer
                </>
              )}
            </Button>
            <Link href="/vendor/offers" className="block">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
