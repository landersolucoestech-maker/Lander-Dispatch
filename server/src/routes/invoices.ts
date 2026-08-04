import { Router, type IRouter } from "express";
import { db, invoicesTable, invoicePaymentsTable, invoiceLoadsTable, carriersTable, transactionsTable } from "@workspace/db";
import { eq, ilike, or, desc, sql, and, inArray } from "drizzle-orm";
import {
  CreateInvoiceBody, UpdateInvoiceBody, ListInvoicesQueryParams, RecordInvoicePaymentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeStatus(total: number, amountPaid: number, dueDate: string | null): string {
  if (amountPaid >= total) return "Fully Paid";
  const today = new Date().toISOString().split("T")[0];
  if (dueDate && dueDate < today && amountPaid < total) return "Overdue";
  if (amountPaid > 0 && amountPaid < total) return "Partially Paid";
  return "Pending";
}

async function enrichInvoice(inv: typeof invoicesTable.$inferSelect) {
  const [carrier] = inv.carrierId
    ? await db.select({ companyName: carriersTable.companyName }).from(carriersTable).where(eq(carriersTable.id, inv.carrierId))
    : [null];

  const payments = await db.select().from(invoicePaymentsTable).where(eq(invoicePaymentsTable.invoiceId, inv.id)).orderBy(desc(invoicePaymentsTable.createdAt));
  const amountPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const total = parseFloat(inv.total ?? "0");
  const balance = Math.max(0, total - amountPaid);

  const loadLinks = await db.select({ loadId: invoiceLoadsTable.loadId }).from(invoiceLoadsTable).where(eq(invoiceLoadsTable.invoiceId, inv.id));

  // Respect manual canceled status
  const status = inv.status === "Canceled" ? "Canceled" : computeStatus(total, amountPaid, inv.dueDate);

  return {
    ...inv,
    subtotal: Math.round(parseFloat(inv.subtotal ?? "0") * 100) / 100,
    commissionRate: Math.round(parseFloat(inv.commissionRate ?? "0") * 100) / 100,
    carrierName: carrier?.companyName ?? null,
    amountPaid: Math.round(amountPaid * 100) / 100,
    balance: Math.round(balance * 100) / 100,
    status,
    payments: payments.map((p) => ({
      id: p.id,
      paymentDate: p.paymentDate,
      amount: parseFloat(p.amount),
      paymentMethod: p.paymentMethod,
      reference: p.reference,
      notes: p.notes,
    })),
    loadIds: loadLinks.map((l) => l.loadId),
  };
}

async function generateInvoiceNumber(): Promise<string> {
  const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(invoicesTable);
  const num = (result?.count ?? 0) + 1;
  return `INV-${String(num).padStart(5, "0")}`;
}

async function generateTransactionId(): Promise<string> {
  const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable);
  const num = (result?.count ?? 0) + 1;
  return `TXN-${String(num).padStart(6, "0")}`;
}

