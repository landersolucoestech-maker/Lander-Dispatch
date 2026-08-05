import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteInvoice,
  useListInvoices,
} from "@workspace/api-client-react";
import type { Invoice } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { InvoiceFormModal } from "../components/InvoiceFormModal";
import { InvoiceViewModal } from "../components/InvoiceViewModal";

function InvoiceActions({
  invoice,
  onView,
  onEdit,
  onDelete,
}: {
  invoice: Invoice;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label={`Actions for ${invoice.invoiceNumber}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={onDelete}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function InvoicesListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

  const queryClient = useQueryClient();
  const deleteMutation = useDeleteInvoice({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
    },
  });
  const invoicesQuery = useListInvoices(
    {
      search: search || undefined,
      status: status === "all" ? undefined : status,
      page,
      pageSize: 50,
    },
    { query: { queryKey: ["invoices", search, status, page] } },
  );

  const invoices = invoicesQuery.data?.data ?? [];
  const meta = invoicesQuery.data?.meta;

  const handleDelete = (invoice: Invoice) => {
    if (!window.confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return;
    deleteMutation.mutate({ invoiceId: invoice.id });
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">INVOICES</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Commission receivables, balances and payment status.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </header>

      <section className="flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoice number or carrier"
            className="pl-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-52">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
            <SelectItem value="Fully Paid">Fully Paid</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {invoicesQuery.isLoading ? (
        <div className="border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Loading invoices…
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">No invoices found.</p>
          {search || status !== "all" ? (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden border border-border bg-card lg:block">
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
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setViewInvoice(invoice)}
                  >
                    <TableCell className="font-mono text-xs font-bold">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {invoice.carrierName || "Carrier unavailable"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(invoice.issueDate)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold ${
                        invoice.balance > 0 ? "text-destructive" : "text-emerald-600"
                      }`}
                    >
                      {formatCurrency(invoice.balance)}
                    </TableCell>
                    <TableCell><StatusBadge status={invoice.status} /></TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <InvoiceActions
                        invoice={invoice}
                        onView={() => setViewInvoice(invoice)}
                        onEdit={() => setEditInvoice(invoice)}
                        onDelete={() => handleDelete(invoice)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {invoices.map((invoice) => (
              <article
                key={invoice.id}
                className="cursor-pointer border border-border bg-card p-4"
                onClick={() => setViewInvoice(invoice)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-sm font-medium">
                      {invoice.carrierName || "Carrier unavailable"}
                    </p>
                  </div>
                  <div onClick={(event) => event.stopPropagation()}>
                    <InvoiceActions
                      invoice={invoice}
                      onView={() => setViewInvoice(invoice)}
                      onEdit={() => setEditInvoice(invoice)}
                      onDelete={() => handleDelete(invoice)}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Issue Date</p>
                    <p className="mt-1 font-medium">{formatDate(invoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="mt-1 font-medium">{formatDate(invoice.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="mt-1 font-mono font-semibold">{formatCurrency(invoice.total)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Balance</p>
                    <p
                      className={`mt-1 font-mono font-semibold ${
                        invoice.balance > 0 ? "text-destructive" : "text-emerald-600"
                      }`}
                    >
                      {formatCurrency(invoice.balance)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="mb-1 text-muted-foreground">Status</p>
                    <StatusBadge status={invoice.status} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} invoices
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <InvoiceFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <InvoiceFormModal
        open={Boolean(editInvoice)}
        onClose={() => setEditInvoice(null)}
        initialData={editInvoice ?? undefined}
      />
      <InvoiceViewModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} />
    </div>
  );
}
