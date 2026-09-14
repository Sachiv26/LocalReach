import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const users = await p.user.findMany({
  select: {
    email: true,
    roles: { select: { role: true } },
    communityAdminRoles: { select: { role: true } },
  },
});
console.log(JSON.stringify(
  users.map(u => ({ email: u.email, roles: u.roles.map(r=>r.role), adminOf: (u.communityAdminRoles||[]).map(a=>a.role) })),
  null, 2
));
await p.$disconnect();
