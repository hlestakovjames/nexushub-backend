import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting Nexus Hub database bootstrap...');

  // --------------------------------------------------
  // 1. ORGANIZATION
  // --------------------------------------------------

  const organization = await prisma.organizations.upsert({
    where: {
      slug: 'nexus-hub',
    },
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

  // --------------------------------------------------
  // 2. SYSTEM ROLES
  // --------------------------------------------------

  const globalAdmin = await prisma.roles.upsert({
    where: {
      name: 'Global Admin',
    },
    update: {
      description:
        'System owner with full administrative access across the entire Nexus Hub ecosystem',
      is_system_role: true,
    },
    create: {
      id: randomUUID(),
      name: 'Global Admin',
      description:
        'System owner with full administrative access across the entire Nexus Hub ecosystem',
      is_system_role: true,
    },
  });

  await prisma.roles.upsert({
    where: {
      name: 'Organization Admin',
    },
    update: {
      description: 'Administrative access within an organization',
      is_system_role: true,
    },
    create: {
      id: randomUUID(),
      name: 'Organization Admin',
      description: 'Administrative access within an organization',
      is_system_role: true,
    },
  });

  await prisma.roles.upsert({
    where: {
      name: 'Manager',
    },
    update: {
      description: 'Management access for assigned areas',
      is_system_role: true,
    },
    create: {
      id: randomUUID(),
      name: 'Manager',
      description: 'Management access for assigned areas',
      is_system_role: true,
    },
  });

  await prisma.roles.upsert({
    where: {
      name: 'Member',
    },
    update: {
      description: 'Standard member access',
      is_system_role: true,
    },
    create: {
      id: randomUUID(),
      name: 'Member',
      description: 'Standard member access',
      is_system_role: true,
    },
  });

  console.log('System roles ready.');

  // --------------------------------------------------
  // 3. PERMISSIONS
  // --------------------------------------------------

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
        module_action: {
          module,
          action,
        },
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

  // --------------------------------------------------
  // 4. GLOBAL ADMIN PERMISSIONS
  // --------------------------------------------------

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

  // --------------------------------------------------
  // 5. SYSTEM OWNER / GLOBAL ADMIN USER
  // --------------------------------------------------

  const email = 'khlestakov.james@gmail.com';
  const password = 'NexusAdmin123!';

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.users.upsert({
    where: {
      email,
    },
    update: {
      first_name: 'Hlestakov',
      last_name: 'James',
      phone: '0713290745',
      password_hash: passwordHash,
      is_active: true,
      email_verified: true,
    },
    create: {
      id: randomUUID(),
      first_name: 'Hlestakov',
      last_name: 'James',
      email,
      phone: '0713290745',
      password_hash: passwordHash,
      is_active: true,
      email_verified: true,
    },
  });

  console.log(`Global Admin user ready: ${user.email}`);

  // --------------------------------------------------
  // 6. GLOBAL ADMIN USER ROLE
  // --------------------------------------------------

  await prisma.user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: user.id,
        role_id: globalAdmin.id,
      },
    },
    update: {},
    create: {
      user_id: user.id,
      role_id: globalAdmin.id,
    },
  });

  console.log('Global Admin role assigned.');

  // --------------------------------------------------
  // 7. ORGANIZATION MEMBERSHIP
  // --------------------------------------------------

  const membership = await prisma.memberships.upsert({
    where: {
      organization_id_user_id: {
        organization_id: organization.id,
        user_id: user.id,
      },
    },
    update: {
      status: 'active',
    },
    create: {
      id: randomUUID(),
      organization_id: organization.id,
      user_id: user.id,
      status: 'active',
    },
  });

  console.log('Global Admin organization membership ready.');

  // --------------------------------------------------
  // 8. GLOBAL ADMIN MEMBERSHIP ROLE
  // --------------------------------------------------

  await prisma.membership_roles.upsert({
    where: {
      membership_id_role_id: {
        membership_id: membership.id,
        role_id: globalAdmin.id,
      },
    },
    update: {},
    create: {
      membership_id: membership.id,
      role_id: globalAdmin.id,
    },
  });

  console.log('Global Admin membership role configured.');

  // --------------------------------------------------
  // 9. FINAL BOOTSTRAP SUMMARY
  // --------------------------------------------------

  console.log('');
  console.log('======================================');
  console.log(' Nexus Hub Bootstrap Complete');
  console.log('======================================');
  console.log(`Organization: ${organization.name}`);
  console.log(`System Owner: ${user.first_name} ${user.last_name}`);
  console.log(`Admin email:  ${user.email}`);
  console.log(`Admin phone:  ${user.phone}`);
  console.log('Admin role:   Global Admin');
  console.log('======================================');
}

main()
  .catch((error) => {
    console.error('Bootstrap failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });