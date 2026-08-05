import { Router, type IRouter } from "express";
import { db, companyProfileTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateCompanyProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();
const COMPANY_PROFILE_ID = "d0000000-0000-4000-8000-000000000001";

async function getOrCreateProfile() {
  const [canonical] = await db
    .select()
    .from(companyProfileTable)
    .where(eq(companyProfileTable.id, COMPANY_PROFILE_ID));
  if (canonical) return canonical;

  const existing = await db.select().from(companyProfileTable).limit(2);
  if (existing.length > 1) {
    throw new Error(
      "company_profile contains multiple rows. Resolve the singleton conflict before continuing.",
    );
  }

  if (existing.length === 1) {
    const [normalized] = await db
      .update(companyProfileTable)
      .set({ id: COMPANY_PROFILE_ID })
      .where(eq(companyProfileTable.id, existing[0].id))
      .returning();
    return normalized;
  }

  const [created] = await db
    .insert(companyProfileTable)
    .values({
      id: COMPANY_PROFILE_ID,
      companyName: "LANDER DISPATCH",
    })
    .returning();
  return created;
}

router.get("/settings/company", async (_req, res): Promise<void> => {
  const profile = await getOrCreateProfile();
  res.json(profile);
});

router.patch("/settings/company", async (req, res): Promise<void> => {
  const parsed = UpdateCompanyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const profile = await getOrCreateProfile();
  const [updated] = await db
    .update(companyProfileTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(companyProfileTable.id, profile.id))
    .returning();
  res.json(updated);
});

export default router;
