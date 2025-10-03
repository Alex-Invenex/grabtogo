import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  shortDesc: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  quantity: z.number().int().nonnegative().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  publishedAt: z.string().datetime().optional(),
  images: z.array(z.object({
    id: z.string().optional(),
    url: z.string().url(),
    altText: z.string().optional(),
    sortOrder: z.number().int().nonnegative().default(0),
  })).optional(),
});

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can access this endpoint' }, { status: 403 });
    }

    const product = await db.product.findFirst({
      where: {
        id: params.id,
        vendorId: session.user.id!, // Ensure vendor owns this product
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            altText: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update product
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can update products' }, { status: 403 });
    }

    // Verify product belongs to vendor
    const existingProduct = await db.product.findFirst({
      where: {
        id: params.id,
        vendorId: session.user.id!,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // If slug is being updated, check uniqueness
    if (validatedData.slug && validatedData.slug !== existingProduct.slug) {
      const slugExists = await db.product.findFirst({
        where: {
          slug: validatedData.slug,
          vendorId: session.user.id!,
          id: { not: params.id },
        },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'A product with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = { ...validatedData };

    // Handle publishedAt conversion
    if (validatedData.publishedAt) {
      updateData.publishedAt = new Date(validatedData.publishedAt);
    }

    // Handle images separately if provided
    if (validatedData.images) {
      // Delete existing images and create new ones
      await db.productImage.deleteMany({
        where: { productId: params.id },
      });

      updateData.images = {
        create: validatedData.images.map((img, index) => ({
          url: img.url,
          altText: img.altText || validatedData.name || existingProduct.name,
          sortOrder: img.sortOrder || index,
        })),
      };
    }

    // Update product
    const product = await db.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            altText: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    // Clear products cache
    await cache.flushPattern('products:*');

    return NextResponse.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can delete products' }, { status: 403 });
    }

    // Verify product belongs to vendor
    const existingProduct = await db.product.findFirst({
      where: {
        id: params.id,
        vendorId: session.user.id!,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product has orders
    const orderCount = await db.orderItem.count({
      where: { productId: params.id },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete product with existing orders. Consider marking it as inactive instead.',
        },
        { status: 400 }
      );
    }

    // Delete product (images will be cascaded)
    await db.product.delete({
      where: { id: params.id },
    });

    // Clear products cache
    await cache.flushPattern('products:*');

    return NextResponse.json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
