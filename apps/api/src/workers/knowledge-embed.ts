import { createWorker } from './base.js';
import { pgPool } from '../db.js';
import { r2 } from '../lib/r2.js';
import { getQueue } from '../lib/queue.js';
import { env } from '../env.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '../logger.js';
import { AzureOpenAI } from 'openai';
import { nanoid } from 'nanoid';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { encoding_for_model } from 'tiktoken';

// ── Types ────────────────────────────────────────────────────────────────────

interface EmbedJobData {
  knowledgeSourceId: string;
  shopDomain: string;
  tenantId: string;
  r2Key: string;
  fileType: 'pdf' | 'txt' | 'md' | 'docx';
}

// ── Constants ────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 500;       // tokens
const CHUNK_OVERLAP = 50;     // tokens
const EMBED_BATCH_SIZE = 100; // OpenAI max per request: 2048, but 100 keeps latency sane
const EMBED_MODEL = 'text-embedding-3-small'; // 1536 dimensions

// Exponential backoff delays for BullMQ retries (attempt 1 → 1s, 2 → 5s, 3 → 30s)
const BACKOFF_DELAYS = [1_000, 5_000, 30_000];

// ── Singletons ───────────────────────────────────────────────────────────────

const openai = new AzureOpenAI({
  apiKey: env.AZURE_API_KEY,
  endpoint: `https://${env.AZURE_RESOURCE_NAME}.openai.azure.com`,
});
const enc = encoding_for_model('gpt-4o'); // cl100k_base encoding

const log = logger.child({ worker: 'knowledge-embed' });

// ── Text extraction ──────────────────────────────────────────────────────────

async function fetchFileBuffer(r2Key: string): Promise<Buffer> {
  const res = await r2.send(
    new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: r2Key }),
  );
  const bytes = await res.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  switch (fileType) {
    case 'pdf': {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return result.text;
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case 'txt':
    case 'md':
      return buffer.toString('utf-8');
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

// ── Chunking ─────────────────────────────────────────────────────────────────

function chunkText(text: string): string[] {
  const tokens = enc.encode(text);

  if (tokens.length <= CHUNK_SIZE) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < tokens.length) {
    const end = Math.min(start + CHUNK_SIZE, tokens.length);
    const chunkTokens = tokens.slice(start, end);
    const decoded = new TextDecoder().decode(enc.decode(chunkTokens));
    chunks.push(decoded);

    // Advance by (CHUNK_SIZE - CHUNK_OVERLAP) to create overlap
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

// ── Embeddings ───────────────────────────────────────────────────────────────

async function generateEmbeddings(chunks: string[]): Promise<{ embeddings: number[][]; totalTokens: number }> {
  const allEmbeddings: number[][] = [];
  let totalTokens = 0;

  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const response = await openai.embeddings.create({
      model: EMBED_MODEL,
      input: batch,
    });

    totalTokens += response.usage.total_tokens;

    for (const item of response.data) {
      allEmbeddings.push(item.embedding);
    }
  }

  return { embeddings: allEmbeddings, totalTokens };
}

// ── Bulk insert ──────────────────────────────────────────────────────────────

async function insertChunks(
  schema: string,
  knowledgeSourceId: string,
  chunks: string[],
  embeddings: number[][],
): Promise<void> {
  // Build a single multi-row INSERT to minimise round-trips
  const values: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  for (let i = 0; i < chunks.length; i++) {
    const embeddingStr = `[${embeddings[i].join(',')}]`;
    values.push(
      `(gen_random_uuid(), $${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}::vector, $${paramIdx + 3})`,
    );
    params.push(knowledgeSourceId, chunks[i], embeddingStr, i);
    paramIdx += 4;
  }

  await pgPool.unsafe(
    `INSERT INTO "${schema}"."knowledge_chunks"
       (id, knowledge_source_id, content, embedding, chunk_index)
     VALUES ${values.join(', ')}`,
    params as any[],
  );
}

// ── Worker ───────────────────────────────────────────────────────────────────

export const knowledgeEmbedWorker = createWorker<EmbedJobData>(
  'knowledge-embed',
  async (job) => {
    const { knowledgeSourceId, shopDomain, tenantId, r2Key, fileType } = job.data;
    const s = `tenant_${tenantId.replace('store_', '').replace(/[^a-z0-9_]/g, '_')}`;

    log.info(
      { jobId: job.id, knowledgeSourceId, fileType },
      'processing knowledge source',
    );

    try {
      // 1 — Fetch file from R2
      const buffer = await fetchFileBuffer(r2Key);

      // 2 — Extract text
      const text = await extractText(buffer, fileType);

      if (!text.trim()) {
        throw new Error('Extracted text is empty');
      }

      // 3 — Chunk
      const chunks = chunkText(text);

      log.info(
        { jobId: job.id, knowledgeSourceId, chunkCount: chunks.length },
        'text chunked',
      );

      // 4 — Generate embeddings
      const { embeddings, totalTokens } = await generateEmbeddings(chunks);

      // 5 — Bulk insert chunks
      await insertChunks(s, knowledgeSourceId, chunks, embeddings);

      // 6 — Mark source as ready
      await pgPool.unsafe(
        `UPDATE "${s}"."knowledge_sources"
            SET status = 'ready', chunk_count = $1
          WHERE id = $2`,
        [chunks.length, knowledgeSourceId],
      );

      // 7 — Record embedding token usage in public schema
      const merchantRows = await pgPool.unsafe(
        `SELECT id FROM "merchants" WHERE shop_domain = $1 LIMIT 1`,
        [shopDomain],
      );
      const merchantId = merchantRows[0]?.id ?? shopDomain;

      await pgPool.unsafe(
        `INSERT INTO "embedding_usage"
           (id, merchant_id, knowledge_source_id, tokens_used, chunks_generated, model, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, now())`,
        [nanoid(), merchantId, knowledgeSourceId, totalTokens, chunks.length, EMBED_MODEL],
      );

      log.info(
        { jobId: job.id, knowledgeSourceId, chunkCount: chunks.length, embeddingTokens: totalTokens },
        'knowledge source ready',
      );
    } catch (err) {
      // Only mark as permanently failed on the last attempt
      const maxAttempts = job.opts.attempts ?? 3;
      if (job.attemptsMade >= maxAttempts) {
        await pgPool.unsafe(
          `UPDATE "${s}"."knowledge_sources"
              SET status = 'failed'
            WHERE id = $1`,
          [knowledgeSourceId],
        ).catch((dbErr) =>
          log.error({ dbErr, knowledgeSourceId }, 'failed to mark source as failed'),
        );
      }

      throw err; // re-throw so BullMQ handles retry
    }
  },
  {
    concurrency: 2,
    settings: {
      backoffStrategy: (attemptsMade: number) => {
        return BACKOFF_DELAYS[attemptsMade - 1] ?? 30_000;
      },
    },
  },
);

// Dead letter queue — move permanently failed jobs for inspection/replay
const DLQ_NAME = 'dead-knowledge-embed';

knowledgeEmbedWorker.on('failed', async (job, err) => {
  if (!job) return;
  const maxAttempts = job.opts.attempts ?? 3;
  if (job.attemptsMade >= maxAttempts) {
    const dlq = getQueue(DLQ_NAME);
    await dlq.add('dead', job.data, {
      attempts: 0,
      jobId: `dlq:${job.id}`,
    });
    log.warn(
      { jobId: job.id, knowledgeSourceId: (job.data as EmbedJobData).knowledgeSourceId, err },
      'job moved to dead letter queue',
    );
  }
});
