import { Router, type IRouter } from "express";
import { db, companyProfileTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateCompanyProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateProfile() {
  const existing = await db.select().from(companyProfileTable).limit(1);
  if (existing.length) return existing[0];
  const [created] = await db.insert(companyProfileTable).values({ companyName: "LANDER DISPATCH" }).returning();
  return created;
}

router.get("/settings/company", async (_req, res): Promise<void> => {
  const profile = await getOrCreateProfile();
  res.json(profile);
});

router.patch("/settings/company", async (req, res): Promise<void> => {
  const parsed = UpdateCompanyProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const profile = await getOrCreateProfile();
  const [updated] = await db
    .update(companyProfileTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(companyProfileTable.id, profile!.id))
    .returning();
  res.json(updated);
});

export default router;
