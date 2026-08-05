import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteTransaction,
  useGetTransactionKpis,
  useListTransactions,
} from "@workspace/api-client-react";
import type { Transaction } from "@workspace/api-client-react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  MoreHorizontal,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { TransactionFormModal } from "../components/TransactionFormModal";
import { TransactionViewModal } from "../components/TransactionViewModal";

function MetricCard({
  title,
  value,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  icon: typeof Wallet;
  tone?: "default" | "positive" | "negative";
}) {
  const valueClass =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
        ? "text-destructive"
        : "text-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold tracking-tight ${valueClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function TypeBadge({ type }: { type: Transaction["type"] }) {
  const isExpense = type === "Expense";
  return (
    <span
      className={`inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
        isExpense
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "border-emerald-500/40 bg-emerald-500/5 text-emerald-700"
      }`}
    >
      {type}
    </span>
  );
}

function TransactionActions({
  transaction,
  onView,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
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
          aria-label={`Actions for ${transaction.transactionId}`}
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

export default function TransactionsListPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  const queryClient = useQueryClient();
  const deleteMutation = useDeleteTransaction({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    },
  });
  const kpisQuery = useGetTransactionKpis();
  const transactionsQuery = useListTransactions(
    {
      search: search || undefined,
      type: type === "all" ? undefined : type,
      status: status === "all" ? undefined : status,
      page,
      pageSize: 50,
    },
    { query: { queryKey: ["transactions", search, type, status, page] } },
  );

  const transactions = transactionsQuery.data?.data ?? [];
  const meta = transactionsQuery.data?.meta;

  const handleDelete = (transaction: Transaction) => {
    if (!window.confirm(`Delete transaction ${transaction.transactionId}?`)) return;
    deleteMutation.mutate({ transactionId: transaction.id });
  };

  const resetFilters = () => {
    setSearch("");
    setType("all");
    setStatus("all");
    setPage(1);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">TRANSACTIONS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Income, expenses and general-ledger activity.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Income"
          value={
            kpisQuery.isLoading
              ? "Loading…"
              : formatCurrency(kpisQuery.data?.totalIncome ?? 0)
          }
          icon={ArrowUpRight}
          tone="positive"
        />
        <MetricCard
          title="Total Expenses"
          value={
            kpisQuery.isLoading
              ? "Loading…"
              : formatCurrency(kpisQuery.data?.totalExpenses ?? 0)
          }
          icon={ArrowDownRight}
          tone="negative"
        />
        <MetricCard
          title="Net Balance"
          value={
            kpisQuery.isLoading
              ? "Loading…"
              : formatCurrency(kpisQuery.data?.netBalance ?? 0)
          }
          icon={Wallet}
          tone={(kpisQuery.data?.netBalance ?? 0) >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          title="Pending"
          value={kpisQuery.isLoading ? "Loading…" : String(kpisQuery.data?.pendingCount ?? 0)}
          icon={Activity}
        />
      </section>

      <section className="flex flex-col gap-3 border border-border bg-card p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search description or category"
            className="pl-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={type}
          onValueChange={(value) => {
            setType(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="Income">Income</SelectItem>
            <SelectItem value="Expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Cleared">Cleared</SelectItem>
            <SelectItem value="Reconciled">Reconciled</SelectItem>
            <SelectItem value="Void">Void</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {transactionsQuery.isLoading ? (
        <div className="border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Loading transactions…
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">No transactions found.</p>
          {search || type !== "all" || status !== "all" ? (
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
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setViewTransaction(transaction)}
                  >
                    <TableCell className="font-mono text-xs font-bold">
                      {transaction.transactionId}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell className="text-xs">{transaction.category}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">
                      {transaction.description || "—"}
                    </TableCell>
                    <TableCell><TypeBadge type={transaction.type} /></TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold ${
                        transaction.type === "Expense" ? "text-destructive" : "text-emerald-600"
                      }`}
                    >
                      {transaction.type === "Expense" ? "−" : "+"}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell><StatusBadge status={transaction.status} /></TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <TransactionActions
                        transaction={transaction}
                        onView={() => setViewTransaction(transaction)}
                        onEdit={() => setEditTransaction(transaction)}
                        onDelete={() => handleDelete(transaction)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {transactions.map((transaction) => (
              <article
                key={transaction.id}
                className="cursor-pointer border border-border bg-card p-4"
                onClick={() => setViewTransaction(transaction)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold">{transaction.transactionId}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(transaction.date)} · {transaction.category}
                    </p>
                  </div>
                  <div onClick={(event) => event.stopPropagation()}>
                    <TransactionActions
                      transaction={transaction}
                      onView={() => setViewTransaction(transaction)}
                      onEdit={() => setEditTransaction(transaction)}
                      onDelete={() => handleDelete(transaction)}
                    />
                  </div>
                </div>

                <p className="mt-4 text-sm text-muted-foreground">
                  {transaction.description || "No description."}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <div className="mt-1"><TypeBadge type={transaction.type} /></div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p
                      className={`mt-1 font-mono text-sm font-bold ${
                        transaction.type === "Expense" ? "text-destructive" : "text-emerald-600"
                      }`}
                    >
                      {transaction.type === "Expense" ? "−" : "+"}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="mb-1 text-xs text-muted-foreground">Status</p>
                    <StatusBadge status={transaction.status} />
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
            Page {meta.page} of {meta.totalPages} · {meta.total} transactions
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

      <TransactionFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <TransactionFormModal
        open={Boolean(editTransaction)}
        onClose={() => setEditTransaction(null)}
        initialData={editTransaction ?? undefined}
      />
      <TransactionViewModal
        transaction={viewTransaction}
        onClose={() => setViewTransaction(null)}
      />
    </div>
  );
}
