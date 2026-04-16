// apps/dashboard/src/lib/db.ts
// Dashboard-side DB singleton — same pattern as apps/api/src/db.ts
// Uses global to survive Next.js hot reloads in dev

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { merchants, auditLog, webhookEvents, tokenUsageDaily, embeddingUsage } from '@chatbot/db';

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
    // DB stores UTC in `timestamp` (without tz) columns. The default parser
    // does `new Date(x)` on the naive string, which JS treats as LOCAL time —
    // making timestamps appear off by the Node server's UTC offset once
    // serialized to the client. Override the `date` parser (same key replaces
    // the library default, which registers OIDs 1082/1114/1184) to force UTC
    // when no tz suffix is present.
    types: {
      date: {
        to: 1184,
        from: [1082, 1114, 1184],
        serialize: (x: Date | string) =>
          (x instanceof Date ? x : new Date(x)).toISOString(),
        parse: (x: string) => {
          // Already has a tz indicator (Z, +HH:MM, -HH:MM, +HH, -HH)
          if (/[Zz]$|[+\-]\d{2}:?\d{0,2}$/.test(x)) return new Date(x);
          // Date-only "YYYY-MM-DD" — V8 already treats this as UTC
          if (!/\d+:\d+/.test(x)) return new Date(x);
          // Naive timestamp — normalise to ISO-with-Z so it's parsed as UTC
          return new Date(x.replace(' ', 'T') + 'Z');
        },
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  global.__pg = pgPool;
}

export const db = drizzle(pgPool, {
  schema: { merchants, auditLog, webhookEvents, tokenUsageDaily, embeddingUsage },
});