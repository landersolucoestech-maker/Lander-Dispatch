UPDATE "crm_contacts"
SET
  "account_number" = NULL,
  "routing_number" = NULL
WHERE
  "account_number" IS NOT NULL
  OR "routing_number" IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'crm_contacts_account_number_disabled'
  ) THEN
    ALTER TABLE "crm_contacts"
      ADD CONSTRAINT "crm_contacts_account_number_disabled"
      CHECK ("account_number" IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'crm_contacts_routing_number_disabled'
  ) THEN
    ALTER TABLE "crm_contacts"
      ADD CONSTRAINT "crm_contacts_routing_number_disabled"
      CHECK ("routing_number" IS NULL);
  END IF;
END
$$;

INSERT INTO "audit_logs" (
  "id",
  "actor_email",
  "action",
  "entity_type",
  "entity_id",
  "summary",
  "metadata",
  "created_at"
)
SELECT
  legacy."id",
  legacy."actor",
  legacy."action",
  COALESCE(legacy."entity_type", 'legacy_record'),
  legacy."entity_id",
  COALESCE(legacy."description", legacy."action"),
  jsonb_strip_nulls(
    jsonb_build_object(
      'migratedFrom', 'audit_log',
      'source', legacy."source",
      'approximateIp', legacy."approximate_ip",
      'legacyMetadata', legacy."metadata"
    )
  ),
  legacy."created_at"
FROM "audit_log" AS legacy
ON CONFLICT ("id") DO NOTHING;