router.get("/invoices", async (req, res): Promise<void> => {
  const parsed = ListInvoicesQueryParams.safeParse(req.query);
  const { search, status, carrierId, page = 1, pageSize = 20 } = parsed.success ? parsed.data : { search: undefined, status: undefined, carrierId: undefined, page: 1, pageSize: 20 };

  const conditions = [];
  if (carrierId) conditions.push(eq(invoicesTable.carrierId, carrierId));
  if (search) conditions.push(ilike(invoicesTable.invoiceNumber, `%${search}%`));

  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(invoicesTable).where(where).orderBy(desc(invoicesTable.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(invoicesTable).where(where),
  ]);

  let enriched = await Promise.all(data.map(enrichInvoice));
  if (status) enriched = enriched.filter((inv) => inv.status === status);

  const total = countResult[0]?.count ?? 0;
  res.json({ data: enriched, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

router.post("/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { loadIds, ...rest } = parsed.data as { loadIds?: string[]; carrierId: string; subtotal: number; commissionRate: number; total: number; [key: string]: unknown };
  const invoiceNumber = await generateInvoiceNumber();

  const [invoice] = await db.insert(invoicesTable).values({
    ...rest,
    subtotal: String(rest.subtotal),
    commissionRate: String(rest.commissionRate),
    total: String(rest.total),
    invoiceNumber,
    status: "Pending",
  } as typeof invoicesTable.$inferInsert).returning();

  if (loadIds?.length) {
    await db.insert(invoiceLoadsTable).values(loadIds.map((lid) => ({ invoiceId: invoice.id, loadId: lid })));
  }

  // Auto-create a linked transaction for this invoice
  const transactionId = await generateTransactionId();
  await db.insert(transactionsTable).values({
    transactionId,
    invoiceId: invoice.id,
    carrierId: invoice.carrierId ?? undefined,
    type: "Income",
    category: "Commission",
    description: `Invoice ${invoiceNumber}`,
    amount: String(rest.total),
    date: invoice.issueDate ?? new Date().toISOString().slice(0, 10),
    dueDate: invoice.dueDate ?? undefined,
    status: "Pending",
  } as typeof transactionsTable.$inferInsert);

  res.status(201).json(await enrichInvoice(invoice));
});

router.get("/invoices/:invoiceId", async (req, res): Promise<void> => {
  const { invoiceId } = req.params as { invoiceId: string };
  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, invoiceId));
  if (!invoice) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichInvoice(invoice));
});

router.patch("/invoices/:invoiceId", async (req, res): Promise<void> => {
  const { invoiceId } = req.params as { invoiceId: string };
  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { loadIds, total, subtotal, commissionRate, ...rest } = parsed.data as { loadIds?: string[]; total?: number; subtotal?: number; commissionRate?: number; [key: string]: unknown };
  const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (subtotal !== undefined) updateData.subtotal = String(subtotal);
  if (commissionRate !== undefined) updateData.commissionRate = String(commissionRate);
  if (total !== undefined) updateData.total = String(total);

  const [invoice] = await db.update(invoicesTable).set(updateData as Partial<typeof invoicesTable.$inferInsert>).where(eq(invoicesTable.id, invoiceId)).returning();
  if (!invoice) { res.status(404).json({ error: "Not found" }); return; }

  if (loadIds !== undefined) {
    await db.delete(invoiceLoadsTable).where(eq(invoiceLoadsTable.invoiceId, invoiceId));
    if (loadIds.length) {
      await db.insert(invoiceLoadsTable).values(loadIds.map((lid) => ({ invoiceId, loadId: lid })));
    }
  }

  res.json(await enrichInvoice(invoice));
});

router.delete("/invoices/:invoiceId", async (req, res): Promise<void> => {
  const { invoiceId } = req.params as { invoiceId: string };
  // Clear FK references before deleting
  await db.update(transactionsTable).set({ invoiceId: null }).where(eq(transactionsTable.invoiceId, invoiceId));
  await db.delete(invoicePaymentsTable).where(eq(invoicePaymentsTable.invoiceId, invoiceId));
  await db.delete(invoiceLoadsTable).where(eq(invoiceLoadsTable.invoiceId, invoiceId));
  await db.delete(invoicesTable).where(eq(invoicesTable.id, invoiceId));
  res.status(204).send();
});

router.post("/invoices/:invoiceId/payments", async (req, res): Promise<void> => {
  const { invoiceId } = req.params as { invoiceId: string };
  const parsed = RecordInvoicePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, invoiceId));
  if (!invoice) { res.status(404).json({ error: "Not found" }); return; }

  await db.insert(invoicePaymentsTable).values({
    invoiceId,
    paymentDate: parsed.data.paymentDate,
    amount: String(parsed.data.amount),
    paymentMethod: parsed.data.paymentMethod,
    reference: parsed.data.reference,
    notes: parsed.data.notes,
  } as typeof invoicePaymentsTable.$inferInsert);

  await db.update(invoicesTable).set({ updatedAt: new Date() }).where(eq(invoicesTable.id, invoiceId));
  res.status(201).json(await enrichInvoice(invoice));
});

export default router;
