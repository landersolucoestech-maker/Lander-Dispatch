import { Router, type IRouter } from "express";
import { db, carriersTable, loadsTable, transactionsTable, auditLogTable } from "@workspace/db";
import { eq, and, gte, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/kpis", async (req, res): Promise<void> => {
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
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const [revenueResult] = await db
    .select({ total: sql<number>`coalesce(sum(amount::numeric), 0)::float` })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.type, "Income"),
        eq(transactionsTable.category, "Dispatch Fee"),
        eq(transactionsTable.status, "Completed"),
        gte(transactionsTable.date, firstOfMonth),
      )
    );

  res.json({
    activeCarriers: activeResult?.count ?? 0,
    inactiveCarriers: inactiveResult?.count ?? 0,
    loadsBooked: loadsResult?.count ?? 0,
    monthlyRevenue: revenueResult?.total ?? 0,
  });
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const items = await db
    .select()
    .from(auditLogTable)
    .orderBy(desc(auditLogTable.createdAt))
    .limit(20);

  res.json(items.map((item) => ({
    id: item.id,
    description: item.description ?? item.action,
    entityType: item.entityType ?? "",
    entityId: item.entityId ?? "",
    createdAt: item.createdAt,
  })));
});

router.get("/dashboard/alerts", async (req, res): Promise<void> => {
  const alerts: object[] = [];
  const today = new Date().toISOString().split("T")[0];

  // Overdue invoices
  const { invoicesTable, invoicePaymentsTable } = await import("@workspace/db");
  const overdue = await db
    .select()
    .from(invoicesTable)
    .where(and(
      sql`${invoicesTable.dueDate} < ${today}`,
      sql`${invoicesTable.status} not in ('Fully Paid', 'Canceled')`,
    ))
    .limit(10);

  overdue.forEach((inv) => {
    alerts.push({
      id: `inv-overdue-${inv.id}`,
      alertType: "invoice_overdue",
      description: `Invoice ${inv.invoiceNumber} is overdue`,
      priority: "High",
      relatedEntityType: "invoice",
      relatedEntityId: inv.id,
      dueDate: inv.dueDate,
    });
  });

  // Expiring insurance (within 30 days)
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const in30 = in30Days.toISOString().split("T")[0];

  const expiringInsurance = await db
    .select({ id: carriersTable.id, companyName: carriersTable.companyName, insuranceExpiration: carriersTable.insuranceExpiration })
    .from(carriersTable)
    .where(and(
      sql`${carriersTable.insuranceExpiration} is not null`,
      sql`${carriersTable.insuranceExpiration} <= ${in30}`,
      eq(carriersTable.status, "Active"),
    ))
    .limit(10);

  expiringInsurance.forEach((c) => {
    const isExpired = c.insuranceExpiration! <= today;
    alerts.push({
      id: `ins-${isExpired ? "expired" : "expiring"}-${c.id}`,
      alertType: isExpired ? "insurance_expired" : "insurance_expiring",
      description: `${c.companyName} insurance ${isExpired ? "expired" : "expiring"} on ${c.insuranceExpiration}`,
      priority: isExpired ? "Critical" : "High",
      relatedEntityType: "carrier",
      relatedEntityId: c.id,
      dueDate: c.insuranceExpiration,
    });
  });

  res.json(alerts);
});

export default router;
