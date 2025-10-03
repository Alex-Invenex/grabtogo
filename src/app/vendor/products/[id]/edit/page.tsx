'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import ProductForm from '@/components/vendor/ProductForm';
import Link from 'next/link';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${resolvedParams.id}`);
        if (!response.ok) throw new Error('Failed to fetch product');

        const data = await response.json();
        setProduct(data.product);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Error',
          description: 'Failed to load product',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [resolvedParams.id, toast]);

  const handleSubmit = async (data: any) => {
    setSaving(true);

    try {
      // Upload new images if any
      const imageUrls: string[] = [...(product.images?.map((img: any) => img.url) || [])];

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

      // Update product
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
      };

      const response = await fetch(`/api/products/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });

      router.push('/vendor/products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update product',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Product not found</p>
        <Link href="/vendor/products">
          <Button className="mt-4">Back to Products</Button>
        </Link>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600 mt-1">Update product information</p>
          </div>
        </div>
        <Button form="product-form" type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Form */}
      <ProductForm
        onSubmit={handleSubmit}
        initialData={product}
        isSubmitting={saving}
        formId="product-form"
      />
    </div>
  );
}
