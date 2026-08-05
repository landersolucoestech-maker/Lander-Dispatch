import process from "node:process";
import { sql } from "drizzle-orm";
import { assertDevSeedTarget } from "./dev-seed-guard";
import { execFileSync } from "node:child_process";

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

const bankingQuery = await db.execute<{
  plaintext_count: number;
}>(sql`
  SELECT count(*)::int AS plaintext_count
  FROM crm_contacts
  WHERE account_number IS NOT NULL OR routing_number IS NOT NULL
`);
const bankingResult = bankingQuery.rows[0];

if ((bankingResult?.plaintext_count ?? 0) !== 0) {
  throw new Error(
    `Security invariant failed: ${bankingResult?.plaintext_count ?? 0} CRM contact records still contain plaintext banking numbers.`,
  );
}

const constraintsQuery = await db.execute<{ conname: string }>(sql`
  SELECT conname
  FROM pg_constraint
  WHERE conname IN (
    'crm_contacts_account_number_disabled',
    'crm_contacts_routing_number_disabled'
  )
`);

const constraintNames = new Set(
  constraintsQuery.rows.map((row: { conname: string }) => row.conname),
);
for (const expected of [
  "crm_contacts_account_number_disabled",
  "crm_contacts_routing_number_disabled",
]) {
  if (!constraintNames.has(expected)) {
    throw new Error(`Security invariant failed: missing constraint ${expected}.`);
  }
}

const auditQuery = await db.execute<{
  audit_logs_exists: boolean;
  legacy_audit_exists: boolean;
}>(sql`
  SELECT
    to_regclass('public.audit_logs') IS NOT NULL AS audit_logs_exists,
    to_regclass('public.audit_log') IS NOT NULL AS legacy_audit_exists
`);
const auditResult = auditQuery.rows[0];

if (!auditResult?.audit_logs_exists) {
  throw new Error("Security invariant failed: active audit_logs table is missing.");
}

console.log(
  JSON.stringify(
    {
      plaintextCrmBankingRecords: 0,
      bankingConstraints: [...constraintNames].sort(),
      activeAuditTable: "audit_logs",
      legacyAuditTablePreserved: auditResult.legacy_audit_exists,
    },
    null,
    2,
  ),
);
