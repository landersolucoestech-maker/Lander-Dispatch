import { Router, type IRouter } from "express";
import { db, transactionsTable, carriersTable, invoicesTable } from "@workspace/db";
import { eq, ilike, or, desc, sql, and } from "drizzle-orm";
import {
  CreateTransactionBody, UpdateTransactionBody, ListTransactionsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichTransaction(t: typeof transactionsTable.$inferSelect) {
  const [carrier] = t.carrierId
    ? await db.select({ companyName: carriersTable.companyName }).from(carriersTable).where(eq(carriersTable.id, t.carrierId))
    : [null];
  const [invoice] = t.invoiceId
    ? await db.select({ invoiceNumber: invoicesTable.invoiceNumber }).from(invoicesTable).where(eq(invoicesTable.id, t.invoiceId))
    : [null];
  return {
    ...t,
    carrierName: carrier?.companyName ?? null,
    invoiceNumber: invoice?.invoiceNumber ?? null,
    amount: parseFloat(t.amount),
  };
}

async function generateTransactionId(): Promise<string> {
  const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable);
  const num = (result?.count ?? 0) + 1;
  return `TXN-${String(num).padStart(6, "0")}`;
}

router.get("/transactions/kpis", async (_req, res): Promise<void> => {
  const [income] = await db
    .select({ total: sql<number>`coalesce(sum(amount::numeric), 0)::float` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.type, "Income"), eq(transactionsTable.status, "Completed")));

  const [expenses] = await db
    .select({ total: sql<number>`coalesce(sum(amount::numeric), 0)::float` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.type, "Expense"), eq(transactionsTable.status, "Completed")));

  const [pending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactionsTable)
    .where(eq(transactionsTable.status, "Pending"));

  const totalIncome = income?.total ?? 0;
  const totalExpenses = expenses?.total ?? 0;

  res.json({
    totalIncome,
    totalExpenses,
    netBalance: Math.round((totalIncome - totalExpenses) * 100) / 100,
    pendingCount: pending?.count ?? 0,
  });
});

router.get("/transactions", async (req, res): Promise<void> => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  const { search, type, status, page = 1, pageSize = 20 } = parsed.success ? parsed.data : { search: undefined, type: undefined, status: undefined, page: 1, pageSize: 20 };

  const conditions = [];
  if (type) conditions.push(eq(transactionsTable.type, type));
  if (status) conditions.push(eq(transactionsTable.status, status));
  if (search) {
    conditions.push(or(
      ilike(transactionsTable.transactionId, `%${search}%`),
      ilike(transactionsTable.description, `%${search}%`),
      ilike(transactionsTable.category, `%${search}%`),
    ));
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(transactionsTable).where(where).orderBy(desc(transactionsTable.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const enriched = await Promise.all(data.map(enrichTransaction));

  res.json({ data: enriched, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const transactionId = await generateTransactionId();
  const [t] = await db.insert(transactionsTable).values({
    ...parsed.data,
    amount: String(parsed.data.amount),
    transactionId,
  } as typeof transactionsTable.$inferInsert).returning();
  res.status(201).json(await enrichTransaction(t));
});

router.get("/transactions/:transactionId", async (req, res): Promise<void> => {
  const { transactionId } = req.params as { transactionId: string };
  const [t] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, transactionId));
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichTransaction(t));
});

router.patch("/transactions/:transactionId", async (req, res): Promise<void> => {
  const { transactionId } = req.params as { transactionId: string };
  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { amount, ...rest } = parsed.data as { amount?: number; [key: string]: unknown };
  const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (amount !== undefined) updateData.amount = String(amount);
  const [t] = await db.update(transactionsTable).set(updateData as Partial<typeof transactionsTable.$inferInsert>).where(eq(transactionsTable.id, transactionId)).returning();
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichTransaction(t));
});

router.delete("/transactions/:transactionId", async (req, res): Promise<void> => {
  const { transactionId } = req.params as { transactionId: string };
  await db.delete(transactionsTable).where(eq(transactionsTable.id, transactionId));
  res.status(204).send();
});

export default router;
