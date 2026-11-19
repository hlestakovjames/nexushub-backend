# Secure Initial Administrator Provisioning

This procedure replaces administrator credentials embedded in the reference-data seed.

## Important distinction

- `npx prisma db seed` creates/updates reference data: the Nexus Hub organisation, system roles, permissions and Global Admin permission assignments.
- `npm run bootstrap:admin` creates one initial administrator account once. It does not reset or modify an existing account.

The bootstrap script is intentionally not invoked automatically by the database seed or application startup.

## Prerequisites

1. Confirm the target database and environment before running any command.
2. Apply the required Prisma migrations.
3. Run the reference-data seed.
4. Use a trusted administrative workstation or controlled deployment environment.
5. Supply secrets through a secure secret manager or protected runtime environment injection. Do not put them in shell history, command-line arguments, source files, CI logs or committed `.env` files.

## Required runtime variables

- `DATABASE_URL`
- `BOOTSTRAP_ADMIN_ENABLED=true` — explicit opt-in guard
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_FIRST_NAME`
- `BOOTSTRAP_ADMIN_LAST_NAME`
- `BOOTSTRAP_ADMIN_PASSWORD` — minimum 16 characters; use a unique, randomly generated password
- `BOOTSTRAP_ADMIN_PHONE` — optional

## Procedure

1. Set the variables securely for a single controlled execution.
2. Run `npm run bootstrap:admin`.
3. Confirm the script reports successful creation without printing the password.
4. Immediately remove/unset all bootstrap variables and revoke the temporary secret-manager injection.
5. Store the credential in the organisation's approved password manager and require a password change at the earliest supported opportunity.
6. Confirm sign-in and administrator access through the intended application, then review audit/security logging.
7. Disable the bootstrap execution path after initial provisioning where operationally practical. The script itself is not a runtime API and is not called on server startup.

## Safety properties

- Explicit opt-in is required.
- The target user must not already exist; the script refuses to reset an existing account.
- A missing organisation or Global Admin role causes the operation to fail closed.
- User creation, global role assignment and organisation membership/role assignment occur in one database transaction.
- The password is bcrypt-hashed and never printed.
- The script sets `email_verified=false`; complete the actual email verification process rather than assuming bootstrap verifies mailbox ownership.

## Existing credential exposure response

The previous seed script contained a fixed administrator email/password pair. Treat the password as compromised even though it has now been removed from the current seed file.

- Rotate the credential immediately if it was ever used.
- Change any reused password on every other service.
- Revoke existing sessions/tokens where possible.
- Review access logs and account activity for suspicious use.
- Review Git history and any forks, clones, CI logs, deployment logs or backups that may contain the old source.
- History rewriting may reduce future exposure but does not make an exposed password safe; rotation is mandatory.

## Known follow-up

The current application guard and existing role records still use the legacy role identifier `Global Admin`. The agreed display/title is **Global Administrator**. A separate coordinated migration must update guards, role records, seed data, tests and dependent applications together. This bootstrap retains the legacy identifier temporarily to avoid silently breaking existing authorisation checks.
