// Use the db instance from the project
const path = require('path');
const { createRequire } = require('module');
const projectRequire = createRequire(path.join(__dirname, '../src/lib/db.ts'));

let prisma;
try {
  // Try to import from the project's db.ts file
  const { db } = require('../src/lib/db');
  prisma = db;
} catch (error) {
  // Fallback to direct Prisma client
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
}

async function checkVendors() {
  try {
    console.log('🔍 Checking for vendor users...\n');

    // Check for VENDOR role users
    const vendors = await prisma.user.findMany({
      where: { role: 'VENDOR' },
      include: {
        vendorProfile: true,
      },
    });

    console.log(`Found ${vendors.length} vendor users:`);
    vendors.forEach((vendor, index) => {
      console.log(`\n${index + 1}. ${vendor.name || 'No Name'}`);
      console.log(`   Email: ${vendor.email}`);
      console.log(`   ID: ${vendor.id}`);
      console.log(`   Created: ${vendor.createdAt}`);
      console.log(`   Has Profile: ${vendor.vendorProfile ? 'Yes' : 'No'}`);
    });

    console.log('\n\n🔍 Checking for vendor registration requests...\n');

    // Check for registration requests
    const registrations = await prisma.vendorRegistrationRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${registrations.length} registration requests:`);
    registrations.forEach((reg, index) => {
      console.log(`\n${index + 1}. ${reg.companyName}`);
      console.log(`   Contact: ${reg.fullName} (${reg.email})`);
      console.log(`   ID: ${reg.id}`);
      console.log(`   Status: ${reg.status}`);
      console.log(`   Created: ${reg.createdAt}`);
    });

    if (vendors.length === 0 && registrations.length === 0) {
      console.log('\n✅ No vendor data found in database.');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVendors();
