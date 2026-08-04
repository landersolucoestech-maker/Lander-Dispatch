import { useState } from "react";
import type { Invoice } from "@workspace/api-client-react";
import { useGetLoad, useGetCarrier, getGetCarrierQueryKey, useGetCompanyProfile } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { buildInvoiceDescription } from "@/shared/lib/invoice-utils";
import { InvoiceFormModal } from "./InvoiceFormModal";
import { InvoicePDFPreview } from "./InvoicePDFPreview";
import { Pencil, FileDown } from "lucide-react";

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return <span className="block font-mono text-[11px]">{label ? `${value}` : value}</span>;
}

// ── per-load row ──────────────────────────────────────────────────────────────

function LinkedLoadRow({ loadId }: { loadId: string }) {
  const { data: load, isLoading } = useGetLoad(loadId);

  const COL = "5rem 3fr 1fr";

  if (isLoading) {
    return (
      <div className="grid gap-x-4 px-3 py-2 font-mono text-[11px] animate-pulse border-b border-border last:border-b-0"
        style={{ gridTemplateColumns: COL }}>
        <span className="text-muted-foreground">…</span><span /><span />
      </div>
    );
  }

  if (!load) {
    return (
      <div className="grid gap-x-4 px-3 py-2 font-mono text-[11px] text-destructive border-b border-border last:border-b-0"
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
          className="grid gap-x-4 px-3 py-2 font-mono text-[11px] items-center border-b border-border last:border-b-0"
          style={{ gridTemplateColumns: COL }}
        >
          <span className={`text-muted-foreground ${i > 0 ? "opacity-0 select-none" : ""}`}>
            {i === 0 ? (dispatchDate ? formatDate(dispatchDate) : "—") : ""}
          </span>
          <span className="truncate text-foreground">
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
  const { data: carrier, isLoading } = useGetCarrier(carrierId ?? "", {
    query: { enabled: !!carrierId },
  });

  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Bill To</p>
      {isLoading ? (
        <span className="font-mono text-xs text-muted-foreground animate-pulse">Loading…</span>
      ) : !carrier ? (
        <span className="font-mono text-xs text-destructive">No billing recipient</span>
      ) : (
        <div className="font-mono text-[11px] space-y-0.5">
          <span className="block font-bold text-foreground text-xs">{carrier.companyName}</span>
          <Field label="" value={carrier.primaryContact} />
          {carrier.companyAddress && (
            <span className="block text-muted-foreground">{carrier.companyAddress}</span>
          )}
          {(carrier.companyCity || carrier.companyState || (carrier as any).companyZip) && (
            <span className="block text-muted-foreground">
              {[carrier.companyCity, carrier.companyState, (carrier as any).companyZip]
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
          <Field label="" value={carrier.phone} />
          <Field label="" value={carrier.email} />
        </div>
      )}
    </div>
  );
}

// ── Pay To ────────────────────────────────────────────────────────────────────

function PayToSection() {
  const { data: company, isLoading } = useGetCompanyProfile();

  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Pay To</p>
      {isLoading ? (
        <span className="font-mono text-xs text-muted-foreground animate-pulse">Loading…</span>
      ) : !company ? (
        <span className="font-mono text-xs text-muted-foreground">—</span>
      ) : (
        <div className="font-mono text-[11px] space-y-0.5">
          <span className="block font-bold text-foreground text-xs">{company.companyName ?? "LANDER DISPATCH"}</span>
          {company.streetAddress && (
            <span className="block text-muted-foreground">{company.streetAddress}</span>
          )}
          {(company.city || company.state || company.zipCode) && (
            <span className="block text-muted-foreground">
              {[company.city, company.state, company.zipCode].filter(Boolean).join(", ")}
            </span>
          )}
          <Field label="" value={company.companyPhone} />
          <Field label="" value={company.companyEmail} />
          <Field label="" value={company.website} />
        </div>
      )}
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

export function InvoiceViewModal({ invoice, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  if (!invoice) return null;

  if (showPDF) {
    return <InvoicePDFPreview invoice={invoice} onClose={() => setShowPDF(false)} />;
  }

  const d = invoice as any;
  const subtotal: number = Number(d.subtotal ?? 0);
  const commissionRate: number = Number(d.commissionRate ?? 0);
  const commissionAmount: number = Number(invoice.total ?? 0);

  return (
    <>
      <Dialog open={!!invoice && !editing} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-mono uppercase tracking-widest text-sm">
                Invoice — {invoice.invoiceNumber}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1 font-mono text-xs" onClick={() => setShowPDF(true)}>
                  <FileDown className="w-3 h-3" /> PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-1 font-mono text-xs" onClick={() => setEditing(true)}>
                  <Pencil className="w-3 h-3" /> Edit
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-2 space-y-5">

            {/* §8.2 — Invoice Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[9px] uppercase text-muted-foreground">Invoice #</span>
                <span className="font-mono text-sm font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[9px] uppercase text-muted-foreground">Status</span>
                <StatusBadge status={invoice.status} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[9px] uppercase text-muted-foreground">Issue Date</span>
                <span className="font-mono text-sm">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[9px] uppercase text-muted-foreground">Due Date</span>
                <span className="font-mono text-sm">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>

            {/* §8.3 — Bill To | Pay To */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 border border-border p-4 bg-muted/20">
              <BillToSection carrierId={d.carrierId} />
              <PayToSection />
            </div>

            {/* §8.4 — Invoice Items */}
            <div>
              <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Invoice Items{d.loadIds?.length > 0 ? ` — ${d.loadIds.length} load${d.loadIds.length > 1 ? "s" : ""}` : ""}
              </p>
              {d.loadIds && d.loadIds.length > 0 ? (
                <div className="overflow-hidden border border-border">
                  <div
                    className="grid gap-x-4 border-b border-border bg-muted/50 px-3 py-1.5 font-mono text-[9px] uppercase text-muted-foreground"
                    style={{ gridTemplateColumns: "5rem 3fr 1fr" }}
                  >
                    <span>Date</span>
                    <span>Description</span>
                    <span>Rate</span>
                  </div>
                  {d.loadIds.map((id: string) => (
                    <LinkedLoadRow key={id} loadId={id} />
                  ))}
                </div>
              ) : (
                <p className="font-mono text-xs text-muted-foreground">No loads linked.</p>
              )}
            </div>

            {/* §8.5 — Totals / Commission */}
            <div className="rounded border border-border bg-muted/30 p-4">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3">Commission</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase text-muted-foreground">
                    Subtotal ({d.loadIds?.length ?? 0} {(d.loadIds?.length ?? 0) === 1 ? "load" : "loads"})
                  </span>
                  <span className="font-mono text-sm font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase text-muted-foreground">Commission %</span>
                  <span className="font-mono text-sm font-medium">{commissionRate > 0 ? `${commissionRate}%` : "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase text-muted-foreground">Total Commission</span>
                  <span className="font-mono text-sm font-bold text-primary">{formatCurrency(commissionAmount)}</span>
                </div>
              </div>
            </div>

            {/* §8.6 — Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  Payment History ({invoice.payments.length})
                </p>
                <div className="space-y-1">
                  {invoice.payments.map((pmt, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-mono border border-border px-3 py-2">
                      <span>{formatDate(pmt.paymentDate)}</span>
                      <span>{pmt.paymentMethod}</span>
                      {pmt.reference && <span className="text-muted-foreground">{pmt.reference}</span>}
                      <span className="font-bold">{formatCurrency(pmt.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* §8.8 — Bank Details */}
            <div>
              <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Bank Details</p>
              {invoice.notes ? (
                <p className="text-sm whitespace-pre-wrap font-mono">{invoice.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground font-mono">—</p>
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>

      <InvoiceFormModal
        open={editing}
        onClose={() => { setEditing(false); onClose(); }}
        initialData={invoice}
      />
    </>
  );
}
