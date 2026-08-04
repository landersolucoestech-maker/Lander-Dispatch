import { Router, type IRouter } from "express";
import { db, brokersTable, loadsTable } from "@workspace/db";
import { eq, ilike, or, desc, sql, and } from "drizzle-orm";
import {
  CreateBrokerBody,
  UpdateBrokerBody,
  ListBrokersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/brokers", async (req, res): Promise<void> => {
  const parsed = ListBrokersQueryParams.safeParse(req.query);
  const { search, status, page = 1, pageSize = 20 } = parsed.success ? parsed.data : { search: undefined, status: undefined, page: 1, pageSize: 20 };

  const conditions = [];
  if (status) conditions.push(eq(brokersTable.status, status));
  if (search) {
    conditions.push(or(
      ilike(brokersTable.companyName, `%${search}%`),
      ilike(brokersTable.primaryContact, `%${search}%`),
      ilike(brokersTable.mcNumber, `%${search}%`),
      ilike(brokersTable.email, `%${search}%`),
    ));
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(brokersTable).where(where).orderBy(desc(brokersTable.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(brokersTable).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  const enriched = await Promise.all(data.map(async (b) => {
    const [lastLoad] = await db
      .select({ date: loadsTable.dispatchDate })
      .from(loadsTable)
      .where(eq(loadsTable.brokerId, b.id))
      .orderBy(desc(loadsTable.createdAt))
      .limit(1);
    return { ...b, lastLoadDate: lastLoad?.date ?? null };
  }));

  res.json({ data: enriched, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

router.post("/brokers", async (req, res): Promise<void> => {
  const parsed = CreateBrokerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [broker] = await db.insert(brokersTable).values(parsed.data as typeof brokersTable.$inferInsert).returning();
  res.status(201).json({ ...broker, lastLoadDate: null });
});

router.get("/brokers/:brokerId", async (req, res): Promise<void> => {
  const { brokerId } = req.params as { brokerId: string };
  const [broker] = await db.select().from(brokersTable).where(eq(brokersTable.id, brokerId));
  if (!broker) { res.status(404).json({ error: "Not found" }); return; }
  const [lastLoad] = await db.select({ date: loadsTable.dispatchDate }).from(loadsTable).where(eq(loadsTable.brokerId, brokerId)).orderBy(desc(loadsTable.createdAt)).limit(1);
  res.json({ ...broker, lastLoadDate: lastLoad?.date ?? null });
});

router.patch("/brokers/:brokerId", async (req, res): Promise<void> => {
  const { brokerId } = req.params as { brokerId: string };
  const parsed = UpdateBrokerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [broker] = await db.update(brokersTable).set({ ...parsed.data, updatedAt: new Date() } as Partial<typeof brokersTable.$inferInsert>).where(eq(brokersTable.id, brokerId)).returning();
  if (!broker) { res.status(404).json({ error: "Not found" }); return; }
  const [lastLoad] = await db.select({ date: loadsTable.dispatchDate }).from(loadsTable).where(eq(loadsTable.brokerId, brokerId)).orderBy(desc(loadsTable.createdAt)).limit(1);
  res.json({ ...broker, lastLoadDate: lastLoad?.date ?? null });
});

router.delete("/brokers/:brokerId", async (req, res): Promise<void> => {
  const { brokerId } = req.params as { brokerId: string };
  await db.delete(brokersTable).where(eq(brokersTable.id, brokerId));
  res.status(204).send();
});

export default router;
