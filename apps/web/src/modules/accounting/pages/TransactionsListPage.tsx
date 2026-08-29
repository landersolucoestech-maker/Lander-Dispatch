import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteTransaction, useGetTransactionKpis, useListTransactions } from "@workspace/api-client-react";
import type { Transaction } from "@workspace/api-client-react";
import { Activity, ArrowDownRight, ArrowUpRight, Bot, FileUp, FolderCog, MoreHorizontal, Plus, Search, SlidersHorizontal, Wallet, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { TransactionFormModal } from "../components/TransactionFormModal";
import { TransactionViewModal } from "../components/TransactionViewModal";

const CATEGORY_OPTIONS = ["Fuel", "Maintenance", "Insurance", "Driver Pay", "Permits & Licenses", "Tolls", "Office & Admin", "Equipment", "Other Expense", "Freight Revenue", "Fuel Surcharge", "Detention Pay", "Accessorial", "Other Income"];
const STATUS_OPTIONS = ["Pending", "Cleared", "Reconciled", "Voided", "Void"];

type Rule = { id: string; name: string; contains: string; type: string; category: string; enabled: boolean };
type CustomCategory = { id: string; name: string; type: string };

function MetricCard({ title, value, icon: Icon, tone = "default" }: { title: string; value: string; icon: typeof Wallet; tone?: "default" | "positive" | "negative" }) {
  const valueClass = tone === "positive" ? "text-emerald-600" : tone === "negative" ? "text-red-600" : "text-[#0B1E36]";
  return <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><CardTitle className="text-xs font-medium text-slate-500">{title}</CardTitle><Icon className="h-4 w-4 text-[#1E3D7A]" /></CardHeader><CardContent><p className={`text-2xl font-semibold tracking-tight ${valueClass}`}>{value}</p></CardContent></Card>;
}
function TypeBadge({ type }: { type: Transaction["type"] }) { const expense = type === "Expense"; return <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${expense ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{type}</span>; }
function Actions({ transaction, onView, onEdit, onDelete }: { transaction: Transaction; onView: () => void; onEdit: () => void; onDelete: () => void }) { return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${transaction.transactionId}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={onView}>View</DropdownMenuItem><DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem><DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={onDelete}>Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>; }

export default function TransactionsListPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [ofxOpen, setOfxOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleForm, setRuleForm] = useState({ name: "", contains: "", type: "Expense", category: "Fuel" });
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "Expense" });
  const [automations, setAutomations] = useState({ autoCategorize: true, duplicateDetection: true, dueReminders: true, reconciliationSuggestions: false });
  const [ofxName, setOfxName] = useState("");

  useEffect(() => { const openCreate = () => setCreateOpen(true); window.addEventListener("lander:transactions-add", openCreate); return () => window.removeEventListener("lander:transactions-add", openCreate); }, []);

  const queryClient = useQueryClient();
  const deleteMutation = useDeleteTransaction({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }) } });
  const kpisQuery = useGetTransactionKpis();
  const transactionsQuery = useListTransactions({ search: search || undefined, type: type === "all" ? undefined : type, status: status === "all" ? undefined : status, page, pageSize: 100 }, { query: { queryKey: ["transactions", search, type, status, page] } });
  const source = transactionsQuery.data?.data ?? [];
  const transactions = useMemo(() => source.filter((transaction) => {
    if (category !== "all" && transaction.category !== category) return false;
    const date = transaction.date?.slice(0, 10) ?? "";
    if (startDate && date && date < startDate) return false;
    if (endDate && date && date > endDate) return false;
    return true;
  }), [source, category, startDate, endDate]);
  const meta = transactionsQuery.data?.meta;
  const categoryOptions = Array.from(new Set([...CATEGORY_OPTIONS, ...customCategories.map((item) => item.name), ...source.map((item) => item.category).filter(Boolean)]));
  const allSelected = transactions.length > 0 && transactions.every((item) => selected.includes(item.id));
  const hasFilters = Boolean(search || startDate || endDate || type !== "all" || status !== "all" || category !== "all");
  const resetFilters = () => { setSearch(""); setType("all"); setStatus("all"); setCategory("all"); setStartDate(""); setEndDate(""); setPage(1); };
  const handleDelete = (transaction: Transaction) => { if (window.confirm(`Delete transaction ${transaction.transactionId}?`)) deleteMutation.mutate({ transactionId: transaction.id }); };
  const bulkDelete = () => { if (!selected.length || !window.confirm(`Delete ${selected.length} selected transactions?`)) return; selected.forEach((id) => deleteMutation.mutate({ transactionId: id })); setSelected([]); };

  return <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6 lg:p-8">
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Total Income" value={kpisQuery.isLoading ? "Loading…" : formatCurrency(kpisQuery.data?.totalIncome ?? 0)} icon={ArrowUpRight} tone="positive" />
      <MetricCard title="Total Expenses" value={kpisQuery.isLoading ? "Loading…" : formatCurrency(kpisQuery.data?.totalExpenses ?? 0)} icon={ArrowDownRight} tone="negative" />
      <MetricCard title="Net Balance" value={kpisQuery.isLoading ? "Loading…" : formatCurrency(kpisQuery.data?.netBalance ?? 0)} icon={Wallet} tone={(kpisQuery.data?.netBalance ?? 0) >= 0 ? "positive" : "negative"} />
      <MetricCard title="Pending" value={kpisQuery.isLoading ? "Loading…" : String(kpisQuery.data?.pendingCount ?? 0)} icon={Activity} />
    </section>

    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <Input type="date" className="w-40" aria-label="Start date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
          <Input type="date" className="w-40" aria-label="End date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
          <div className="relative min-w-[220px] flex-1 xl:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search description or category" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
          <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="Income">Income</SelectItem><SelectItem value="Expense">Expense</SelectItem></SelectContent></Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUS_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categoryOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          {hasFilters && <Button variant="ghost" onClick={resetFilters}><X className="mr-1 h-4 w-4" />Clear</Button>}
        </div>
        <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setOfxOpen(true)}><FileUp className="mr-2 h-4 w-4" />Import OFX</Button><Button size="sm" variant="outline" onClick={() => setRulesOpen(true)}><SlidersHorizontal className="mr-2 h-4 w-4" />Rules</Button><Button size="sm" variant="outline" onClick={() => setCategoriesOpen(true)}><FolderCog className="mr-2 h-4 w-4" />Categories</Button><Button size="sm" variant="outline" onClick={() => setAutomationOpen(true)}><Bot className="mr-2 h-4 w-4" />Automations</Button></div>
      </div>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs text-slate-500"><span>{transactions.length} records shown{meta ? ` · ${meta.total} total` : ""}</span>{selected.length > 0 && <div className="flex items-center gap-2"><span>{selected.length} selected</span><Button size="sm" variant="destructive" onClick={bulkDelete}>Delete selected</Button></div>}</div>

      {transactionsQuery.isLoading ? <div className="p-12 text-center text-sm text-slate-500">Loading transactions…</div> : transactions.length === 0 ? <div className="p-12 text-center"><p className="text-sm text-slate-500">No transactions found.</p>{hasFilters && <Button className="mt-3" size="sm" variant="outline" onClick={resetFilters}>Clear filters</Button>}</div> : <>
        <div className="hidden overflow-x-auto lg:block"><Table><TableHeader><TableRow><TableHead className="w-10"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? selected.filter((id) => !transactions.some((item) => item.id === id)) : Array.from(new Set([...selected, ...transactions.map((item) => item.id)])))} aria-label="Select all transactions" /></TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="w-16">Actions</TableHead></TableRow></TableHeader><TableBody>{transactions.map((transaction) => <TableRow key={transaction.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setViewTransaction(transaction)}><TableCell onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.includes(transaction.id)} onChange={() => setSelected((current) => current.includes(transaction.id) ? current.filter((id) => id !== transaction.id) : [...current, transaction.id])} aria-label={`Select ${transaction.transactionId}`} /></TableCell><TableCell><TypeBadge type={transaction.type} /></TableCell><TableCell><p className="max-w-[280px] truncate text-sm font-medium">{transaction.description || transaction.transactionId}</p><p className="text-[10px] text-slate-400">{transaction.transactionId}</p></TableCell><TableCell className="text-xs">{transaction.category}</TableCell><TableCell><StatusBadge status={transaction.status} /></TableCell><TableCell className="text-xs text-slate-500">{formatDate(transaction.date)}</TableCell><TableCell className={`text-right font-mono text-sm font-semibold ${transaction.type === "Expense" ? "text-red-600" : "text-emerald-600"}`}>{transaction.type === "Expense" ? "−" : "+"}{formatCurrency(transaction.amount)}</TableCell><TableCell onClick={(e) => e.stopPropagation()}><Actions transaction={transaction} onView={() => setViewTransaction(transaction)} onEdit={() => setEditTransaction(transaction)} onDelete={() => handleDelete(transaction)} /></TableCell></TableRow>)}</TableBody></Table></div>
        <div className="grid gap-3 p-3 lg:hidden">{transactions.map((transaction) => <article key={transaction.id} className="rounded-lg border border-slate-200 p-4" onClick={() => setViewTransaction(transaction)}><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><input className="mt-1" type="checkbox" checked={selected.includes(transaction.id)} onClick={(e) => e.stopPropagation()} onChange={() => setSelected((current) => current.includes(transaction.id) ? current.filter((id) => id !== transaction.id) : [...current, transaction.id])} /><div><TypeBadge type={transaction.type} /><p className="mt-2 font-medium">{transaction.description || transaction.transactionId}</p><p className="text-xs text-slate-500">{transaction.category} · {formatDate(transaction.date)}</p></div></div><div onClick={(e) => e.stopPropagation()}><Actions transaction={transaction} onView={() => setViewTransaction(transaction)} onEdit={() => setEditTransaction(transaction)} onDelete={() => handleDelete(transaction)} /></div></div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><StatusBadge status={transaction.status} /><span className={`font-mono text-sm font-semibold ${transaction.type === "Expense" ? "text-red-600" : "text-emerald-600"}`}>{transaction.type === "Expense" ? "−" : "+"}{formatCurrency(transaction.amount)}</span></div></article>)}</div>
      </>}
    </section>

    {meta && meta.totalPages > 1 && <div className="flex items-center justify-between"><p className="text-xs text-slate-500">Page {meta.page} of {meta.totalPages}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((v) => v + 1)}>Next</Button></div></div>}

    <TransactionFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    <TransactionFormModal open={Boolean(editTransaction)} onClose={() => setEditTransaction(null)} initialData={editTransaction ?? undefined} />
    <TransactionViewModal transaction={viewTransaction} onClose={() => setViewTransaction(null)} />

    <Dialog open={ofxOpen} onOpenChange={setOfxOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Import OFX</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>OFX File</Label><Input className="mt-1.5" type="file" accept=".ofx,.qfx" onChange={(e) => setOfxName(e.target.files?.[0]?.name ?? "")} /></div>{ofxName && <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">Ready to review: {ofxName}</div>}<p className="text-xs leading-5 text-slate-500">Import remains a review-first operation. Existing transactions are not modified automatically.</p></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOfxOpen(false)}>Cancel</Button><Button disabled={!ofxName} onClick={() => { setOfxName(""); setOfxOpen(false); }}>Review Import</Button></div></DialogContent></Dialog>

    <Dialog open={rulesOpen} onOpenChange={setRulesOpen}><DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Financial Rules</DialogTitle></DialogHeader><div className="grid gap-3 sm:grid-cols-2"><div><Label>Rule Name</Label><Input className="mt-1.5" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} /></div><div><Label>Description contains</Label><Input className="mt-1.5" value={ruleForm.contains} onChange={(e) => setRuleForm({ ...ruleForm, contains: e.target.value })} /></div><div><Label>Type</Label><Select value={ruleForm.type} onValueChange={(v) => setRuleForm({ ...ruleForm, type: v })}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Income">Income</SelectItem><SelectItem value="Expense">Expense</SelectItem></SelectContent></Select></div><div><Label>Category</Label><Select value={ruleForm.category} onValueChange={(v) => setRuleForm({ ...ruleForm, category: v })}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{categoryOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div><Button className="w-fit" onClick={() => { if (!ruleForm.name.trim() || !ruleForm.contains.trim()) return; setRules((current) => [...current, { ...ruleForm, id: crypto.randomUUID(), enabled: true }]); setRuleForm({ name: "", contains: "", type: "Expense", category: "Fuel" }); }}><Plus className="mr-2 h-4 w-4" />Add Rule</Button><div className="space-y-2">{rules.map((rule) => <div key={rule.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3"><div><p className="text-sm font-semibold">{rule.name}</p><p className="text-xs text-slate-500">Contains “{rule.contains}” → {rule.type} / {rule.category}</p></div><div className="flex items-center gap-2"><input type="checkbox" checked={rule.enabled} onChange={() => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item))} /><Button size="sm" variant="ghost" onClick={() => setRules((current) => current.filter((item) => item.id !== rule.id))}>Remove</Button></div></div>)}{!rules.length && <p className="py-5 text-center text-sm text-slate-500">No financial rules configured.</p>}</div></DialogContent></Dialog>

    <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Financial Categories</DialogTitle></DialogHeader><div className="grid gap-3 sm:grid-cols-[1fr_150px_auto]"><Input placeholder="Category name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} /><Select value={categoryForm.type} onValueChange={(v) => setCategoryForm({ ...categoryForm, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Income">Income</SelectItem><SelectItem value="Expense">Expense</SelectItem></SelectContent></Select><Button onClick={() => { if (!categoryForm.name.trim()) return; setCustomCategories((current) => [...current, { id: crypto.randomUUID(), name: categoryForm.name.trim(), type: categoryForm.type }]); setCategoryForm({ name: "", type: "Expense" }); }}>Add</Button></div><div className="max-h-72 space-y-2 overflow-y-auto">{customCategories.map((item) => <div key={item.id} className="flex items-center justify-between rounded border border-slate-200 p-3"><div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-slate-500">{item.type}</p></div><Button size="sm" variant="ghost" onClick={() => setCustomCategories((current) => current.filter((currentItem) => currentItem.id !== item.id))}>Remove</Button></div>)}{!customCategories.length && <p className="py-4 text-center text-sm text-slate-500">Default categories remain available. Add custom categories here.</p>}</div></DialogContent></Dialog>

    <Dialog open={automationOpen} onOpenChange={setAutomationOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Financial Automations</DialogTitle></DialogHeader><div className="space-y-3">{[{ key: "autoCategorize", label: "Auto-categorize matching transactions", text: "Use enabled financial rules to suggest categories." }, { key: "duplicateDetection", label: "Duplicate detection", text: "Flag records with matching date, value and reference." }, { key: "dueReminders", label: "Due-date reminders", text: "Surface pending entries approaching their due date." }, { key: "reconciliationSuggestions", label: "Reconciliation suggestions", text: "Suggest records that may correspond to imported bank activity." }].map((item) => <label key={item.key} className="flex cursor-pointer justify-between gap-4 rounded-lg border border-slate-200 p-3"><div><p className="text-sm font-medium">{item.label}</p><p className="mt-1 text-xs text-slate-500">{item.text}</p></div><input type="checkbox" checked={automations[item.key as keyof typeof automations]} onChange={(e) => setAutomations({ ...automations, [item.key]: e.target.checked })} /></label>)}</div></DialogContent></Dialog>
  </div>;
}
