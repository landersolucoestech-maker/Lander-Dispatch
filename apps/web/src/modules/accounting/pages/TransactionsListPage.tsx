import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListTransactions, useGetTransactionKpis, useDeleteTransaction } from "@workspace/api-client-react";
import type { Transaction } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { Search, Plus, ArrowUpRight, ArrowDownRight, Wallet, Activity, MoreHorizontal } from "lucide-react";
import { TransactionFormModal } from "../components/TransactionFormModal";
import { TransactionViewModal } from "../components/TransactionViewModal";

export default function TransactionsListPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTrx, setViewTrx] = useState<Transaction | null>(null);
  const [editTrx, setEditTrx] = useState<Transaction | null>(null);

  const qc = useQueryClient();
  const deleteMutation = useDeleteTransaction({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }) },
  });
  const handleDelete = (trx: Transaction) => {
    if (!window.confirm(`Excluir transaction ${trx.transactionId}?`)) return;
    deleteMutation.mutate({ transactionId: trx.id });
  };

  const { data: kpis, isLoading: isKpisLoading } = useGetTransactionKpis();

  const { data, isLoading } = useListTransactions({ search: search || undefined, type: type !== "all" ? type : undefined, status: status !== "all" ? status : undefined, page, pageSize: 50 }, { query: { queryKey: ["transactions", search, type, status, page] } });

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Transactions</h1>
          <p className="text-sm font-mono text-muted-foreground">General Ledger</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Add Transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isKpisLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse mb-1" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-primary">
                {kpis?.totalIncome != null ? formatCurrency(kpis.totalIncome) : "--"}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isKpisLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse mb-1" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-destructive">
                {kpis?.totalExpenses != null ? formatCurrency(kpis.totalExpenses) : "--"}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">Net Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isKpisLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse mb-1" />
            ) : (
              <div className={`text-2xl font-bold tracking-tight ${(kpis?.netBalance ?? 0) >= 0 ? "text-primary" : "text-destructive"}`}>
                {kpis?.netBalance != null ? formatCurrency(kpis.netBalance) : "--"}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">Pending</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isKpisLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse mb-1" />
            ) : (
              <div className="text-2xl font-bold tracking-tight">
                {kpis?.pendingCount != null ? kpis.pendingCount : "--"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Description, Category..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-36">
          <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL TYPES</SelectItem>
              <SelectItem value="Income">INCOME</SelectItem>
              <SelectItem value="Expense">EXPENSE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL STATUSES</SelectItem>
              <SelectItem value="Pending">PENDING</SelectItem>
              <SelectItem value="Cleared">CLEARED</SelectItem>
              <SelectItem value="Reconciled">RECONCILED</SelectItem>
              <SelectItem value="Void">VOID</SelectItem>
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
          {search || type !== "all" || status !== "all" ? (
            <Button variant="link" onClick={() => { setSearch(""); setType("all"); setStatus("all"); }} className="font-mono text-xs">
              CLEAR.FILTERS
            </Button>
          ) : null}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>TXN ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((trx) => (
              <TableRow key={trx.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewTrx(trx)}>
                <TableCell className="font-mono text-xs font-bold">{trx.transactionId}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(trx.date)}</TableCell>
                <TableCell className="font-mono text-xs">{trx.category}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{trx.description || "--"}</TableCell>
                <TableCell>
                  <span className={`font-mono text-xs px-1.5 py-0.5 border ${
                    trx.type === "Expense"
                      ? "border-destructive/40 text-destructive bg-destructive/5"
                      : "border-primary/40 text-primary bg-primary/5"
                  }`}>
                    {trx.type.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className={`text-right font-mono font-medium ${trx.type === "Expense" ? "text-destructive" : "text-primary"}`}>
                  {trx.type === "Expense" ? "-" : "+"}{formatCurrency(trx.amount)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={trx.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewTrx(trx)}>Ver</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditTrx(trx)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(trx)}>Excluir</DropdownMenuItem>
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

      <TransactionFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <TransactionFormModal open={!!editTrx} onClose={() => setEditTrx(null)} initialData={editTrx ?? undefined} />
      <TransactionViewModal transaction={viewTrx} onClose={() => setViewTrx(null)} />
    </div>
  );
}
