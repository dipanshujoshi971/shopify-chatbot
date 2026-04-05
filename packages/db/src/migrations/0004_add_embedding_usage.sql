CREATE TABLE "embedding_usage" (
  "id" text PRIMARY KEY NOT NULL,
  "merchant_id" text NOT NULL,
  "knowledge_source_id" text NOT NULL,
  "tokens_used" integer NOT NULL DEFAULT 0,
  "chunks_generated" integer NOT NULL DEFAULT 0,
  "model" text NOT NULL DEFAULT 'text-embedding-3-small',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "embedding_usage_merchant_idx" ON "embedding_usage" USING btree ("merchant_id");
CREATE INDEX "embedding_usage_created_at_idx" ON "embedding_usage" USING btree ("created_at");
