import type { FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import { nanoid } from 'nanoid';
import { pgPool } from '../../db.js';
import { uploadToR2, deleteFromR2 } from '../../lib/r2.js';
import { getQueue } from '../../lib/queue.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXTENSIONS = new Set(['pdf', 'txt', 'md', 'docx']);

function fileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function tenantSchema(shopDomain: string): string {
  return `tenant_${shopDomain.replace(/[^a-z0-9]/g, '_')}`;
}

const knowledgeRoutes: FastifyPluginAsync = async (app) => {
  // Register multipart scoped to these routes only
  await app.register(multipart, {
    limits: { fileSize: MAX_FILE_SIZE },
  });

  // ── POST /dashboard/knowledge — upload a knowledge source ─────────────
  app.post('/knowledge', async (request, reply) => {
    const { shopDomain } = request;
    const s = tenantSchema(shopDomain);

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'No file provided. Send a multipart file upload.',
      });
    }

    const ext = fileExtension(data.filename);
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(data.mimetype)) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: `Unsupported file type. Allowed: pdf, txt, md, docx.`,
      });
    }

    const buffer = await data.toBuffer();

    if (buffer.length > MAX_FILE_SIZE) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'File exceeds 10 MB limit.',
      });
    }

    const knowledgeSourceId = nanoid();
    const r2Key = `${shopDomain}/${knowledgeSourceId}/${data.filename}`;

    // 1. Upload raw file to R2
    await uploadToR2(r2Key, buffer, data.mimetype);

    // 2. Insert knowledge_source row
    const rows = await pgPool.unsafe(
      `INSERT INTO "${s}"."knowledge_sources"
         (id, title, file_name, r2_key, status, chunk_count, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'processing', 0, now())
       RETURNING id, title, file_name, r2_key, status, chunk_count, created_at`,
      [data.filename, data.filename, r2Key],
    );

    const source = rows[0];

    // 3. Enqueue embedding job
    const queue = getQueue('knowledge-embed');
    await queue.add(
      'embed',
      {
        knowledgeSourceId: source.id,
        shopDomain,
        r2Key,
        fileType: ext,
      },
      {
        attempts: 3,
        backoff: { type: 'custom' },
      },
    );

    request.log.info(
      { knowledgeSourceId: source.id, fileName: data.filename },
      'knowledge source uploaded',
    );

    return reply.code(201).send(source);
  });

  // ── GET /dashboard/knowledge — list knowledge sources ─────────────────
  app.get('/knowledge', async (request, reply) => {
    const s = tenantSchema(request.shopDomain);

    const rows = await pgPool.unsafe(
      `SELECT id, title, file_name, r2_key, status, chunk_count, created_at
         FROM "${s}"."knowledge_sources"
        ORDER BY created_at DESC`,
    );

    return reply.send(rows);
  });

  // ── DELETE /dashboard/knowledge/:id — remove a knowledge source ───────
  app.delete<{ Params: { id: string } }>(
    '/knowledge/:id',
    async (request, reply) => {
      const { shopDomain } = request;
      const s = tenantSchema(shopDomain);
      const { id } = request.params;

      // Verify ownership and get r2_key in one query
      const rows = await pgPool.unsafe(
        `SELECT id, r2_key
           FROM "${s}"."knowledge_sources"
          WHERE id = $1`,
        [id],
      );

      if (!rows[0]) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Knowledge source not found.',
        });
      }

      const { r2_key } = rows[0];

      // Delete from R2 and DB in parallel — CASCADE handles chunks
      await Promise.all([
        deleteFromR2(r2_key),
        pgPool.unsafe(
          `DELETE FROM "${s}"."knowledge_sources" WHERE id = $1`,
          [id],
        ),
      ]);

      request.log.info({ knowledgeSourceId: id }, 'knowledge source deleted');

      return reply.code(204).send();
    },
  );
};

export default knowledgeRoutes;
