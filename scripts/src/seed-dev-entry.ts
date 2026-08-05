import { execFileSync } from "node:child_process";
import process from "node:process";
import { eq } from "drizzle-orm";
import { assertDevSeedTarget } from "./dev-seed-guard";

const COMPANY_PROFILE_ID = "d0000000-0000-4000-8000-000000000001";

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

const { companyProfileTable, db } = await import("@workspace/db");

const [canonical] = await db
  .select({ id: companyProfileTable.id })
  .from(companyProfileTable)
  .where(eq(companyProfileTable.id, COMPANY_PROFILE_ID));

if (!canonical) {
  const existingProfiles = await db
    .select({ id: companyProfileTable.id })
    .from(companyProfileTable)
    .limit(2);

  if (existingProfiles.length === 1) {
    await db
      .update(companyProfileTable)
      .set({ id: COMPANY_PROFILE_ID })
      .where(eq(companyProfileTable.id, existingProfiles[0].id));

    console.log(
      `Normalized legacy company profile ${existingProfiles[0].id} to the development singleton ID.`,
    );
  } else if (existingProfiles.length > 1) {
    throw new Error(
      "Development seed refused: company_profile contains multiple legacy rows. Resolve the singleton conflict before seeding.",
    );
  }
}

await import("./seed-dev");
await import("./harden-dev-database");
