import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useGetProfitLoss, useGetTransactionKpis, useListInvoices, useListLoads } from "@workspace/api-client-react";
import type { Invoice, Load } from "@workspace/api-client-react";
import { AlertTriangle, ArrowRight, Download, FileSpreadsheet, FileUp, Receipt, Search, Target, Truck, Users, Wallet } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatCurrency } from "@/shared/lib/utils";

const PERIOD_OPTIONS = [{ value: "MTD", label: "Month to Date" }, { value: "YTD", label: "Year to Date" }, { value: "Q1", label: "Q1" }, { value: "Q2", label: "Q2" }, { value: "Q3", label: "Q3" }, { value: "Q4", label: "Q4" }] as const;
const ACTIVE_LOAD_STATUSES = new Set(["Dispatched", "Picked Up", "In Route"]);
function escapeCsv(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function downloadCsv(filename: string, rows: unknown[][]) { const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n"); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); }

type ReportEntity = { id: string; name: string; description: string; group: string; href: string; icon: typeof Truck };
const REPORT_ENTITIES: ReportEntity[] = [
  { id: "loads", name: "Loads", description: "Dispatch dates, routes, carriers, brokers, rates and operational status.", group: "Operations", href: "/loads", icon: Truck },
  { id: "carriers", name: "Carriers", description: "Carrier network, authority, compliance, contacts and status.", group: "Operations", href: "/carriers", icon: Users },
  { id: "brokers", name: "Brokers", description: "Broker partners, identifiers, payment terms, rating and status.", group: "Operations", href: "/brokers", icon: Users },
  { id: "invoices", name: "Invoices", description: "Commission receivables, due dates, balances and payment status.", group: "Accounting", href: "/accounting/invoices", icon: Receipt },
  { id: "transactions", name: "Transactions", description: "Income, expenses, categories, payment status and ledger activity.", group: "Accounting", href: "/accounting/transactions", icon: Wallet },
  { id: "profit-loss", name: "Profit & Loss", description: "Revenue, expenses, result, margin and category breakdown.", group: "Accounting", href: "/accounting/profit-loss", icon: Target },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("MTD");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [importEntity, setImportEntity] = useState<ReportEntity | null>(null);
  const [importName, setImportName] = useState("");
  const profitLossQuery = useGetProfitLoss({ period }, { query: { queryKey: ["reports", "profit-loss", period] } });
  const transactionKpisQuery = useGetTransactionKpis({ query: { queryKey: ["reports", "transaction-kpis"] } });
  const invoicesQuery = useListInvoices({ page: 1, pageSize: 200 }, { query: { queryKey: ["reports", "invoices"] } });
  const loadsQuery = useListLoads({ page: 1, pageSize: 500 }, { query: { queryKey: ["reports", "loads"] } });
  const loads = useMemo<Load[]>(() => loadsQuery.data?.data ?? [], [loadsQuery.data]);
  const invoices = useMemo<Invoice[]>(() => invoicesQuery.data?.data ?? [], [invoicesQuery.data]);
  const metrics = useMemo(() => ({ totalLoads: loadsQuery.data?.meta.total ?? loads.length, activeLoads: loads.filter((load) => ACTIVE_LOAD_STATUSES.has(load.status)).length, deliveredLoads: loads.filter((load) => load.status === "Delivered").length, grossLoadRevenue: loads.reduce((sum, load) => sum + Number(load.rate ?? 0), 0), totalInvoices: invoicesQuery.data?.meta.total ?? invoices.length, outstanding: invoices.reduce((sum, invoice) => sum + Number(invoice.balance ?? 0), 0), overdue: invoices.filter((invoice) => invoice.status === "Overdue").length }), [loads, invoices, loadsQuery.data?.meta.total, invoicesQuery.data?.meta.total]);
  const loading = profitLossQuery.isLoading || transactionKpisQuery.isLoading || invoicesQuery.isLoading || loadsQuery.isLoading;
  const error = profitLossQuery.isError || transactionKpisQuery.isError || invoicesQuery.isError || loadsQuery.isError;
  const visible = REPORT_ENTITIES.filter((entity) => { if (group !== "all" && entity.group !== group) return false; const term = search.toLowerCase().trim(); return !term || `${entity.name} ${entity.description} ${entity.group}`.toLowerCase().includes(term); });

  const exportEntity = (entity: ReportEntity) => {
    if (entity.id === "loads") return downloadCsv("loads-report.csv", [["Metric", "Value"], ["Total Loads", metrics.totalLoads], ["Active Loads", metrics.activeLoads], ["Delivered Loads", metrics.deliveredLoads], ["Gross Load Revenue", metrics.grossLoadRevenue]]);
    if (entity.id === "invoices") return downloadCsv("invoices-report.csv", [["Metric", "Value"], ["Total Invoices", metrics.totalInvoices], ["Outstanding Balance", metrics.outstanding], ["Overdue Invoices", metrics.overdue]]);
    if (entity.id === "transactions") return downloadCsv("transactions-report.csv", [["Metric", "Value"], ["Total Income", transactionKpisQuery.data?.totalIncome ?? 0], ["Total Expenses", transactionKpisQuery.data?.totalExpenses ?? 0], ["Net Balance", transactionKpisQuery.data?.netBalance ?? 0], ["Pending", transactionKpisQuery.data?.pendingCount ?? 0]]);
    if (entity.id === "profit-loss") return downloadCsv(`profit-loss-${period.toLowerCase()}.csv`, [["Metric", "Value"], ["Revenue", profitLossQuery.data?.totalRevenue ?? 0], ["Expenses", profitLossQuery.data?.totalExpenses ?? 0], ["Net Profit", profitLossQuery.data?.netProfit ?? 0], ["Margin", `${Number(profitLossQuery.data?.netProfitMargin ?? 0) * 100}%`]]);
    downloadCsv(`${entity.id}-report.csv`, [["Report", entity.name], ["Description", entity.description], ["Source", entity.href]]);
  };

  return <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger><SelectContent>{PERIOD_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
    {error ? <div className="rounded-xl border border-red-200 bg-white p-8 text-center"><AlertTriangle className="mx-auto h-6 w-6 text-red-600" /><p className="mt-3 font-semibold">Unable to compile live report data.</p><p className="mt-1 text-sm text-slate-500">The report registry remains available, but current metrics could not be loaded.</p></div> : <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[{ label: "Loads", value: loading ? "…" : String(metrics.totalLoads) }, { label: "Gross Load Revenue", value: loading ? "…" : formatCurrency(metrics.grossLoadRevenue) }, { label: "Outstanding", value: loading ? "…" : formatCurrency(metrics.outstanding) }, { label: "Net Profit", value: loading ? "…" : formatCurrency(profitLossQuery.data?.netProfit ?? 0) }].map((item) => <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-semibold text-[#0B1E36]">{item.value}</p></div>)}</section>}
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-1 flex-wrap gap-2"><div className="relative min-w-[220px] flex-1 sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><Select value={group} onValueChange={setGroup}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All groups</SelectItem><SelectItem value="Operations">Operations</SelectItem><SelectItem value="Accounting">Accounting</SelectItem></SelectContent></Select></div><p className="text-xs text-slate-500">{visible.length} report entities</p></div>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Entity</TableHead><TableHead>Group</TableHead><TableHead>Description</TableHead><TableHead className="w-24">Import</TableHead><TableHead className="w-24">Export</TableHead><TableHead className="w-28">Open</TableHead></TableRow></TableHeader><TableBody>{visible.map((entity) => { const Icon = entity.icon; return <TableRow key={entity.id}><TableCell><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#1E3D7A]"><Icon className="h-4 w-4" /></span><span className="font-semibold">{entity.name}</span></div></TableCell><TableCell><span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600">{entity.group}</span></TableCell><TableCell className="max-w-xl text-sm text-slate-500">{entity.description}</TableCell><TableCell><Button size="sm" variant="outline" onClick={() => { setImportEntity(entity); setImportName(""); }}><FileUp className="mr-1 h-4 w-4" />Import</Button></TableCell><TableCell><Button size="sm" variant="outline" onClick={() => exportEntity(entity)}><Download className="mr-1 h-4 w-4" />Export</Button></TableCell><TableCell><Link href={entity.href}><Button size="sm" variant="ghost">Open <ArrowRight className="ml-1 h-4 w-4" /></Button></Link></TableCell></TableRow>; })}</TableBody></Table></div>{!visible.length && <div className="p-12 text-center text-sm text-slate-500">No report entities match the current filters.</div>}
    </section>
    <Dialog open={Boolean(importEntity)} onOpenChange={(open) => !open && setImportEntity(null)}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Import {importEntity?.name}</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Source File</Label><Input className="mt-1.5" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setImportName(e.target.files?.[0]?.name ?? "")} /></div>{importName && <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700"><FileSpreadsheet className="mr-2 inline h-4 w-4" />{importName}</div>}<p className="text-xs leading-5 text-slate-500">Import is review-first. The selected file is not written directly to operational records from this screen.</p></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setImportEntity(null)}>Cancel</Button><Button disabled={!importName} onClick={() => setImportEntity(null)}>Review Import</Button></div></DialogContent></Dialog>
  </div>;
}
