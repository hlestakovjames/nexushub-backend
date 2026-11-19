# Nexus Hub Backend

Shared backend foundation for the Nexus Hub application ecosystem.

## Technology

- NestJS 11 / TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication and role/permission guards

## Setup

```bash
npm install
```

Configure `DATABASE_URL` through a secure environment variable or secret manager. Never commit credentials or production environment files.

## Database workflow

Apply migrations using the approved environment-specific procedure, then seed reference data:

```bash
npx prisma migrate deploy
npx prisma db seed
```

The reference-data seed creates the Nexus Hub organisation, system roles and permission records. It does not create, reset or print an administrator account or password.

## Initial administrator

Initial administrator provisioning is a separate, explicit, one-time operation:

```bash
npm run bootstrap:admin
```

The command requires `BOOTSTRAP_ADMIN_ENABLED=true` and the documented administrator variables to be supplied securely at runtime. It refuses to modify an existing account. Read [Secure Initial Administrator Provisioning](docs/SECURE-ADMIN-BOOTSTRAP.md) before running it.

Do not pass passwords as command-line arguments, place them in source control, or run the bootstrap against production until the target database and account owner have been confirmed. Rotate any credentials previously embedded in the old seed script.

## Run the application

```bash
npm run start:dev
npm run build
npm test
```

Build and test commands must be run in the intended development environment before release. Source changes alone do not establish deployment readiness.

## Security notes

- Public registration assigns the standard Member role; it must not accept privileged role selection.
- The current platform administrator role identifier remains `Global Admin` for compatibility with existing guards. The agreed title is **Global Administrator**; a coordinated database/code migration is still required.
- Review [the secure bootstrap procedure](docs/SECURE-ADMIN-BOOTSTRAP.md) and central ecosystem documentation before provisioning privileged accounts.
