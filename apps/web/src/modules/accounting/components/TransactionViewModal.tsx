import { useState } from "react";
import type { Transaction } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { TransactionFormModal } from "./TransactionFormModal";
import { Pencil } from "lucide-react";

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

export function TransactionViewModal({ transaction, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  if (!transaction) return null;

  const isExpense = transaction.type === "Expense";

  return (
    <>
      <Dialog open={!!transaction && !editing} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-mono uppercase tracking-widest text-sm">
                TXN — {transaction.transactionId}
              </DialogTitle>
              <Button variant="outline" size="sm" className="gap-1 font-mono text-xs" onClick={() => setEditing(true)}>
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="flex items-center gap-3 p-3 border border-border bg-card">
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Amount</span>
                <span className={`text-2xl font-bold font-mono ${isExpense ? "text-destructive" : "text-primary"}`}>
                  {isExpense ? "-" : "+"}{formatCurrency(transaction.amount)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Status</span>
                <StatusBadge status={transaction.status ?? "Pending"} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Row label="Type" value={transaction.type} />
              <Row label="Category" value={transaction.category} />
              <Row label="Date" value={formatDate(transaction.date)} />
              <Row label="Due Date" value={formatDate(transaction.dueDate)} />
              <Row label="Payment Method" value={transaction.paymentMethod} />
              <Row label="Reference #" value={transaction.referenceNumber} />
              <Row label="Carrier" value={transaction.carrierName} />
              <Row label="Invoice #" value={transaction.invoiceNumber} />
            </div>

            {transaction.description && (
              <div className="border-t border-border pt-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{transaction.description}</p>
              </div>
            )}

            {transaction.notes && (
              <div className="border-t border-border pt-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{transaction.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TransactionFormModal
        open={editing}
        onClose={() => { setEditing(false); onClose(); }}
        initialData={transaction}
      />
    </>
  );
}
