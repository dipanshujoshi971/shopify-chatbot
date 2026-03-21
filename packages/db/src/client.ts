import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as publicSchema from './schema/public.js';
import { createTenantSchema } from './schema/tenant.js';

// Public DB client — used for merchants, audit logs, billing
export function createDbClient(connectionString: string) {
  const sql = postgres(connectionString, {
    max: 10,
    prepare: false, // required for PgBouncer transaction mode
    idle_timeout: 60,
    connect_timeout: 2,
  });

  const db = drizzle(sql, { schema: publicSchema });

  return { db, sql };
}

// Tenant DB client — used for products, conversations, messages
// All table references are fully qualified: tenant_{storeId}.products
// This works correctly under PgBouncer transaction mode
export function createTenantDbClient(connectionString: string, storeId: string) {
  const sql = postgres(connectionString, {
    max: 10,
    prepare: false,
    idle_timeout: 60,
    connect_timeout: 2,
  });

  const tenantTables = createTenantSchema(storeId);
  const db = drizzle(sql, { schema: tenantTables });

  return { db, sql, schema: tenantTables };
}

export type PublicDb = ReturnType<typeof createDbClient>['db'];
export type TenantDb = ReturnType<typeof createTenantDbClient>['db'];