import { Router, type IRouter } from "express";
import {
  db,
  carriersTable,
  invoiceLoadsTable,
  invoicePaymentsTable,
  invoicesTable,
  loadsTable,
  transactionsTable,
} from "@workspace/db";
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import {
  CreateInvoiceBody,
  ListInvoicesQueryParams,
  RecordInvoicePaymentBody,
  UpdateInvoiceBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeStatus(total: number, amountPaid: number, dueDate: string | null): string {
  if (amountPaid >= total) return "Fully Paid";
  const today = new Date().toISOString().split("T")[0];
  if (dueDate && dueDate < today && amountPaid < total) return "Overdue";
  if (amountPaid > 0 && amountPaid < total) return "Partially Paid";
  return "Pending";
}

async function calculateInvoiceAmounts({
  carrierId,
  loadIds,
  total,
}: {
  carrierId: string;
  loadIds: string[];
  total: number;
}) {
  const uniqueLoadIds = [...new Set(loadIds)];
  if (uniqueLoadIds.length === 0) {
    throw new Error("At least one load is required");
  }

  const linkedLoads = await db
    .select({
      id: loadsTable.id,
      carrierId: loadsTable.carrierId,
      rate: loadsTable.rate,
    })
    .from(loadsTable)
    .where(inArray(loadsTable.id, uniqueLoadIds));

  if (linkedLoads.length !== uniqueLoadIds.length) {
    throw new Error("One or more selected loads do not exist");
  }

  if (linkedLoads.some((load) => load.carrierId !== carrierId)) {
    throw new Error("Every selected load must belong to the invoice carrier");
  }

  const subtotal = linkedLoads.reduce(
    (sum, load) => sum + Number.parseFloat(load.rate ?? "0"),
    0,
  );

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Invoice total must be greater than zero");
  }

  if (subtotal <= 0) {
    throw new Error("Selected loads must have a positive total rate");
  }

  const commissionRate = (total / subtotal) * 100;
  if (commissionRate <= 0 || commissionRate > 100) {
    throw new Error("Commission rate derived from the invoice must be between 0 and 100");
  }

  return {
    loadIds: uniqueLoadIds,
    subtotal: Math.round(subtotal * 100) / 100,
    commissionRate: Math.round(commissionRate * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

async function enrichInvoice(invoice: typeof invoicesTable.$inferSelect) {
  const [carrier] = invoice.carrierId
    ? await db
        .select({ companyName: carriersTable.companyName })
        .from(carriersTable)
        .where(eq(carriersTable.id, invoice.carrierId))
    : [null];

  const payments = await db
    .select()
    .from(invoicePaymentsTable)
    .where(eq(invoicePaymentsTable.invoiceId, invoice.id))
    .orderBy(desc(invoicePaymentsTable.createdAt));

  const amountPaid = payments.reduce(
    (sum, payment) => sum + Number.parseFloat(payment.amount),
    0,
  );
  const total = Number.parseFloat(invoice.total ?? "0");
  const balance = Math.max(0, total - amountPaid);

  const loadLinks = await db
    .select({ loadId: invoiceLoadsTable.loadId })
    .from(invoiceLoadsTable)
    .where(eq(invoiceLoadsTable.invoiceId, invoice.id));

  const status =
    invoice.status === "Canceled"
      ? "Canceled"
      : computeStatus(total, amountPaid, invoice.dueDate);

  return {
    ...invoice,
    subtotal: Math.round(Number.parseFloat(invoice.subtotal ?? "0") * 100) / 100,
    commissionRate:
      Math.round(Number.parseFloat(invoice.commissionRate ?? "0") * 100) / 100,
    total: Math.round(total * 100) / 100,
    carrierName: carrier?.companyName ?? null,
    amountPaid: Math.round(amountPaid * 100) / 100,
    balance: Math.round(balance * 100) / 100,
    status,
    payments: payments.map((payment) => ({
      id: payment.id,
      paymentDate: payment.paymentDate,
      amount: Number.parseFloat(payment.amount),
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      notes: payment.notes,
    })),
    loadIds: loadLinks.map((link) => link.loadId),
  };
}

async function generateInvoiceNumber(): Promise<string> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoicesTable);
  return `INV-${String((result?.count ?? 0) + 1).padStart(5, "0")}`;
}

async function generateTransactionId(): Promise<string> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactionsTable);
  return `TXN-${String((result?.count ?? 0) + 1).padStart(6, "0")}`;
}

