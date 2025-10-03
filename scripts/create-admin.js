const { PrismaClient } = require('../src/lib/prisma');
const { hash } = require('bcryptjs');

const db = new PrismaClient();

async function createAdmin() {
  console.log('🌱 Creating admin user...');

  try {
    // Check if admin user already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: 'info@grabtogo.in' },
    });

    if (existingAdmin) {
      console.log('👤 Admin user already exists');
      console.log(`📧 Login: info@grabtogo.in`);
      console.log(`🔑 Password: admin`);
      console.log(`🎯 Access: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin`);
      return;
    }

    // Create admin user
    const hashedPassword = await hash('admin', 12);

    const adminUser = await db.user.create({
      data: {
        name: 'Admin User',
        email: 'info@grabtogo.in',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
        isActive: true,
      },
    });

    console.log(`✅ Created admin user: ${adminUser.email}`);
    console.log(`📧 Login: info@grabtogo.in`);
    console.log(`🔑 Password: admin`);
    console.log(`🎯 Access: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

createAdmin();
