#!/usr/bin/env node
/**
 * Delete all test vendor data from the database
 * This script removes all vendors and their related data
 */

// Import from the custom Prisma output location
const { PrismaClient } = require('../src/lib/prisma');

const prisma = new PrismaClient();

async function deleteTestVendors() {
  try {
    console.log('🗑️  Starting deletion of test vendor data...\n');

    // First, count what we have
    const vendorCount = await prisma.user.count({
      where: { role: 'VENDOR' },
    });

    const regCount = await prisma.vendorRegistrationRequest.count();

    console.log(`Found ${vendorCount} vendor users`);
    console.log(`Found ${regCount} registration requests\n`);

    if (vendorCount === 0 && regCount === 0) {
      console.log('✅ No vendor data to delete. Database is clean.\n');
      return;
    }

    // If no vendors but we have registration requests, just delete those
    if (vendorCount === 0 && regCount > 0) {
      console.log('No vendor users found, only registration requests.');
      console.log('Deleting all registration requests...\n');

      const deleted = await prisma.vendorRegistrationRequest.deleteMany();
      console.log(`✅ Deleted ${deleted.count} registration request(s)\n`);
      return;
    }

    console.log('⚠️  This will DELETE ALL vendor data. Press Ctrl+C to cancel...');
    console.log('Waiting 3 seconds...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    const deletedData = {
      vendorAnalytics: 0,
      storyViews: 0,
      vendorStories: 0,
      reviews: 0,
      orderItems: 0,
      orders: 0,
      payments: 0,
      productImages: 0,
      productVariants: 0,
      products: 0,
      vendorSubscriptions: 0,
      chatMessages: 0,
      chatParticipants: 0,
      chats: 0,
      vendorProfiles: 0,
      registrationRequests: 0,
      vendorUsers: 0,
    };

    // Delete in correct order to avoid foreign key constraints

    // 1. Delete vendor analytics
    console.log('Deleting vendor analytics...');
    deletedData.vendorAnalytics = (await prisma.vendorAnalytics.deleteMany({
      where: { vendor: { role: 'VENDOR' } },
    })).count;

    // 2. Delete story views
    console.log('Deleting story views...');
    deletedData.storyViews = (await prisma.storyView.deleteMany({
      where: { story: { vendor: { role: 'VENDOR' } } },
    })).count;

    // 3. Delete vendor stories
    console.log('Deleting vendor stories...');
    deletedData.vendorStories = (await prisma.vendorStory.deleteMany({
      where: { vendor: { role: 'VENDOR' } },
    })).count;

    // 4. Delete reviews (for products owned by vendors)
    console.log('Deleting reviews...');
    deletedData.reviews = (await prisma.review.deleteMany({
      where: { product: { vendor: { role: 'VENDOR' } } },
    })).count;

    // 5. Delete order items
    console.log('Deleting order items...');
    deletedData.orderItems = (await prisma.orderItem.deleteMany({
      where: { product: { vendor: { role: 'VENDOR' } } },
    })).count;

    // 6. Delete orders
    console.log('Deleting orders...');
    deletedData.orders = (await prisma.order.deleteMany({
      where: { vendor: { role: 'VENDOR' } },
    })).count;

    // 7. Delete payments
    console.log('Deleting payments...');
    deletedData.payments = (await prisma.payment.deleteMany({
      where: { order: { vendor: { role: 'VENDOR' } } },
    })).count;

    // 8. Delete product images
    console.log('Deleting product images...');
    deletedData.productImages = (await prisma.productImage.deleteMany({
      where: { product: { vendor: { role: 'VENDOR' } } },
    })).count;

    // 9. Delete product variants
    console.log('Deleting product variants...');
    deletedData.productVariants = (await prisma.productVariant.deleteMany({
      where: { product: { vendor: { role: 'VENDOR' } } },
    })).count;

    // 10. Delete products
    console.log('Deleting products...');
    deletedData.products = (await prisma.product.deleteMany({
      where: { vendor: { role: 'VENDOR' } },
    })).count;

    // 11. Delete vendor subscriptions
    console.log('Deleting vendor subscriptions...');
    deletedData.vendorSubscriptions = (await prisma.vendorSubscription.deleteMany({
      where: { user: { role: 'VENDOR' } },
    })).count;

    // 12. Delete chat messages
    console.log('Deleting chat messages...');
    deletedData.chatMessages = (await prisma.chatMessage.deleteMany({
      where: {
        OR: [
          { sender: { role: 'VENDOR' } },
          { chat: { vendor: { role: 'VENDOR' } } },
        ],
      },
    })).count;

    // 13. Delete chat participants
    console.log('Deleting chat participants...');
    deletedData.chatParticipants = (await prisma.chatParticipant.deleteMany({
      where: {
        OR: [
          { user: { role: 'VENDOR' } },
          { chat: { vendor: { role: 'VENDOR' } } },
        ],
      },
    })).count;

    // 14. Delete chats
    console.log('Deleting chats...');
    deletedData.chats = (await prisma.chat.deleteMany({
      where: { vendor: { role: 'VENDOR' } },
    })).count;

    // 15. Delete vendor profiles
    console.log('Deleting vendor profiles...');
    deletedData.vendorProfiles = (await prisma.vendorProfile.deleteMany({
      where: { user: { role: 'VENDOR' } },
    })).count;

    // 16. Delete vendor users
    console.log('Deleting vendor users...');
    deletedData.vendorUsers = (await prisma.user.deleteMany({
      where: { role: 'VENDOR' },
    })).count;

    // 17. Delete ALL registration requests (pending and approved)
    console.log('Deleting registration requests...');
    deletedData.registrationRequests = (await prisma.vendorRegistrationRequest.deleteMany()).count;

    const totalDeleted = Object.values(deletedData).reduce((a, b) => a + b, 0);

    console.log('\n✅ All vendor test data has been deleted successfully!\n');
    console.log('📊 Deletion Summary:');
    console.log('─'.repeat(40));
    Object.entries(deletedData).forEach(([key, count]) => {
      if (count > 0) {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        console.log(`${label.padEnd(30)} ${count}`);
      }
    });
    console.log('─'.repeat(40));
    console.log(`${'TOTAL DELETED'.padEnd(30)} ${totalDeleted}\n`);

  } catch (error) {
    console.error('\n❌ Error deleting test data:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteTestVendors();
