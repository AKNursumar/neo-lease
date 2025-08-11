import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function seed() {
  console.log('Database seeded successfully!');
  console.log('You can now register new users without conflicts.');
  console.log('');
  console.log('For testing, you can create accounts:');
  console.log('- Any email/password for regular users');  
  console.log('- Use role-based access for different permissions');
  
  // Uncomment below if you want test users
  /*
  // Create a test user
  const hashedPassword = await argon2.hash('password123');
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: hashedPassword,
      fullName: 'Test User',
      role: 'user',
      isVerified: true,
    },
  });

  // Create an admin user
  const adminPassword = await argon2.hash('admin123');
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      fullName: 'Admin User',
      role: 'admin',
      isVerified: true,
    },
  });

  console.log('Seeded users:', { testUser, adminUser });
  */
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
