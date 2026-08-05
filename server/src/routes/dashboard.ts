import { Router, type IRouter } from "express";
import {
  auditLogsTable,
  carriersTable,
  db,
  invoicePaymentsTable,
  invoicesTable,
  loadsTable,
  transactionsTable,
} from "@workspace/db";
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  sql,
} from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/kpis", async (_req, res): Promise<void> => {
  const [activeResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(carriersTable)
    .where(eq(carriersTable.status, "Active"));

  const [inactiveResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(carriersTable)
    .where(eq(carriersTable.status, "Inactive"));

  const [loadsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loadsTable);

  const now = new Date();
  const firstOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  )
    .toISOString()
    .slice(0, 10);

  const [revenueResult] = await db
    .select({
      total: sql<number>`coalesce(sum(${transactionsTable.amount}::numeric), 0)::float`,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.type, "Income"),
        inArray(transactionsTable.status, ["Cleared", "Reconciled"]),
        gte(transactionsTable.date, firstOfMonth),
      ),
    );

  res.json({
    activeCarriers: activeResult?.count ?? 0,
    inactiveCarriers: inactiveResult?.count ?? 0,
    loadsBooked: loadsResult?.count ?? 0,
    monthlyRevenue: revenueResult?.total ?? 0,
  });
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  const items = await db
    .select({
      id: auditLogsTable.id,
      description: auditLogsTable.summary,
      entityType: auditLogsTable.entityType,
      entityId: auditLogsTable.entityId,
      createdAt: auditLogsTable.createdAt,
    })
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(20);

  res.json(
    items.map((item) => ({
      id: item.id,
      description: item.description,
      entityType: item.entityType,
      entityId: item.entityId ?? "",
      createdAt: item.createdAt,
    })),
  );
});

router.get("/dashboard/alerts", async (_req, res): Promise<void> => {
  const alerts: Array<{
    id: string;
    alertType: string;
    description: string;
    priority: string;
    relatedEntityType: string;
    relatedEntityId: string;
    dueDate: string | null;
  }> = [];
  const today = new Date().toISOString().slice(0, 10);

  const overdueInvoices = await db
    .select({
      id: invoicesTable.id,
      invoiceNumber: invoicesTable.invoiceNumber,
      dueDate: invoicesTable.dueDate,
      total: sql<number>`${invoicesTable.total}::numeric::float`,
      amountPaid: sql<number>`coalesce(sum(${invoicePaymentsTable.amount}::numeric), 0)::float`,
    })
    .from(invoicesTable)
    .leftJoin(
      invoicePaymentsTable,
      eq(invoicePaymentsTable.invoiceId, invoicesTable.id),
    )
    .where(
      and(
        sql`${invoicesTable.dueDate} < ${today}`,
        sql`${invoicesTable.status} not in ('Fully Paid', 'Canceled')`,
      ),
    )
    .groupBy(invoicesTable.id)
    .having(
      sql`coalesce(sum(${invoicePaymentsTable.amount}::numeric), 0) < ${invoicesTable.total}::numeric`,
    )
    .orderBy(invoicesTable.dueDate)
    .limit(10);

  for (const invoice of overdueInvoices) {
    const balance = Math.max(0, invoice.total - invoice.amountPaid);
    alerts.push({
      id: `inv-overdue-${invoice.id}`,
      alertType: "invoice_overdue",
      description: `Invoice ${invoice.invoiceNumber} is overdue with ${balance.toLocaleString(
        "en-US",
        {
          style: "currency",
          currency: "USD",
        },
      )} outstanding`,
      priority: "High",
      relatedEntityType: "invoice",
      relatedEntityId: invoice.id,
      dueDate: invoice.dueDate,
    });
  }

  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const in30 = in30Days.toISOString().slice(0, 10);

  const expiringInsurance = await db
    .select({
      id: carriersTable.id,
      companyName: carriersTable.companyName,
      insuranceExpiration: carriersTable.insuranceExpiration,
    })
    .from(carriersTable)
    .where(
      and(
        sql`${carriersTable.insuranceExpiration} is not null`,
        sql`${carriersTable.insuranceExpiration} <= ${in30}`,
        eq(carriersTable.status, "Active"),
      ),
    )
    .orderBy(carriersTable.insuranceExpiration)
    .limit(10);

  for (const carrier of expiringInsurance) {
    if (!carrier.insuranceExpiration) continue;
    const isExpired = carrier.insuranceExpiration <= today;
    alerts.push({
      id: `ins-${isExpired ? "expired" : "expiring"}-${carrier.id}`,
      alertType: isExpired ? "insurance_expired" : "insurance_expiring",
      description: `${carrier.companyName} insurance ${
        isExpired ? "expired" : "expires"
      } on ${carrier.insuranceExpiration}`,
      priority: isExpired ? "Critical" : "High",
      relatedEntityType: "carrier",
      relatedEntityId: carrier.id,
      dueDate: carrier.insuranceExpiration,
    });
  }

  res.json(alerts);
});

export default router;
