import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Connection pooling for production:
 *
 * Prisma uses a built-in connection pool. Configure via DATABASE_URL params:
 *   ?connection_limit=10        — max connections in pool (default: num_cpus * 2 + 1)
 *   &pool_timeout=10            — seconds to wait for a connection before erroring (default: 10)
 *
 * Example:
 *   DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=10"
 *
 * For serverless / edge deployments, consider using Prisma Accelerate or PgBouncer
 * as an external connection pooler to avoid exhausting DB connections.
 *
 * For PM2 cluster mode (multiple Node.js processes), set connection_limit to
 * max_db_connections / number_of_pm2_instances (e.g., 100 / 4 = 25 per instance).
 */
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
