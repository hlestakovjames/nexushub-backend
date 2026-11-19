import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be supplied at runtime.`);
  }
  return value;
}

async function main() {
  if (process.env.BOOTSTRAP_ADMIN_ENABLED !== 'true') {
    throw new Error(
      'Administrator bootstrap is disabled. Set BOOTSTRAP_ADMIN_ENABLED=true for this one-time operation.',
    );
  }

  const connectionString = required('DATABASE_URL');
  const email = required('BOOTSTRAP_ADMIN_EMAIL').toLowerCase();
  const firstName = required('BOOTSTRAP_ADMIN_FIRST_NAME');
  const lastName = required('BOOTSTRAP_ADMIN_LAST_NAME');
  const password = required('BOOTSTRAP_ADMIN_PASSWORD');
  const phone = process.env.BOOTSTRAP_ADMIN_PHONE?.trim() || null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('BOOTSTRAP_ADMIN_EMAIL must be a valid email address.');
  }

  if (password.length < 16) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain at least 16 characters.');
  }

  if (firstName.length > 100 || lastName.length > 100) {
    throw new Error('Administrator names must not exceed 100 characters.');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error(
        'An account with this email already exists. Bootstrap will not reset or modify an existing account.',
      );
    }

    const organization = await prisma.organizations.findUnique({
      where: { slug: 'nexus-hub' },
    });
    if (!organization) {
      throw new Error(
        'Nexus Hub organization is missing. Run the reference-data seed first.',
      );
    }

    // Temporary compatibility identifier: the application guard and
    // existing seeded databases still use "Global Admin". A separate
    // coordinated migration must rename this to "Global Administrator".
    const adminRole = await prisma.roles.findUnique({
      where: { name: 'Global Admin' },
    });
    if (!adminRole) {
      throw new Error(
        'Global Admin role is missing. Run the reference-data seed first.',
      );
    }

    const existingAdministrator = await prisma.user_roles.findFirst({
      where: { role_id: adminRole.id },
    });
    if (existingAdministrator) {
      throw new Error(
        'A Global Admin account is already assigned. This bootstrap is for initial provisioning only and cannot create additional administrators.',
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          id: randomUUID(),
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          password_hash: passwordHash,
          is_active: true,
          email_verified: false,
        },
      });

      await tx.user_roles.create({
        data: {
          user_id: user.id,
          role_id: adminRole.id,
        },
      });

      const membership = await tx.memberships.create({
        data: {
          id: randomUUID(),
          organization_id: organization.id,
          user_id: user.id,
          status: 'active',
        },
      });

      await tx.membership_roles.create({
        data: {
          membership_id: membership.id,
          role_id: adminRole.id,
        },
      });

      await tx.security_logs.create({
        data: {
          user_id: user.id,
          organization_id: organization.id,
          event_type: 'INITIAL_ADMIN_BOOTSTRAP',
          success: true,
          details: {
            method: 'controlled_one_time_bootstrap',
          },
        },
      });
    });

    console.log('Initial platform administrator provisioned successfully.');
    console.log(`Account: ${email}`);
    console.log('The bootstrap password was not printed or stored in plaintext.');
    console.log('Disable and remove bootstrap environment variables now.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Administrator bootstrap failed:', error.message);
  process.exitCode = 1;
});
