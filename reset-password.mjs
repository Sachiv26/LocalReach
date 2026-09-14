import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'Admin123!';
  const hash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.update({
    where: { email: 'admin@localreach.test' },
    data: { passwordHash: hash },
  });

  console.log('Password reset for:', admin.email);
  console.log('New hash:', hash);

  // Verify it works
  const ok = await bcrypt.compare(password, hash);
  console.log('Verification:', ok ? 'SUCCESS' : 'FAILED');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());