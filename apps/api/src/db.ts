/**
 * apps/api/src/db.ts
 *
 * Why this file exists
 * ────────────────────
 * The original code called `createDbClient(env.DATABASE_URL)` inside every
 * route handler and plugin hook.  Each call creates a new postgres.js connection
 * pool (default max: 10).  Under load that means:
 *
 *   • Dozens of independent pools competing for the same PgBouncer slots
 *   • Every request paying the TCP + TLS handshake cost
 *   • Pool objects leaking because `sql.end()` was never called on them
 *
 * Fix: one module-level singleton shared by the entire process.
 * All route handlers MUST import { db, pgPool } from here.
 * Never call pgPool.end() — it lives until the process exits.
 */

import postgres   from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { merchants, auditLog, webhookEvents } from '@chatbot/db';
import { env } from './env.js';

/**
 * Shared postgres pool.
 *
 * max: 50 — works well with PgBouncer in transaction mode.  PgBouncer
 * multiplexes these 50 application-side connections onto far fewer actual
 * Postgres connections, so raising the number here is cheap.
 *
 * prepare: false — mandatory for PgBouncer transaction mode (named prepared
 * statements are connection-scoped and break under multiplexing).
 */
export const pgPool = postgres(env.DATABASE_URL, {
  max:             50,
  prepare:         false,
  idle_timeout:    60,
  connect_timeout: 2,
});

/**
 * Drizzle ORM client wired to the shared pool.
 * Covers the public schema: merchants, audit_log, webhook_events.
 */
export const db = drizzle(pgPool, {
  schema: { merchants, auditLog, webhookEvents },
});