router.get("/invoices", async (req, res): Promise<void> => {
  const parsed = ListInvoicesQueryParams.safeParse(req.query);
  const {
    search,
    status,
    carrierId,
    page = 1,
    pageSize = 20,
  } = parsed.success
    ? parsed.data
    : {
        search: undefined,
        status: undefined,
        carrierId: undefined,
        page: 1,
        pageSize: 20,
      };

  const conditions = [];
  if (carrierId) conditions.push(eq(invoicesTable.carrierId, carrierId));
  if (search) conditions.push(ilike(invoicesTable.invoiceNumber, `%${search}%`));

  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(invoicesTable)
      .where(where)
      .orderBy(desc(invoicesTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(invoicesTable).where(where),
  ]);

  let enriched = await Promise.all(data.map(enrichInvoice));
  if (status) enriched = enriched.filter((invoice) => invoice.status === status);

  const total = countResult[0]?.count ?? 0;
  res.json({
    data: enriched,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

router.post("/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { loadIds = [], total, ...invoiceFields } = parsed.data;

  let amounts: Awaited<ReturnType<typeof calculateInvoiceAmounts>>;
  try {
    amounts = await calculateInvoiceAmounts({
      carrierId: parsed.data.carrierId,
      loadIds,
      total,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid invoice data",
    });
    return;
  }

  const invoiceNumber = await generateInvoiceNumber();
  const [invoice] = await db
    .insert(invoicesTable)
    .values({
      ...invoiceFields,
      carrierId: parsed.data.carrierId,
      subtotal: String(amounts.subtotal),
      commissionRate: String(amounts.commissionRate),
      total: String(amounts.total),
      invoiceNumber,
      status: "Pending",
    } as typeof invoicesTable.$inferInsert)
    .returning();

  await db.insert(invoiceLoadsTable).values(
    amounts.loadIds.map((loadId) => ({ invoiceId: invoice.id, loadId })),
  );

  const transactionId = await generateTransactionId();
  await db.insert(transactionsTable).values({
    transactionId,
    invoiceId: invoice.id,
    carrierId: invoice.carrierId ?? undefined,
    type: "Income",
    category: "Commission",
    description: `Invoice ${invoiceNumber}`,
    amount: String(amounts.total),
    date: invoice.issueDate ?? new Date().toISOString().slice(0, 10),
    dueDate: invoice.dueDate ?? undefined,
    status: "Pending",
  } as typeof transactionsTable.$inferInsert);

  res.status(201).json(await enrichInvoice(invoice));
});

router.get("/invoices/:invoiceId", async (req, res): Promise<void> => {
  const { invoiceId } = req.params as { invoiceId: string };
  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, invoiceId));

  if (!invoice) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(await enrichInvoice(invoice));
});

router.patch("/invoices/:invoiceId", async (req, res): Promise<void> => {
  const { invoiceId } = req.params as { invoiceId: string };
  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existingInvoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, invoiceId));
  if (!existingInvoice) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const existingLinks = await db
    .select({ loadId: invoiceLoadsTable.loadId })
    .from(invoiceLoadsTable)
    .where(eq(invoiceLoadsTable.invoiceId, invoiceId));

  const {
    loadIds,
    total,
    carrierId,
    ...invoiceFields
  } = parsed.data;
  const effectiveCarrierId = carrierId ?? existingInvoice.carrierId;
  const effectiveLoadIds = loadIds ?? existingLinks.map((link) => link.loadId);
  const effectiveTotal = total ?? Number.parseFloat(existingInvoice.total ?? "0");

  if (!effectiveCarrierId) {
    res.status(400).json({ error: "Invoice carrier is required" });
    return;
  }

  let amounts: Awaited<ReturnType<typeof calculateInvoiceAmounts>>;
  try {
    amounts = await calculateInvoiceAmounts({
      carrierId: effectiveCarrierId,
      loadIds: effectiveLoadIds,
      total: effectiveTotal,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid invoice data",
    });
    return;
  }

  const [invoice] = await db
    .update(invoicesTable)
    .set({
      ...invoiceFields,
      carrierId: effectiveCarrierId,
      subtotal: String(amounts.subtotal),
      commissionRate: String(amounts.commissionRate),
      total: String(amounts.total),
      updatedAt: new Date(),
    } as Partial<typeof invoicesTable.$inferInsert>)
    .where(eq(invoicesTable.id, invoiceId))
    .returning();

  if (loadIds !== undefined) {
    await db.delete(invoiceLoadsTable).where(eq(invoiceLoadsTable.invoiceId, invoiceId));
    await db.insert(invoiceLoadsTable).values(
      amounts.loadIds.map((loadId) => ({ invoiceId, loadId })),
    );
  }

  res.json(await enrichInvoice(invoice));
});

router.delete("/invoices/:invoiceId", async (req, res): Promise<void> => {
  const { invoiceId } = req.params as { invoiceId: string };
  await db
    .update(transactionsTable)
    .set({ invoiceId: null })
    .where(eq(transactionsTable.invoiceId, invoiceId));
  await db.delete(invoicePaymentsTable).where(eq(invoicePaymentsTable.invoiceId, invoiceId));
  await db.delete(invoiceLoadsTable).where(eq(invoiceLoadsTable.invoiceId, invoiceId));
  await db.delete(invoicesTable).where(eq(invoicesTable.id, invoiceId));
  res.status(204).send();
});

router.post("/invoices/:invoiceId/payments", async (req, res): Promise<void> => {
  const { invoiceId } = req.params as { invoiceId: string };
  const parsed = RecordInvoicePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, invoiceId));
  if (!invoice) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.insert(invoicePaymentsTable).values({
    invoiceId,
    paymentDate: parsed.data.paymentDate,
    amount: String(parsed.data.amount),
    paymentMethod: parsed.data.paymentMethod,
    reference: parsed.data.reference,
    notes: parsed.data.notes,
  } as typeof invoicePaymentsTable.$inferInsert);

  await db
    .update(invoicesTable)
    .set({ updatedAt: new Date() })
    .where(eq(invoicesTable.id, invoiceId));

  res.status(201).json(await enrichInvoice(invoice));
});

export default router;
