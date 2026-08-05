import { useState } from "react";
import { useGetProfitLoss } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { formatCurrency } from "@/shared/lib/utils";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Target,
} from "lucide-react";

const PERIODS = [
  { value: "MTD", label: "Month to Date" },
  { value: "YTD", label: "Year to Date" },
  { value: "Q1", label: "Q1" },
  { value: "Q2", label: "Q2" },
  { value: "Q3", label: "Q3" },
  { value: "Q4", label: "Q4" },
] as const;

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function MetricCard({
  title,
  value,
  icon: Icon,
  tone,
  description,
}: {
  title: string;
  value: string;
  icon: typeof Target;
  tone: "positive" | "negative" | "neutral";
  description: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
        ? "text-destructive"
        : "text-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </CardTitle>
          <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
        </div>
        <Icon className="h-4 w-4 shrink-0 text-primary" />
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold tracking-tight ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Breakdown({
  title,
  lines,
  total,
  tone,
}: {
  title: string;
  lines: Array<{ category: string; amount: number }>;
  total: number;
  tone: "positive" | "negative";
}) {
  const amountClass = tone === "positive" ? "text-emerald-600" : "text-destructive";
  const totalBackground = tone === "positive" ? "bg-emerald-500/5" : "bg-destructive/5";

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Recorded categories for the selected period.
        </p>
      </div>

      {lines.length ? (
        <div className="divide-y divide-border border border-border bg-card">
          {lines.map((line) => (
            <div
              key={line.category}
              className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-sm font-medium">{line.category}</span>
              <span className={`font-mono text-sm font-semibold ${amountClass}`}>
                {formatCurrency(line.amount)}
              </span>
            </div>
          ))}
          <div className={`flex items-center justify-between gap-3 p-4 ${totalBackground}`}>
            <span className="text-sm font-bold uppercase tracking-wide">Total</span>
            <span className={`font-mono text-sm font-bold ${amountClass}`}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No data recorded for this category in the selected period.
        </div>
      )}
    </section>
  );
}

export default function ProfitLossPage() {
  const [period, setPeriod] = useState("MTD");
  const profitLossQuery = useGetProfitLoss(
    { period },
    { query: { queryKey: ["profit-loss", period] } },
  );

  const pnl = profitLossQuery.data;
  const revenueLines = pnl?.revenueLines ?? [];
  const expenseLines = pnl?.expenseLines ?? [];
  const periodLabel = PERIODS.find((item) => item.value === period)?.label ?? period;

  const handleExport = () => {
    if (!pnl) return;

    downloadCsv(`lander-dispatch-profit-loss-${period.toLowerCase()}.csv`, [
      ["Lander Dispatch Profit & Loss", periodLabel],
      ["Revenue Category", "Amount"],
      ...revenueLines.map((line) => [line.category, line.amount.toFixed(2)]),
      ["Total Revenue", pnl.totalRevenue.toFixed(2)],
      [],
      ["Expense Category", "Amount"],
      ...expenseLines.map((line) => [line.category, line.amount.toFixed(2)]),
      ["Total Expenses", pnl.totalExpenses.toFixed(2)],
      [],
      ["Net Profit", pnl.netProfit.toFixed(2)],
      ["Net Profit Margin", `${(pnl.netProfitMargin * 100).toFixed(2)}%`],
    ]);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PROFIT & LOSS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Financial performance based on recorded transactions.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExport}
            disabled={!pnl || profitLossQuery.isLoading || profitLossQuery.isError}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </header>

      {profitLossQuery.isError ? (
        <div className="flex flex-col items-center gap-3 border border-destructive/40 bg-card p-10 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <p className="font-semibold">Profit and loss data could not be loaded.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirm the API is available and retry the report.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void profitLossQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : profitLossQuery.isLoading || !pnl ? (
        <div className="border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Compiling financial report…
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(pnl.totalRevenue)}
              icon={ArrowUpRight}
              tone="positive"
              description={periodLabel}
            />
            <MetricCard
              title="Total Expenses"
              value={formatCurrency(pnl.totalExpenses)}
              icon={ArrowDownRight}
              tone="negative"
              description={periodLabel}
            />
            <MetricCard
              title="Net Profit"
              value={formatCurrency(pnl.netProfit)}
              icon={Target}
              tone={pnl.netProfit >= 0 ? "positive" : "negative"}
              description={`${(pnl.netProfitMargin * 100).toFixed(1)}% margin`}
            />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Breakdown
              title="Revenue Breakdown"
              lines={revenueLines}
              total={pnl.totalRevenue}
              tone="positive"
            />
            <Breakdown
              title="Expense Breakdown"
              lines={expenseLines}
              total={pnl.totalExpenses}
              tone="negative"
            />
          </section>
        </>
      )}
    </div>
  );
}
