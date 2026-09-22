import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
console.log('Prisma client created');
await prisma.$connect();
console.log('Prisma connected');
process.exit(0);