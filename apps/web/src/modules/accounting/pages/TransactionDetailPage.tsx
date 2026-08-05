import { useState } from "react";
import { useGetTransaction } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Hash,
  Pencil,
  Receipt,
  WalletCards,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { TransactionFormModal } from "../components/TransactionFormModal";

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium">
        {value == null || value === "" ? "—" : value}
      </p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Receipt;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="text-xs font-semibold uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function TransactionDetailPage() {
  const params = useParams<{ transactionId: string }>();
  const transactionId = params.transactionId;
  const [editing, setEditing] = useState(false);

  const query = useGetTransaction(transactionId, {
    query: {
      queryKey: ["transaction", transactionId],
      enabled: Boolean(transactionId),
    },
  });

  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading transaction…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <section className="w-full max-w-lg border border-destructive/40 bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Transaction not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {query.error instanceof Error
              ? query.error.message
              : "The requested accounting transaction could not be loaded."}
          </p>
          <Link href="/accounting/transactions">
            <Button variant="outline" className="mt-5">
              Return to Transactions
            </Button>
          </Link>
        </section>
      </div>
    );
  }

  const transaction = query.data;
  const isExpense = transaction.type === "Expense";
  const signedAmount = `${isExpense ? "−" : "+"}${formatCurrency(transaction.amount)}`;

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link href="/accounting/transactions">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Return to Transactions"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
                {transaction.transactionId}
              </h1>
              <StatusBadge status={transaction.status} />
              <span
                className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  isExpense
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
                }`}
              >
                {transaction.type}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Accounting transaction · {formatDate(transaction.date)}
            </p>
          </div>
        </div>

        <Button className="gap-2" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
          Edit Transaction
        </Button>
      </header>

      <section
        aria-label="Transaction amount and status"
        className="border border-border bg-card p-5 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Amount
            </p>
            <p
              className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${
                isExpense ? "text-destructive" : "text-emerald-700"
              }`}
            >
              {signedAmount}
            </p>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center border ${
              isExpense
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
            }`}
          >
            {isExpense ? (
              <ArrowDownRight className="h-5 w-5" />
            ) : (
              <ArrowUpRight className="h-5 w-5" />
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Classification" icon={WalletCards}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type" value={transaction.type} />
            <Field label="Category" value={transaction.category} />
            <Field label="Status" value={transaction.status} />
            <Field label="Payment Method" value={transaction.paymentMethod} />
          </div>
        </Section>

        <Section title="Dates and Reference" icon={CalendarDays}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Transaction Date" value={formatDate(transaction.date)} />
            <Field label="Due Date" value={formatDate(transaction.dueDate)} />
            <Field label="Reference Number" value={transaction.referenceNumber} />
            <Field label="Internal UUID" value={transaction.id} />
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Carrier" icon={Building2}>
          {transaction.carrierId ? (
            <div className="space-y-4">
              <Field label="Carrier Name" value={transaction.carrierName} />
              <Link href={`/carriers/${transaction.carrierId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Open Carrier
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No Carrier is linked to this transaction.
            </p>
          )}
        </Section>

        <Section title="Invoice" icon={Receipt}>
          {transaction.invoiceId ? (
            <div className="space-y-4">
              <Field label="Invoice Number" value={transaction.invoiceNumber} />
              <Link href={`/accounting/invoices/${transaction.invoiceId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  Open Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No Invoice is linked to this transaction.
            </p>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Description" icon={FileText}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {transaction.description || "No description available."}
          </p>
        </Section>

        <Section title="Notes" icon={CreditCard}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {transaction.notes || "No notes available."}
          </p>
        </Section>
      </div>

      <Section title="Record Identity" icon={Hash}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Transaction ID" value={transaction.transactionId} />
          <Field label="Created At" value={formatDate(transaction.createdAt)} />
        </div>
      </Section>

      <TransactionFormModal
        open={editing}
        initialData={transaction}
        onClose={() => {
          setEditing(false);
          void query.refetch();
        }}
      />
    </div>
  );
}
