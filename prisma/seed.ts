import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@admin.com' },
  });

  if (existingAdmin) {
    console.log('👤 Admin user already exists');
    return;
  }

  // Create admin user
  const hashedPassword = await hash('admin', 12);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@admin.com',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      isActive: true,
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);
  console.log(`📧 Login: admin@admin.com`);
  console.log(`🔑 Password: admin`);
  console.log(`🎯 Access: /admin dashboard`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
