import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  useGetProfitLoss,
  useGetTransactionKpis,
  useListInvoices,
  useListLoads,
} from "@workspace/api-client-react";
import type { Invoice, Load } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
  ArrowRight,
  ArrowUpRight,
  Download,
  FileText,
  Receipt,
  Target,
  Truck,
  Wallet,
} from "lucide-react";

const PERIOD_OPTIONS = [
  { value: "MTD", label: "Month to Date" },
  { value: "YTD", label: "Year to Date" },
  { value: "Q1", label: "Q1" },
  { value: "Q2", label: "Q2" },
  { value: "Q3", label: "Q3" },
  { value: "Q4", label: "Q4" },
] as const;

const ACTIVE_LOAD_STATUSES = new Set(["Dispatched", "Picked Up", "In Route"]);

function escapeCsv(value: string | number) {
  const normalized = String(value).replaceAll('"', '""');
  return `"${normalized}"`;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Truck;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-[11px]">{description}</CardDescription>
        </div>
        <Icon className="h-4 w-4 shrink-0 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function ReportLinkCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: typeof Truck;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-1">
        <div className="mb-3 flex h-9 w-9 items-center justify-center border border-primary/20 bg-primary/5">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="leading-5">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={href}>
          <Button variant="outline" className="w-full justify-between">
            Open report
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("MTD");

  const profitLossQuery = useGetProfitLoss(
    { period },
    { query: { queryKey: ["reports", "profit-loss", period] } },
  );
  const transactionKpisQuery = useGetTransactionKpis({
    query: { queryKey: ["reports", "transaction-kpis"] },
  });
  const invoicesQuery = useListInvoices(
    { page: 1, pageSize: 200 },
    { query: { queryKey: ["reports", "invoices"] } },
  );
  const loadsQuery = useListLoads(
    { page: 1, pageSize: 500 },
    { query: { queryKey: ["reports", "loads"] } },
  );

  const loads = useMemo<Load[]>(() => loadsQuery.data?.data ?? [], [loadsQuery.data]);
  const invoices = useMemo<Invoice[]>(
    () => invoicesQuery.data?.data ?? [],
    [invoicesQuery.data],
  );

  const loadMetrics = useMemo(() => {
    const delivered = loads.filter((load) => load.status === "Delivered").length;
    const active = loads.filter((load) => ACTIVE_LOAD_STATUSES.has(load.status)).length;
    const grossRevenue = loads.reduce((total, load) => total + (load.rate ?? 0), 0);

    return {
      total: loadsQuery.data?.meta.total ?? loads.length,
      delivered,
      active,
      grossRevenue,
    };
  }, [loads, loadsQuery.data?.meta.total]);

  const invoiceMetrics = useMemo(() => {
    const outstandingBalance = invoices.reduce(
      (total, invoice) => total + (invoice.balance ?? 0),
      0,
    );
    const overdue = invoices.filter((invoice) => invoice.status === "Overdue").length;

    return {
      total: invoicesQuery.data?.meta.total ?? invoices.length,
      outstandingBalance,
      overdue,
    };
  }, [invoices, invoicesQuery.data?.meta.total]);

  const isLoading =
    profitLossQuery.isLoading ||
    transactionKpisQuery.isLoading ||
    invoicesQuery.isLoading ||
    loadsQuery.isLoading;

  const hasError =
    profitLossQuery.isError ||
    transactionKpisQuery.isError ||
    invoicesQuery.isError ||
    loadsQuery.isError;

  const handleExport = () => {
    const pnl = profitLossQuery.data;
    const transactionKpis = transactionKpisQuery.data;

    downloadCsv(`lander-dispatch-report-${period.toLowerCase()}.csv`, [
      ["Lander Dispatch Report", period],
      ["Metric", "Value"],
      ["Total Loads", loadMetrics.total],
      ["Active Loads", loadMetrics.active],
      ["Delivered Loads", loadMetrics.delivered],
      ["Gross Load Revenue", loadMetrics.grossRevenue.toFixed(2)],
      ["Total Invoices", invoiceMetrics.total],
      ["Outstanding Invoice Balance", invoiceMetrics.outstandingBalance.toFixed(2)],
      ["Overdue Invoices", invoiceMetrics.overdue],
      ["P&L Revenue", (pnl?.totalRevenue ?? 0).toFixed(2)],
      ["P&L Expenses", (pnl?.totalExpenses ?? 0).toFixed(2)],
      ["Net Profit", (pnl?.netProfit ?? 0).toFixed(2)],
      ["Net Profit Margin", `${((pnl?.netProfitMargin ?? 0) * 100).toFixed(2)}%`],
      ["Transaction Income", (transactionKpis?.totalIncome ?? 0).toFixed(2)],
      ["Transaction Expenses", (transactionKpis?.totalExpenses ?? 0).toFixed(2)],
      ["Transaction Net Balance", (transactionKpis?.netBalance ?? 0).toFixed(2)],
      ["Pending Transactions", transactionKpis?.pendingCount ?? 0],
    ]);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">REPORTS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational and financial performance using live system data.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExport}
            disabled={isLoading || hasError}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </header>

      {hasError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-semibold">Unable to compile reports</p>
              <p className="mt-1 text-sm text-muted-foreground">
                One or more report sources could not be loaded. Refresh the page after confirming the API is available.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Compiling live report data…
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total Loads"
              value={String(loadMetrics.total)}
              description={`${loadMetrics.active} active · ${loadMetrics.delivered} delivered`}
              icon={Truck}
            />
            <MetricCard
              title="Gross Load Revenue"
              value={formatCurrency(loadMetrics.grossRevenue)}
              description="Sum of rates loaded in the current dataset"
              icon={ArrowUpRight}
            />
            <MetricCard
              title="Outstanding Balance"
              value={formatCurrency(invoiceMetrics.outstandingBalance)}
              description={`${invoiceMetrics.overdue} overdue invoice${invoiceMetrics.overdue === 1 ? "" : "s"}`}
              icon={Receipt}
            />
            <MetricCard
              title="Pending Transactions"
              value={String(transactionKpisQuery.data?.pendingCount ?? 0)}
              description={`Net balance ${formatCurrency(transactionKpisQuery.data?.netBalance ?? 0)}`}
              icon={Wallet}
            />
          </section>

          <section>
            <div className="mb-3">
              <h2 className="text-base font-semibold">Financial Summary</h2>
              <p className="text-sm text-muted-foreground">
                Profit and loss for {PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? period}.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Revenue"
                value={formatCurrency(profitLossQuery.data?.totalRevenue ?? 0)}
                description="Recognized income in the selected period"
                icon={ArrowUpRight}
              />
              <MetricCard
                title="Expenses"
                value={formatCurrency(profitLossQuery.data?.totalExpenses ?? 0)}
                description="Recorded expenses in the selected period"
                icon={ArrowDownRight}
              />
              <MetricCard
                title="Net Profit"
                value={formatCurrency(profitLossQuery.data?.netProfit ?? 0)}
                description="Revenue minus expenses"
                icon={Target}
              />
              <MetricCard
                title="Profit Margin"
                value={`${((profitLossQuery.data?.netProfitMargin ?? 0) * 100).toFixed(1)}%`}
                description="Net profit as a percentage of revenue"
                icon={FileText}
              />
            </div>
          </section>

          <section>
            <div className="mb-3">
              <h2 className="text-base font-semibold">Detailed Reports</h2>
              <p className="text-sm text-muted-foreground">
                Open the operational source behind each summary.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ReportLinkCard
                title="Loads"
                description="Review dispatch dates, routes, carriers, status and rate data."
                href="/loads"
                icon={Truck}
              />
              <ReportLinkCard
                title="Invoices"
                description="Review receivables, balances, overdue invoices and payment status."
                href="/accounting/invoices"
                icon={Receipt}
              />
              <ReportLinkCard
                title="Transactions"
                description="Inspect income, expenses, pending entries and net cash balance."
                href="/accounting/transactions"
                icon={Wallet}
              />
              <ReportLinkCard
                title="Profit & Loss"
                description="Inspect categorized revenue, expenses, net profit and margin."
                href="/accounting/profit-loss"
                icon={Target}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
