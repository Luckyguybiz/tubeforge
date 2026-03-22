# Database Migrations

Currently using `prisma db push` for schema changes.

To initialize migration history:
1. `npx prisma migrate dev --name init`
2. Commit the `prisma/migrations/` directory
3. Future changes: `npx prisma migrate dev --name description`

For production: `npx prisma migrate deploy`
