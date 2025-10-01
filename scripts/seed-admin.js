const { PrismaClient } = require('../src/lib/prisma');
const { hash } = require('bcryptjs');

const db = new PrismaClient();

async function seedAdmin() {
  console.log('🌱 Creating GrabtoGo admin user...');

  try {
    const adminEmail = 'info@grabtogo.in';
    const adminPassword = 'admin';

    // Check if admin already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('👤 GrabtoGo admin user already exists');
      console.log(`📧 Login: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log(`🎯 Access: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin`);
      return;
    }

    // Hash the password
    const hashedPassword = await hash(adminPassword, 12);

    // Create admin user
    const admin = await db.user.create({
      data: {
        name: 'GrabtoGo Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
        isActive: true,
      },
    });

    console.log(`✅ Created GrabtoGo admin user: ${admin.email}`);
    console.log(`📧 Login: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`🎯 Access: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin`);
    console.log('\n⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating GrabtoGo admin user:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

seedAdmin();
