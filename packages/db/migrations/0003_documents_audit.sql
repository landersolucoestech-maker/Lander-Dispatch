CREATE TABLE IF NOT EXISTS "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "category" text DEFAULT 'Other' NOT NULL,
  "entity_type" text,
  "entity_id" text,
  "object_path" text NOT NULL,
  "content_type" text NOT NULL,
  "size" bigint NOT NULL,
  "notes" text,
  "uploaded_by_id" varchar,
  "uploaded_by_email" varchar,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone,
  CONSTRAINT "documents_object_path_unique" UNIQUE("object_path")
);

CREATE INDEX IF NOT EXISTS "documents_category_idx"
  ON "documents" USING btree ("category");
CREATE INDEX IF NOT EXISTS "documents_entity_idx"
  ON "documents" USING btree ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "documents_created_at_idx"
  ON "documents" USING btree ("created_at");

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_id" varchar,
  "actor_email" varchar,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text,
  "summary" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx"
  ON "audit_logs" USING btree ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx"
  ON "audit_logs" USING btree ("action");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"
  ON "audit_logs" USING btree ("created_at");
