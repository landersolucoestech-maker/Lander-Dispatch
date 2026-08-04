import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListInvoices, useDeleteInvoice } from "@workspace/api-client-react";
import type { Invoice } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { InvoiceFormModal } from "../components/InvoiceFormModal";
import { InvoiceViewModal } from "../components/InvoiceViewModal";

export default function InvoicesListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

  const qc = useQueryClient();
  const deleteMutation = useDeleteInvoice({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }) },
  });
  const handleDelete = (invoice: Invoice) => {
    if (!window.confirm(`Excluir invoice ${invoice.invoiceNumber}?`)) return;
    deleteMutation.mutate({ invoiceId: invoice.id });
  };

  const { data, isLoading } = useListInvoices({ search: search || undefined, status: status !== "all" ? status : undefined, page, pageSize: 50 }, { query: { queryKey: ["invoices", search, status, page] } });

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Invoices</h1>
          <p className="text-sm font-mono text-muted-foreground">Receivables & Payables</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Create Invoice
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Invoice#, Carrier..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-48">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL STATUSES</SelectItem>
              <SelectItem value="Pending">PENDING</SelectItem>
              <SelectItem value="Partially Paid">PARTIALLY PAID</SelectItem>
              <SelectItem value="Fully Paid">FULLY PAID</SelectItem>
              <SelectItem value="Overdue">OVERDUE</SelectItem>
              <SelectItem value="Canceled">CANCELED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center font-mono text-sm text-muted-foreground border border-border bg-card">
          LOADING.RECORDS...
        </div>
      ) : !data?.data.length ? (
        <div className="p-12 text-center border border-border bg-card flex flex-col items-center justify-center gap-2">
          <p className="font-mono text-sm text-muted-foreground">NO.RECORDS.FOUND</p>
          {search || status !== "all" ? (
            <Button variant="link" onClick={() => { setSearch(""); setStatus("all"); }} className="font-mono text-xs">
              CLEAR.FILTERS
            </Button>
          ) : null}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((invoice) => (
              <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewInvoice(invoice)}>
                <TableCell className="font-mono text-xs font-bold">{invoice.invoiceNumber}</TableCell>
                <TableCell className="font-medium text-xs uppercase">{invoice.carrierName}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(invoice.issueDate)}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(invoice.dueDate)}</TableCell>
                <TableCell className="text-right font-mono font-medium">{formatCurrency(invoice.total)}</TableCell>
                <TableCell className="text-right font-mono font-medium text-destructive">{formatCurrency(invoice.balance)}</TableCell>
                <TableCell>
                  <StatusBadge status={invoice.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewInvoice(invoice)}>Ver</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditInvoice(invoice)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(invoice)}>Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="font-mono text-xs text-muted-foreground">
            PAGE {data.meta.page} OF {data.meta.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>PREV</Button>
            <Button variant="outline" size="sm" disabled={page === data.meta.totalPages} onClick={() => setPage(p => p + 1)}>NEXT</Button>
          </div>
        </div>
      )}

      <InvoiceFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <InvoiceFormModal open={!!editInvoice} onClose={() => setEditInvoice(null)} initialData={editInvoice ?? undefined} />
      <InvoiceViewModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} />
    </div>
  );
}
