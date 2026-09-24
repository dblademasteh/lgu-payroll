import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const p = new PrismaClient();
const users = await p.user.findMany();
console.log('users:', users.length);
for (const u of users) {
  const ok = await bcrypt.compare('admin123', u.passwordHash);
  console.log(u.username, 'status=' + u.status, 'role=' + u.role, 'pw_ok=' + ok);
}
await p.$disconnect();