import { execFileSync } from "node:child_process";
import process from "node:process";
import { sql } from "drizzle-orm";
import { assertDevSeedTarget } from "./dev-seed-guard";

function currentBranch(): string {
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  try {
    return execFileSync("git", ["branch", "--show-current"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

assertDevSeedTarget({
  nodeEnv: process.env.NODE_ENV,
  appEnv: process.env.APP_ENV,
  confirmation: process.env.SEED_DEV_CONFIRM,
  branch: currentBranch(),
  databaseUrl: process.env.DATABASE_URL,
  allowedRemoteDatabase: process.env.SEED_DEV_ALLOWED_DATABASE,
});

const { db } = await import("@workspace/db");

await db.execute(sql`
  UPDATE crm_contacts
  SET account_number = NULL, routing_number = NULL
  WHERE account_number IS NOT NULL OR routing_number IS NOT NULL
`);

await db.execute(sql`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'crm_contacts_account_number_disabled'
    ) THEN
      ALTER TABLE crm_contacts
        ADD CONSTRAINT crm_contacts_account_number_disabled
        CHECK (account_number IS NULL);
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'crm_contacts_routing_number_disabled'
    ) THEN
      ALTER TABLE crm_contacts
        ADD CONSTRAINT crm_contacts_routing_number_disabled
        CHECK (routing_number IS NULL);
    END IF;
  END
  $$
`);

await db.execute(sql`
  INSERT INTO audit_logs (
    id,
    actor_email,
    action,
    entity_type,
    entity_id,
    summary,
    metadata,
    created_at
  )
  SELECT
    legacy.id,
    legacy.actor,
    legacy.action,
    COALESCE(legacy.entity_type, 'legacy_record'),
    legacy.entity_id,
    COALESCE(legacy.description, legacy.action),
    jsonb_strip_nulls(
      jsonb_build_object(
        'migratedFrom', 'audit_log',
        'source', legacy.source,
        'approximateIp', legacy.approximate_ip,
        'legacyMetadata', legacy.metadata
      )
    ),
    legacy.created_at
  FROM audit_log AS legacy
  ON CONFLICT (id) DO NOTHING
`);

console.log(
  "Development database hardening applied: plaintext CRM banking disabled and legacy audit history preserved.",
);
