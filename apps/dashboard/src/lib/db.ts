// apps/dashboard/src/lib/db.ts
// Dashboard-side DB singleton — same pattern as apps/api/src/db.ts
// Uses global to survive Next.js hot reloads in dev

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { merchants, auditLog, webhookEvents } from '@chatbot/db';

declare global {
  // eslint-disable-next-line no-var
  var __pg: ReturnType<typeof postgres> | undefined;
}

export const pgPool: ReturnType<typeof postgres> =
  global.__pg ??
  postgres(process.env.DATABASE_URL!, {
    max: 10,
    prepare: false,
    idle_timeout: 60,
    connect_timeout: 2,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__pg = pgPool;
}

export const db = drizzle(pgPool, {
  schema: { merchants, auditLog, webhookEvents },
});