#!/usr/bin/env node

/**
 * Database Schema Sync Checker
 *
 * This script verifies that the Prisma schema matches the actual database schema.
 * Run this before deploying or when you suspect schema mismatch issues.
 */

const { PrismaClient } = require('../src/lib/prisma');
const prisma = new PrismaClient();

async function checkDatabaseSync() {
  console.log('\n🔍 Checking database schema sync...\n');

  try {
    // Test critical tables and columns
    const tests = [
      {
        name: 'VendorRegistrationRequest - Admin Fields',
        query: async () => {
          return await prisma.$queryRaw`
            SELECT DISTINCT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'vendor_registration_requests'
            AND column_name IN ('approvedBy', 'approvedAt', 'rejectedBy', 'rejectedAt', 'rejectionReason', 'adminNotes')
            ORDER BY column_name;
          `;
        },
        expectedCount: 6,
      },
      {
        name: 'Users Table - Core Fields',
        query: async () => {
          return await prisma.$queryRaw`
            SELECT DISTINCT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name IN ('id', 'email', 'name', 'role', 'createdAt')
            ORDER BY column_name;
          `;
        },
        expectedCount: 5,
      },
      {
        name: 'Vendor Profiles Table',
        query: async () => {
          return await prisma.$queryRaw`
            SELECT DISTINCT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'vendor_profiles'
            AND column_name IN ('id', 'userId', 'storeName', 'isVerified')
            ORDER BY column_name;
          `;
        },
        expectedCount: 4,
      },
    ];

    let allPassed = true;

    for (const test of tests) {
      try {
        const result = await test.query();
        const passed = result.length === test.expectedCount;

        if (passed) {
          console.log(`✅ ${test.name}: ${result.length}/${test.expectedCount} columns found`);
        } else {
          console.log(`❌ ${test.name}: ${result.length}/${test.expectedCount} columns found`);
          console.log('   Found columns:', result.map(r => r.column_name).join(', '));
          allPassed = false;
        }
      } catch (error) {
        console.log(`❌ ${test.name}: Error - ${error.message}`);
        allPassed = false;
      }
    }

    console.log('\n' + '─'.repeat(60) + '\n');

    if (allPassed) {
      console.log('✅ All schema checks passed!\n');
      console.log('Your database schema is in sync with Prisma schema.\n');
      process.exit(0);
    } else {
      console.log('❌ Some schema checks failed!\n');
      console.log('⚠️  Your database schema is OUT OF SYNC with Prisma schema.\n');
      console.log('Fix it by running:\n');
      console.log('  npm run db:push');
      console.log('  npm run db:generate\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('\nMake sure your database is running and DATABASE_URL is correct.\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseSync();
