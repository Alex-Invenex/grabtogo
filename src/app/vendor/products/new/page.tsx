'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ProductForm from '@/components/vendor/ProductForm';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data: any) => {
    setSaving(true);

    try {
      // Upload images first
      const imageUrls: string[] = [];

      for (const imageFile of data.imageFiles || []) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('bucket', 'product-images');

        const uploadResponse = await fetch('/api/vendor/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error('Failed to upload image');

        const uploadData = await uploadResponse.json();
        imageUrls.push(uploadData.url);
      }

      // Create product
      const productData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : null,
        category: data.category,
        sku: data.sku,
        barcode: data.barcode,
        stockQuantity: parseInt(data.stockQuantity),
        lowStockThreshold: parseInt(data.lowStockThreshold),
        weight: data.weight ? parseFloat(data.weight) : null,
        dimensions: data.dimensions || null,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        tags: data.tags || [],
        images: imageUrls.map((url, index) => ({
          url,
          altText: data.name,
          order: index,
        })),
        variants: data.variants || [],
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      toast({
        title: 'Success',
        description: 'Product created successfully',
      });

      router.push('/vendor/products');
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create product',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vendor/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-600 mt-1">Create a new product for your store</p>
          </div>
        </div>
        <Button
          form="product-form"
          type="submit"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Create Product
            </>
          )}
        </Button>
      </div>

      {/* Form */}
      <ProductForm
        onSubmit={handleSubmit}
        isSubmitting={saving}
        formId="product-form"
      />
    </div>
  );
}
