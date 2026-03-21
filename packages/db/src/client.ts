import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as publicSchema from './schema/public.js';
import { createTenantSchema } from './schema/tenant.js';

export function createDbClient(connectionString: string) {
  const sql = postgres(connectionString, {
    max: 10,
    prepare: false,
    idle_timeout: 60,
    connect_timeout: 2,
  });

  const db = drizzle(sql, { schema: publicSchema });

  return { db, sql };
}

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

// Creates the tenant schema in Postgres
// Lives here so it uses the same drizzle version as the rest of the db package
export async function provisionTenantSchema(
  connectionString: string,
  storeId: string
): Promise<void> {
  // Use raw postgres client — no drizzle needed for DDL
  const sql = postgres(connectionString, { max: 1, prepare: false });
  
  // Sanitize storeId — only allow alphanumeric and underscores
  const safeName = storeId.replace(/[^a-z0-9_]/g, '_');
  
  try {
    // Raw SQL string — no drizzle sql tag needed, avoids version conflict
    await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS "tenant_${safeName}"`);
  } finally {
    await sql.end();
  }
}

export type PublicDb = ReturnType<typeof createDbClient>['db'];
export type TenantDb = ReturnType<typeof createTenantDbClient>['db'];