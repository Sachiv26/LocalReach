import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@localreach.test' },
    include: { roles: true },
  });

  if (!admin) {
    console.log('ERROR: admin@localreach.test NOT FOUND in database');
    const count = await prisma.user.count();
    console.log('Total users in DB:', count);
    const allUsers = await prisma.user.findMany({
      select: { email: true, deletedAt: true, bannedAt: true },
    });
    console.log('All users:', allUsers);
    return;
  }

  console.log('User found:', admin.email);
  console.log('Has password:', !!admin.passwordHash);
  console.log('Deleted:', admin.deletedAt);
  console.log('Banned:', admin.bannedAt);
  console.log('Roles:', admin.roles.map(r => r.role));

  // Test password
  const bcrypt = await import('bcryptjs');
  const testPasswords = ['Admin123!', 'admin123!', 'Admin123', 'password', 'demo'];
  for (const pw of testPasswords) {
    const ok = await bcrypt.compare(pw, admin.passwordHash);
    console.log(`Password "${pw}":`, ok ? 'MATCH' : 'no match');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());