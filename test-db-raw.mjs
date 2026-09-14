import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Check the actual column names
  const result = await prisma.$queryRaw`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'User' 
    ORDER BY ordinal_position;
  `;
  console.log('User table columns:', result);

  // Try to find the user with raw query
  const user = await prisma.$queryRaw`
    SELECT id, email, "passwordHash", "deletedAt", "bannedAt"
    FROM "User" 
    WHERE email = 'admin@localreach.test';
  `;
  console.log('\nUser data:', user);

  if (user && user.length > 0) {
    const u = user[0];
    console.log('\nPassword hash:', u.passwordHash);
    const ok = await bcrypt.compare('Admin123!', u.passwordHash);
    console.log('Password "Admin123!" matches:', ok);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());