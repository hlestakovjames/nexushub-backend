import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  try {
    const roles = await prisma.roles.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    const permissions = await prisma.permissions.findMany({
      orderBy: [
        {
          module: 'asc',
        },
        {
          action: 'asc',
        },
      ],
    });

    const rolePermissions = await prisma.role_permissions.findMany({
      include: {
        roles: true,
        permissions: true,
      },
    });

    console.log('\n=== ROLES ===');
    console.dir(roles, { depth: null });

    console.log('\n=== PERMISSIONS ===');
    console.dir(permissions, { depth: null });

    console.log('\n=== ROLE PERMISSIONS ===');
    console.dir(rolePermissions, { depth: null });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});