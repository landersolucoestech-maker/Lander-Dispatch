ALTER TABLE "crm_leads"
  ADD COLUMN IF NOT EXISTS "converted_entity_type" text;

ALTER TABLE "crm_leads"
  ADD COLUMN IF NOT EXISTS "converted_entity_id" uuid;

CREATE INDEX IF NOT EXISTS "crm_leads_converted_entity_idx"
  ON "crm_leads" USING btree ("converted_entity_type", "converted_entity_id");
