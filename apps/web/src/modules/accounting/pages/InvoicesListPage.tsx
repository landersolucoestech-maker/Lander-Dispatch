import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteInvoice, useListInvoices } from "@workspace/api-client-react";
import type { Invoice } from "@workspace/api-client-react";
import { Download, FileUp, MoreHorizontal, Search, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { InvoiceFormModal } from "../components/InvoiceFormModal";
import { InvoiceViewModal } from "../components/InvoiceViewModal";

function InvoiceActions({ invoice, onView, onEdit, onDelete }: { invoice: Invoice; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${invoice.invoiceNumber}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={onView}>View</DropdownMenuItem><DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem><DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={onDelete}>Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
function escapeCsv(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function downloadCsv(filename: string, rows: unknown[][]) { const blob = new Blob([rows.map((row) => row.map(escapeCsv).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); }

export default function InvoicesListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importName, setImportName] = useState("");

  useEffect(() => { const openCreate = () => setCreateOpen(true); window.addEventListener("lander:invoices-create", openCreate); return () => window.removeEventListener("lander:invoices-create", openCreate); }, []);
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteInvoice({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }) } });
  const invoicesQuery = useListInvoices({ search: search || undefined, status: status === "all" ? undefined : status, page, pageSize: 100 }, { query: { queryKey: ["invoices", search, status, page] } });
  const source = invoicesQuery.data?.data ?? [];
  const invoices = useMemo(() => source.filter((invoice) => { const date = invoice.issueDate?.slice(0, 10) ?? ""; if (startDate && date && date < startDate) return false; if (endDate && date && date > endDate) return false; return true; }), [source, startDate, endDate]);
  const meta = invoicesQuery.data?.meta;
  const hasFilters = Boolean(search || status !== "all" || startDate || endDate);
  const allSelected = invoices.length > 0 && invoices.every((invoice) => selected.includes(invoice.id));
  const total = invoices.reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.balance ?? 0), 0);
  const paid = total - outstanding;
  const overdue = invoices.filter((invoice) => invoice.status === "Overdue").length;
  const resetFilters = () => { setSearch(""); setStatus("all"); setStartDate(""); setEndDate(""); setPage(1); };
  const handleDelete = (invoice: Invoice) => { if (window.confirm(`Delete invoice ${invoice.invoiceNumber}?`)) deleteMutation.mutate({ invoiceId: invoice.id }); };
  const deleteSelected = () => { if (!selected.length || !window.confirm(`Delete ${selected.length} selected invoices?`)) return; selected.forEach((id) => deleteMutation.mutate({ invoiceId: id })); setSelected([]); };
  const exportRows = () => downloadCsv("lander-dispatch-invoices.csv", [["Invoice #", "Carrier", "Issue Date", "Due Date", "Total", "Balance", "Status"], ...invoices.map((invoice) => [invoice.invoiceNumber, invoice.carrierName ?? "", invoice.issueDate ?? "", invoice.dueDate ?? "", invoice.total ?? 0, invoice.balance ?? 0, invoice.status])]);

  return <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6 lg:p-8">
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[{ label: "Invoice Value", value: formatCurrency(total) }, { label: "Received", value: formatCurrency(paid) }, { label: "Outstanding", value: formatCurrency(outstanding) }, { label: "Overdue", value: String(overdue) }].map((item) => <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-semibold text-[#0B1E36]">{item.value}</p></div>)}</section>
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-wrap gap-2"><Input className="w-40" type="date" aria-label="Start date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} /><Input className="w-40" type="date" aria-label="End date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} /><div className="relative min-w-[220px] flex-1 xl:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search invoice number or carrier" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div><Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Partially Paid">Partially Paid</SelectItem><SelectItem value="Fully Paid">Fully Paid</SelectItem><SelectItem value="Overdue">Overdue</SelectItem><SelectItem value="Canceled">Canceled</SelectItem></SelectContent></Select>{hasFilters && <Button variant="ghost" onClick={resetFilters}><X className="mr-1 h-4 w-4" />Clear</Button>}</div>
        <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><FileUp className="mr-2 h-4 w-4" />Import</Button><Button size="sm" variant="outline" onClick={exportRows} disabled={!invoices.length}><Download className="mr-2 h-4 w-4" />Export</Button></div>
      </div>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs text-slate-500"><span>{invoices.length} records shown{meta ? ` · ${meta.total} total` : ""}</span>{selected.length > 0 && <div className="flex items-center gap-2"><span>{selected.length} selected</span><Button size="sm" variant="destructive" onClick={deleteSelected}>Delete selected</Button></div>}</div>
      {invoicesQuery.isLoading ? <div className="p-12 text-center text-sm text-slate-500">Loading invoices…</div> : invoices.length === 0 ? <div className="p-12 text-center"><p className="text-sm text-slate-500">No invoices found.</p>{hasFilters && <Button className="mt-3" variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>}</div> : <>
        <div className="hidden overflow-x-auto lg:block"><Table><TableHeader><TableRow><TableHead className="w-10"><input type="checkbox" aria-label="Select all invoices" checked={allSelected} onChange={() => setSelected(allSelected ? selected.filter((id) => !invoices.some((invoice) => invoice.id === id)) : Array.from(new Set([...selected, ...invoices.map((invoice) => invoice.id)])))} /></TableHead><TableHead>Invoice #</TableHead><TableHead>Carrier</TableHead><TableHead>Issue Date</TableHead><TableHead>Due Date</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead><TableHead className="w-16">Actions</TableHead></TableRow></TableHeader><TableBody>{invoices.map((invoice) => <TableRow key={invoice.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setViewInvoice(invoice)}><TableCell onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.includes(invoice.id)} aria-label={`Select ${invoice.invoiceNumber}`} onChange={() => setSelected((current) => current.includes(invoice.id) ? current.filter((id) => id !== invoice.id) : [...current, invoice.id])} /></TableCell><TableCell className="font-mono text-xs font-semibold">{invoice.invoiceNumber}</TableCell><TableCell className="text-sm font-medium">{invoice.carrierName || "Carrier unavailable"}</TableCell><TableCell className="text-xs text-slate-500">{formatDate(invoice.issueDate)}</TableCell><TableCell className="text-xs text-slate-500">{formatDate(invoice.dueDate)}</TableCell><TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(invoice.total)}</TableCell><TableCell className={`text-right font-mono text-sm font-semibold ${Number(invoice.balance) > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(invoice.balance)}</TableCell><TableCell><StatusBadge status={invoice.status} /></TableCell><TableCell onClick={(e) => e.stopPropagation()}><InvoiceActions invoice={invoice} onView={() => setViewInvoice(invoice)} onEdit={() => setEditInvoice(invoice)} onDelete={() => handleDelete(invoice)} /></TableCell></TableRow>)}</TableBody></Table></div>
        <div className="grid gap-3 p-3 lg:hidden">{invoices.map((invoice) => <article key={invoice.id} className="rounded-lg border border-slate-200 p-4" onClick={() => setViewInvoice(invoice)}><div className="flex items-start justify-between"><div className="flex gap-3"><input className="mt-1" type="checkbox" checked={selected.includes(invoice.id)} onClick={(e) => e.stopPropagation()} onChange={() => setSelected((current) => current.includes(invoice.id) ? current.filter((id) => id !== invoice.id) : [...current, invoice.id])} /><div><p className="font-mono text-sm font-semibold">{invoice.invoiceNumber}</p><p className="mt-1 text-sm font-medium">{invoice.carrierName || "Carrier unavailable"}</p></div></div><div onClick={(e) => e.stopPropagation()}><InvoiceActions invoice={invoice} onView={() => setViewInvoice(invoice)} onEdit={() => setEditInvoice(invoice)} onDelete={() => handleDelete(invoice)} /></div></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs"><div><p className="text-slate-400">Issue Date</p><p className="mt-1 font-medium">{formatDate(invoice.issueDate)}</p></div><div><p className="text-slate-400">Due Date</p><p className="mt-1 font-medium">{formatDate(invoice.dueDate)}</p></div><div><p className="text-slate-400">Total</p><p className="mt-1 font-semibold">{formatCurrency(invoice.total)}</p></div><div><p className="text-slate-400">Balance</p><p className="mt-1 font-semibold">{formatCurrency(invoice.balance)}</p></div><div className="col-span-2"><StatusBadge status={invoice.status} /></div></div></article>)}</div>
      </>}
    </section>
    {meta && meta.totalPages > 1 && <div className="flex items-center justify-between"><p className="text-xs text-slate-500">Page {meta.page} of {meta.totalPages}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((v) => v + 1)}>Next</Button></div></div>}
    <InvoiceFormModal open={createOpen} onClose={() => setCreateOpen(false)} /><InvoiceFormModal open={Boolean(editInvoice)} onClose={() => setEditInvoice(null)} initialData={editInvoice ?? undefined} /><InvoiceViewModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} />
    <Dialog open={importOpen} onOpenChange={setImportOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Import Invoices</DialogTitle></DialogHeader><div><Label>File</Label><Input className="mt-1.5" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setImportName(e.target.files?.[0]?.name ?? "")} />{importName && <p className="mt-2 text-sm text-slate-500">Selected: {importName}</p>}</div><p className="text-xs leading-5 text-slate-500">Imported rows must be reviewed before records are created. Existing invoices are not overwritten automatically.</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button><Button disabled={!importName} onClick={() => { setImportName(""); setImportOpen(false); }}>Review Import</Button></div></DialogContent></Dialog>
  </div>;
}
