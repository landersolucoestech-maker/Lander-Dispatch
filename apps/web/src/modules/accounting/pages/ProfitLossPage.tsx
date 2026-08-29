import { useMemo, useState } from "react";
import { useGetProfitLoss } from "@workspace/api-client-react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Building2, Download, Search, Target, Truck, Users } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { formatCurrency, formatNumber } from "@/shared/lib/utils";

const PERIODS = [{ value: "MTD", label: "Month to Date" }, { value: "YTD", label: "Year to Date" }, { value: "Q1", label: "Q1" }, { value: "Q2", label: "Q2" }, { value: "Q3", label: "Q3" }, { value: "Q4", label: "Q4" }] as const;
function escapeCsv(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function downloadCsv(filename: string, rows: unknown[][]) { const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n"); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); }
function Metric({ title, value, icon: Icon, tone = "neutral", description }: { title: string; value: string; icon: typeof Target; tone?: "positive"|"negative"|"neutral"; description: string }) { return <Card><CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3"><div><CardTitle className="text-xs font-medium text-slate-500">{title}</CardTitle><p className="mt-1 text-[11px] text-slate-400">{description}</p></div><Icon className="h-4 w-4 text-[#1E3D7A]" /></CardHeader><CardContent><p className={`text-2xl font-semibold ${tone === "positive" ? "text-emerald-600" : tone === "negative" ? "text-red-600" : "text-[#0B1E36]"}`}>{value}</p></CardContent></Card>; }

export default function ProfitLossPage() {
  const [period, setPeriod] = useState("MTD");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const query = useGetProfitLoss({ period }, { query: { queryKey: ["profit-loss", period] } });
  const pnl = query.data;
  const revenueLines = pnl?.revenueLines ?? [];
  const expenseLines = pnl?.expenseLines ?? [];
  const categories = Array.from(new Set([...revenueLines, ...expenseLines].map((line) => line.category)));
  const lines = useMemo(() => [...revenueLines.map((line) => ({ ...line, type: "Revenue" as const })), ...expenseLines.map((line) => ({ ...line, type: "Expense" as const }))].filter((line) => {
    if (category !== "all" && line.category !== category) return false;
    if (search && !line.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [revenueLines, expenseLines, category, search]);
  const periodLabel = PERIODS.find((item) => item.value === period)?.label ?? period;
  const margin = Number(pnl?.netProfitMargin ?? 0) * 100;
  const handleExport = () => { if (!pnl) return; downloadCsv(`lander-dispatch-profit-loss-${period.toLowerCase()}.csv`, [["Lander Dispatch Profit & Loss", periodLabel], ["Type", "Category", "Amount"], ...revenueLines.map((line) => ["Revenue", line.category, line.amount]), ...expenseLines.map((line) => ["Expense", line.category, line.amount]), ["Total Revenue", "", pnl.totalRevenue], ["Total Expenses", "", pnl.totalExpenses], ["Net Profit", "", pnl.netProfit], ["Net Profit Margin", "", `${margin.toFixed(2)}%`]]); };

  return <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger><SelectContent>{PERIODS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><Button variant="outline" className="gap-2" onClick={handleExport} disabled={!pnl || query.isLoading || query.isError}><Download className="h-4 w-4" />Export CSV</Button></div>
    {query.isError ? <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-white p-10 text-center"><AlertTriangle className="h-6 w-6 text-red-600" /><p className="font-semibold">Profit and loss data could not be loaded.</p><Button variant="outline" size="sm" onClick={() => void query.refetch()}>Retry</Button></div> : query.isLoading || !pnl ? <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Compiling financial report…</div> : <>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Metric title="Revenue" value={formatCurrency(pnl.totalRevenue)} icon={ArrowUpRight} tone="positive" description={periodLabel} /><Metric title="Expenses" value={formatCurrency(pnl.totalExpenses)} icon={ArrowDownRight} tone="negative" description={periodLabel} /><Metric title="Net Result" value={formatCurrency(pnl.netProfit)} icon={Target} tone={Number(pnl.netProfit) >= 0 ? "positive" : "negative"} description={periodLabel} /><Metric title="Margin" value={`${formatNumber(margin, 1)}%`} icon={Building2} tone={margin >= 0 ? "positive" : "negative"} description="Net profit / revenue" /></section>
      <Tabs value={tab} onValueChange={setTab}><TabsList className="flex h-auto w-full flex-wrap justify-start rounded-xl border border-slate-200 bg-white p-1.5"><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="company">P&L Company</TabsTrigger><TabsTrigger value="carriers">P&L Carriers</TabsTrigger><TabsTrigger value="brokers">P&L Brokers</TabsTrigger></TabsList>
        <TabsContent value="all" className="mt-4"><FinancialTable lines={lines} search={search} setSearch={setSearch} category={category} setCategory={setCategory} categories={categories} /></TabsContent>
        <TabsContent value="company" className="mt-4"><FinancialTable lines={lines} search={search} setSearch={setSearch} category={category} setCategory={setCategory} categories={categories} title="Company P&L" /></TabsContent>
        <TabsContent value="carriers" className="mt-4"><DimensionPanel icon={Truck} title="P&L Carriers" description="Carrier-level allocation requires transaction-to-carrier attribution. Transactions linked to carriers can be analyzed here when that dimension is present in the accounting dataset." /></TabsContent>
        <TabsContent value="brokers" className="mt-4"><DimensionPanel icon={Users} title="P&L Brokers" description="Broker-level allocation requires transaction-to-broker attribution. This view is ready for the accounting dimension without fabricating allocations from unrelated records." /></TabsContent>
      </Tabs>
    </>}
  </div>;
}

function FinancialTable({ lines, search, setSearch, category, setCategory, categories, title = "Consolidated P&L" }: { lines: Array<{ category: string; amount: number; type: "Revenue"|"Expense" }>; search: string; setSearch: (value:string)=>void; category:string; setCategory:(value:string)=>void; categories:string[]; title?:string }) {
  return <section className="rounded-xl border border-slate-200 bg-white"><div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-sm font-semibold text-[#0B1E36]">{title}</h2><p className="mt-1 text-xs text-slate-500">Revenue and expense categories for the selected period.</p></div><div className="flex flex-wrap gap-2"><div className="relative min-w-[220px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search category" value={search} onChange={(e) => setSearch(e.target.value)} /></div><Select value={category} onValueChange={setCategory}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div>{lines.length ? <Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{lines.map((line) => <TableRow key={`${line.type}-${line.category}`}><TableCell><span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${line.type === "Revenue" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{line.type}</span></TableCell><TableCell className="font-medium">{line.category}</TableCell><TableCell className={`text-right font-mono font-semibold ${line.type === "Revenue" ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(line.amount)}</TableCell></TableRow>)}</TableBody></Table> : <div className="p-10 text-center text-sm text-slate-500">No categories match the current filters.</div>}</section>;
}
function DimensionPanel({ icon: Icon, title, description }: { icon: typeof Truck; title:string; description:string }) { return <section className="rounded-xl border border-slate-200 bg-white p-10 text-center"><Icon className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-3 font-semibold text-[#0B1E36]">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p></section>; }
