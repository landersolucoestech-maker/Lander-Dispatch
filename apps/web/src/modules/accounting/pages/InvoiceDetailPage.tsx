import { useGetInvoice, useGetLoad, useGetCarrier, useGetCompanyProfile } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { ArrowLeft, Edit, DollarSign, CheckCircle2, FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { buildInvoiceDescription } from "@/shared/lib/invoice-utils";

// ── per-load row ──────────────────────────────────────────────────────────────

function LinkedLoadRow({ loadId }: { loadId: string }) {
  const { data: load, isLoading } = useGetLoad(loadId);

  const COL = "5rem 3fr 1fr";

  if (isLoading) {
    return (
      <div className="grid gap-x-4 px-4 py-2.5 font-mono text-xs animate-pulse border-b border-border last:border-b-0"
        style={{ gridTemplateColumns: COL }}>
        <span className="text-muted-foreground">…</span><span /><span />
      </div>
    );
  }

  if (!load) {
    return (
      <div className="grid gap-x-4 px-4 py-2.5 font-mono text-xs text-destructive border-b border-border last:border-b-0"
        style={{ gridTemplateColumns: COL }}>
        <span>—</span>
        <span>{buildInvoiceDescription({ loadId })}</span>
        <span>—</span>
      </div>
    );
  }

  const vehicles: any[] = (load as any).vehicles ?? [];
  const rows = vehicles.length > 0 ? vehicles : [null];
  const rate = parseFloat(String((load as any).rate ?? "0")) || 0;
  const dispatchDate: string | null = (load as any).dispatchDate ?? null;

  return (
    <>
      {rows.map((v: any, i: number) => (
        <div
          key={i}
          className="grid gap-x-4 px-4 py-2.5 font-mono text-xs items-center border-b border-border last:border-b-0"
          style={{ gridTemplateColumns: COL }}
        >
          <span className={`text-muted-foreground ${i > 0 ? "opacity-0 select-none" : ""}`}>
            {i === 0 ? (dispatchDate ? formatDate(dispatchDate) : "—") : ""}
          </span>
          <span className="text-foreground">
            {buildInvoiceDescription({
              loadId: (load as any).loadId,
              year: v?.year,
              make: v?.make,
              model: v?.model,
            })}
          </span>
          <span className={`font-bold text-primary ${i > 0 ? "opacity-0 select-none" : ""}`}>
            {i === 0 ? formatCurrency(rate) : ""}
          </span>
        </div>
      ))}
    </>
  );
}

// ── Bill To ───────────────────────────────────────────────────────────────────

function BillToSection({ carrierId }: { carrierId?: string | null }) {
  const { data: carrier } = useGetCarrier(carrierId ?? "", {
    query: { enabled: !!carrierId },
  });

  return (
    <div className="p-4 bg-card border border-border flex flex-col gap-1.5">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Bill To</p>
      {!carrier ? (
        <span className="font-mono text-xs text-muted-foreground">—</span>
      ) : (
        <div className="font-mono text-xs space-y-0.5">
          <span className="block font-bold text-foreground">{carrier.companyName}</span>
          {carrier.primaryContact && <span className="block text-muted-foreground">{carrier.primaryContact}</span>}
          {carrier.companyAddress && <span className="block text-muted-foreground">{carrier.companyAddress}</span>}
          {(carrier.companyCity || carrier.companyState || (carrier as any).companyZip) && (
            <span className="block text-muted-foreground">
              {[carrier.companyCity, carrier.companyState, (carrier as any).companyZip].filter(Boolean).join(", ")}
            </span>
          )}
          {carrier.phone && <span className="block text-muted-foreground">{carrier.phone}</span>}
          {carrier.email && <span className="block text-muted-foreground">{carrier.email}</span>}
        </div>
      )}
    </div>
  );
}

// ── Pay To ────────────────────────────────────────────────────────────────────

function PayToSection() {
  const { data: company } = useGetCompanyProfile();

  return (
    <div className="p-4 bg-card border border-border flex flex-col gap-1.5">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Pay To</p>
      {!company ? (
        <span className="font-mono text-xs text-muted-foreground">—</span>
      ) : (
        <div className="font-mono text-xs space-y-0.5">
          <span className="block font-bold text-foreground">{company.companyName ?? "LANDER DISPATCH"}</span>
          {company.streetAddress && <span className="block text-muted-foreground">{company.streetAddress}</span>}
          {(company.city || company.state || company.zipCode) && (
            <span className="block text-muted-foreground">
              {[company.city, company.state, company.zipCode].filter(Boolean).join(", ")}
            </span>
          )}
          {company.companyPhone && <span className="block text-muted-foreground">{company.companyPhone}</span>}
          {company.companyEmail && <span className="block text-muted-foreground">{company.companyEmail}</span>}
          {company.website && <span className="block text-muted-foreground">{company.website}</span>}
        </div>
      )}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.invoiceId!;

  const { data: invoice, isLoading } = useGetInvoice(id, {
    query: { queryKey: ["invoice", id], enabled: !!id },
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-8 text-center font-mono text-sm text-muted-foreground">
        LOADING.INVOICE...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex-1 p-8 text-center font-mono text-sm text-destructive">
        INVOICE.NOT.FOUND
      </div>
    );
  }

  const d = invoice as any;
  const subtotal: number = Number(d.subtotal ?? 0);
  const commissionRate: number = Number(d.commissionRate ?? 0);
  const commissionAmount: number = Number(invoice.total ?? 0);

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto max-w-4xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/accounting/invoices">
          <Button variant="outline" size="icon" className="w-8 h-8 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight uppercase truncate">Invoice {invoice.invoiceNumber}</h1>
            <StatusBadge status={invoice.status} />
          </div>
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Edit className="w-4 h-4" /> Edit
        </Button>
      </div>

      {/* §8.2 — Invoice Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-card border border-border font-mono text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] uppercase text-muted-foreground">Invoice #</span>
          <span className="font-bold">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] uppercase text-muted-foreground">Issue Date</span>
          <span>{formatDate(invoice.issueDate)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] uppercase text-muted-foreground">Due Date</span>
          <span>{formatDate(invoice.dueDate)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] uppercase text-muted-foreground">Status</span>
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      {/* §8.3 — Bill To | Pay To */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BillToSection carrierId={d.carrierId} />
        <PayToSection />
      </div>

      {/* §8.4 — Invoice Items */}
      <div>
        <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          Invoice Items{d.loadIds?.length > 0 ? ` — ${d.loadIds.length} load${d.loadIds.length > 1 ? "s" : ""}` : ""}
        </p>
        {d.loadIds && d.loadIds.length > 0 ? (
          <div className="border border-border">
            <div
              className="grid gap-x-4 border-b border-border bg-muted/50 px-4 py-2 font-mono text-[9px] uppercase text-muted-foreground"
              style={{ gridTemplateColumns: "5rem 3fr 1fr" }}
            >
              <span>Date</span>
              <span>Description</span>
              <span>Rate</span>
            </div>
            {d.loadIds.map((loadId: string) => (
              <LinkedLoadRow key={loadId} loadId={loadId} />
            ))}
          </div>
        ) : (
          <p className="font-mono text-xs text-muted-foreground">No loads linked.</p>
        )}
      </div>

      {/* §8.5 — Totals */}
      <div className="p-4 bg-card border border-border">
        <h2 className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2 flex items-center gap-2">
          <DollarSign className="w-3 h-3" /> Summary
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center font-mono">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground uppercase">Subtotal</span>
            <span className="text-lg font-bold">{formatCurrency(subtotal > 0 ? subtotal : invoice.total)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground uppercase">Amount Paid</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(invoice.amountPaid)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground uppercase">Balance Due</span>
            <span className={`text-lg font-bold ${invoice.balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {formatCurrency(invoice.balance)}
            </span>
          </div>
        </div>
        {commissionRate > 0 && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 font-mono text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase text-muted-foreground">Commission %</span>
              <span>{commissionRate}%</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase text-muted-foreground">Total Commission</span>
              <span className="font-bold text-primary">{formatCurrency(commissionAmount)}</span>
            </div>
          </div>
        )}
        {invoice.balance > 0 && (
          <div className="mt-4 pt-4 border-t border-border flex justify-end">
            <Button className="gap-2">
              <DollarSign className="w-4 h-4" /> Record Payment
            </Button>
          </div>
        )}
      </div>

      {/* §8.6 — Payment History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="p-4 bg-card border border-border">
          <h2 className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2 flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3" /> Payment History
          </h2>
          <div className="space-y-2">
            {invoice.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between font-mono text-xs border-b border-border/50 pb-2 last:border-0 last:pb-0">
                <span>{formatDate(payment.paymentDate)}</span>
                <span className="text-muted-foreground">{payment.paymentMethod}</span>
                {payment.reference && <span className="text-muted-foreground">REF: {payment.reference}</span>}
                <span className="font-bold text-primary">{formatCurrency(payment.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* §8.8 — Notes */}
      {invoice.notes && (
        <div className="p-4 bg-card border border-border flex flex-col gap-2">
          <h3 className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <FileText className="w-3 h-3" /> Notes
          </h3>
          <p className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
            {invoice.notes}
          </p>
        </div>
      )}

      {/* Meta */}
      <div className="flex justify-between font-mono text-[9px] text-muted-foreground border-t border-border pt-4">
        <span>CREATED: {formatDate(invoice.createdAt)}</span>
        {d.updatedAt && <span>UPDATED: {formatDate(d.updatedAt)}</span>}
      </div>

    </div>
  );
}
