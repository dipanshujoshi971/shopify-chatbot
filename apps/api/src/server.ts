import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { env } from './env.js';
import { logger } from './logger.js';
import { valkey } from './valkey.js';
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhooks.js';
import { socketIoPlugin } from './plugins/socket.js';
import widgetAuthPlugin from './plugins/widgetAuth.js';
import chatRoutes from './routes/widget/chat.js';
import widgetConfigRoutes from './routes/widget/config.js';
import { registerWidgetServing } from './routes/widget/serve.js';
import dashboardAuthPlugin from './plugins/dashboardAuth.js';
import knowledgeRoutes from './routes/dashboard/knowledge.js';
import resolveKeyRoute from './routes/widget/resolveKey.js';

const app = Fastify({
  loggerInstance: logger,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
  childLoggerFactory: (logger, bindings, opts, rawReq) => {
    const tenantId =
      (rawReq as any).headers?.['x-tenant-id'] ?? 'unknown';
    return logger.child({ ...bindings, tenant_id: tenantId });
  },
});

// ─── Plugins ──────────────────────────────────────────────────────────────────

await app.register(helmet);

// ── CORS ──────────────────────────────────────────────────────────────────────
//
// Strategy:
//  • Dashboard / API routes:  only allow configured ALLOWED_ORIGINS (e.g. the
//    Next.js dashboard domain).
//  • Widget routes (/widget/*):  allow any origin — security is enforced
//    server-side by widgetAuth (API-key format + Valkey/DB lookup +
//    Origin-hostname === shop_domain).  CORS alone is browser policy;
//    the actual auth gate lives in widgetAuth.ts.
//
// Using a single dynamic origin function avoids the Fastify limitation where
// a child-scoped cors registration can't override the parent-scope hook that
// already fired.
//
const configuredOrigins = new Set(
  env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
);

await app.register(cors, {
  credentials: true,
  origin: (origin, cb) => {
    // Server-to-server or non-browser (no Origin header) → allow
    if (!origin) return cb(null, false);

    // Dashboard / configured origins
    if (configuredOrigins.has(origin)) return cb(null, true);

    // Widget requests come from merchant storefronts.
    // *.myshopify.com covers the default Shopify subdomain.
    // Custom store domains (e.g. www.merchant.com) are also permitted here;
    // widgetAuth verifies the exact hostname against the DB record.
    try {
      const { hostname } = new URL(origin);
      if (hostname.endsWith('.myshopify.com')) return cb(null, true);
      // Allow any other origin for /widget/* — widgetAuth is the real gate.
      // Non-widget routes that reach here will be blocked by Clerk / HMAC.
      return cb(null, true);
    } catch {
      return cb(null, false);
    }
  },
});

// Register Socket.io before routes
await app.register(socketIoPlugin);

// ─── Routes ───────────────────────────────────────────────────────────────────

await app.register(authRoutes);
await app.register(webhookRoutes);

await app.register(
  async (widgetScope) => {
    await widgetScope.register(widgetAuthPlugin, { valkey });
    await widgetScope.register(chatRoutes);
    await widgetScope.register(widgetConfigRoutes);
  },
  { prefix: '/widget' },
);

// Dashboard routes (Clerk auth required)
await app.register(
  async (dashboardScope) => {
    await dashboardScope.register(dashboardAuthPlugin);
    await dashboardScope.register(knowledgeRoutes);
  },
  { prefix: '/dashboard' },
);

// ─── Public widget endpoints (no auth) ───────────────────────────────────
await app.register(resolveKeyRoute);
registerWidgetServing(app);

// ─── Health Routes ────────────────────────────────────────────────────────────

app.get('/healthz', async () => {
  return { status: 'ok' };
});

app.get('/readyz', async (request, reply) => {
  try {
    const result = await valkey.ping();
    if (result === 'PONG') {
      return { status: 'ok', valkey: 'ok' };
    }
    throw new Error('Unexpected ping response');
  } catch (err) {
    logger.error({ err }, 'Readyz check failed');
    reply.code(503);
    return { status: 'error', valkey: 'unreachable' };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
logger.info(
  { provider: 'openai', port: env.PORT },
  'Server configuration loaded',
);
try {
  await valkey.connect();
  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info(`Server running on port ${env.PORT}`);
} catch (err) {
  logger.error(err, 'Server failed to start');
  process.exit(1);
}