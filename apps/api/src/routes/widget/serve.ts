/**
 * apps/api/src/routes/widget/serve.ts
 *
 * GET /widget.iife.js
 *
 * Serves the built widget bundle from packages/widget/dist.
 * This lets the API server act as CDN for the widget script.
 *
 * No auth required — this is a public script tag embed.
 * Cached aggressively with ETag + Cache-Control.
 */

import type { FastifyPluginAsync } from 'fastify';
import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve to the monorepo widget dist
// In production this would be: /app/packages/widget/dist/widget.iife.js
// In dev: ../../packages/widget/dist/widget.iife.js (relative to apps/api/src/routes/widget/)
const WIDGET_PATH = resolve(__dirname, '../../../../../packages/widget/dist/widget.iife.js');

let cachedBundle: { content: Buffer; etag: string; mtime: number } | null = null;

async function loadBundle(): Promise<{ content: Buffer; etag: string } | null> {
  try {
    const s = await stat(WIDGET_PATH);
    const mtime = s.mtimeMs;

    // Return cached if file hasn't changed
    if (cachedBundle && cachedBundle.mtime === mtime) {
      return { content: cachedBundle.content, etag: cachedBundle.etag };
    }

    const content = await readFile(WIDGET_PATH);
    const etag = createHash('md5').update(content).digest('hex');
    cachedBundle = { content, etag, mtime };
    return { content, etag };
  } catch {
    return null;
  }
}

const serveWidget: FastifyPluginAsync = async (app) => {
  // Serve at the root level (not under /widget prefix)
  // This route is registered outside the widgetAuth scope
};

export default serveWidget;

/**
 * Register widget serving routes at the app root level.
 * Call this from server.ts OUTSIDE the /widget auth scope.
 */
export function registerWidgetServing(app: any) {
  app.get('/widget.iife.js', async (_request: any, reply: any) => {
    const bundle = await loadBundle();

    if (!bundle) {
      return reply.code(404).send('Widget bundle not found. Run: npm run build -w @chatbot/widget');
    }

    // Check If-None-Match for 304
    const ifNoneMatch = _request.headers['if-none-match'];
    if (ifNoneMatch === `"${bundle.etag}"`) {
      return reply.code(304).send();
    }

    return reply
      .header('Content-Type', 'application/javascript; charset=utf-8')
      .header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
      .header('ETag', `"${bundle.etag}"`)
      .header('Access-Control-Allow-Origin', '*')
      .header('Cross-Origin-Resource-Policy', 'cross-origin')
      .header('X-Content-Type-Options', 'nosniff')
      .send(bundle.content);
  });

  // Also serve a version endpoint
  app.get('/widget/version', async (_request: any, reply: any) => {
    const bundle = await loadBundle();
    return reply.send({
      available: !!bundle,
      etag: bundle?.etag ?? null,
      size: bundle ? bundle.content.length : 0,
    });
  });
}
