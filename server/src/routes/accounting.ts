import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const router: IRouter = Router();

function getPeriodDates(period: string, startDate?: string, endDate?: string): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  if (period === "custom" && startDate && endDate) return { start: startDate, end: endDate };
  if (period === "last_month") {
    const d = new Date(y, m - 1, 1);
    const de = new Date(y, m, 0);
    return { start: d.toISOString().split("T")[0], end: de.toISOString().split("T")[0] };
  }
  if (period === "this_quarter") {
    const q = Math.floor(m / 3);
    const start = new Date(y, q * 3, 1);
    const end = new Date(y, q * 3 + 3, 0);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  }
  if (period === "last_quarter") {
    const q = Math.floor(m / 3) - 1;
    const start = new Date(y, q * 3, 1);
    const end = new Date(y, q * 3 + 3, 0);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  }
  if (period === "this_year") {
    return { start: `${y}-01-01`, end: `${y}-12-31` };
  }
  if (period === "last_year") {
    return { start: `${y - 1}-01-01`, end: `${y - 1}-12-31` };
  }
  // Default: this_month
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
}

function getPreviousPeriodDates(start: string, end: string): { start: string; end: string } {
  const s = new Date(start);
  const e = new Date(end);
  const diffMs = e.getTime() - s.getTime();
  const prevEnd = new Date(s.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diffMs);
  return { start: prevStart.toISOString().split("T")[0], end: prevEnd.toISOString().split("T")[0] };
}

async function getPnlForPeriod(start: string, end: string) {
  const rows = await db
    .select({
      type: transactionsTable.type,
      category: transactionsTable.category,
      total: sql<number>`sum(amount::numeric)::float`,
    })
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.status, "Completed"),
      gte(transactionsTable.date, start),
      lte(transactionsTable.date, end),
    ))
    .groupBy(transactionsTable.type, transactionsTable.category);

  const revenueLines = rows.filter((r) => r.type === "Income").map((r) => ({ category: r.category, amount: Math.round((r.total ?? 0) * 100) / 100 }));
  const expenseLines = rows.filter((r) => r.type === "Expense").map((r) => ({ category: r.category, amount: Math.round((r.total ?? 0) * 100) / 100 }));

  const totalRevenue = revenueLines.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenseLines.reduce((s, r) => s + r.amount, 0);
  const netProfit = Math.round((totalRevenue - totalExpenses) * 100) / 100;
  const netProfitMargin = totalRevenue === 0 ? 0 : Math.round((netProfit / totalRevenue) * 10000) / 100;

  return { totalRevenue, totalExpenses, netProfit, netProfitMargin, revenueLines, expenseLines };
}

router.get("/accounting/profit-loss", async (req, res): Promise<void> => {
  const period = (req.query.period as string) ?? "this_month";
  const { start, end } = getPeriodDates(period, req.query.startDate as string, req.query.endDate as string);
  const prev = getPreviousPeriodDates(start, end);

  const [current, previous] = await Promise.all([
    getPnlForPeriod(start, end),
    getPnlForPeriod(prev.start, prev.end),
  ]);

  res.json({
    period,
    startDate: start,
    endDate: end,
    ...current,
    previousPeriodRevenue: previous.totalRevenue,
    previousPeriodExpenses: previous.totalExpenses,
    previousPeriodNetProfit: previous.netProfit,
  });
});

export default router;
