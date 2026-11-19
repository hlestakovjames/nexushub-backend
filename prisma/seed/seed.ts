import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting Nexus Hub reference-data seed...');

  const organization = await prisma.organizations.upsert({
    where: { slug: 'nexus-hub' },
    update: {
      name: 'Nexus Hub',
      description: 'Nexus Hub digital innovation ecosystem',
      is_active: true,
    },
    create: {
      id: randomUUID(),
      name: 'Nexus Hub',
      slug: 'nexus-hub',
      description: 'Nexus Hub digital innovation ecosystem',
      is_active: true,
    },
  });

  console.log(`Organization ready: ${organization.name}`);

  // Keep the legacy role identifier until the coordinated role-name
  // migration updates guards, existing database records and consumers.
  const globalAdmin = await prisma.roles.upsert({
    where: { name: 'Global Admin' },
    update: {
      description: 'Platform-level administration across the Nexus Hub ecosystem',
      is_system_role: true,
    },
    create: {
      id: randomUUID(),
      name: 'Global Admin',
      description: 'Platform-level administration across the Nexus Hub ecosystem',
      is_system_role: true,
    },
  });

  const roleDefinitions = [
    {
      name: 'Organization Admin',
      description: 'Administrative access within an organization',
    },
    {
      name: 'Manager',
      description: 'Management access for assigned areas',
    },
    {
      name: 'Member',
      description: 'Standard member access',
    },
  ];

  for (const role of roleDefinitions) {
    await prisma.roles.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        is_system_role: true,
      },
      create: {
        id: randomUUID(),
        name: role.name,
        description: role.description,
        is_system_role: true,
      },
    });
  }

  console.log('System roles ready.');

  const permissionDefinitions = [
    ['users', 'create'],
    ['users', 'read'],
    ['users', 'update'],
    ['users', 'delete'],
    ['users', 'test'],
    ['roles', 'create'],
    ['roles', 'read'],
    ['roles', 'update'],
    ['roles', 'delete'],
    ['organizations', 'create'],
    ['organizations', 'read'],
    ['organizations', 'update'],
    ['organizations', 'delete'],
    ['departments', 'create'],
    ['departments', 'read'],
    ['departments', 'update'],
    ['departments', 'delete'],
    ['memberships', 'create'],
    ['memberships', 'read'],
    ['memberships', 'update'],
    ['memberships', 'delete'],
    ['settings', 'read'],
    ['settings', 'update'],
    ['audit', 'read'],
    ['security', 'read'],
  ] as const;

  const permissionRecords: Awaited<
    ReturnType<typeof prisma.permissions.upsert>
  >[] = [];

  for (const [module, action] of permissionDefinitions) {
    const permission = await prisma.permissions.upsert({
      where: {
        module_action: { module, action },
      },
      update: {},
      create: {
        id: randomUUID(),
        name: `${module}.${action}`,
        module,
        action,
      },
    });

    permissionRecords.push(permission);
  }

  console.log(`${permissionRecords.length} permissions ready.`);

  for (const permission of permissionRecords) {
    await prisma.role_permissions.upsert({
      where: {
        role_id_permission_id: {
          role_id: globalAdmin.id,
          permission_id: permission.id,
        },
      },
      update: {},
      create: {
        role_id: globalAdmin.id,
        permission_id: permission.id,
      },
    });
  }

  console.log('Global Admin permissions assigned.');
  console.log('Reference-data seed complete.');
  console.log('No administrator account or password was created or modified.');
}

main()
  .catch((error) => {
    console.error('Reference-data seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
