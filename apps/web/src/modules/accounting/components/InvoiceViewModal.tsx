import { useState } from "react";
import {
  getGetCarrierQueryKey,
  useGetCarrier,
  useGetCompanyProfile,
  useGetLoad,
} from "@workspace/api-client-react";
import type {
  Invoice,
  LoadVehicle,
} from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { buildInvoiceDescription } from "@/shared/lib/invoice-utils";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { FileDown, Pencil } from "lucide-react";
import { InvoiceFormModal } from "./InvoiceFormModal";
import { InvoicePDFPreview } from "./InvoicePDFPreview";

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
}

type InvoiceWithCommission = Invoice & {
  subtotal?: number;
  commissionRate?: number;
};

function joinAddress(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(", ");
}

function LinkedLoadRow({ loadId }: { loadId: string }) {
  const loadQuery = useGetLoad(loadId);
  const columns = "6rem minmax(0, 3fr) minmax(5rem, 1fr)";

  if (loadQuery.isLoading) {
    return (
      <div
        className="grid animate-pulse gap-x-4 border-b border-border px-3 py-2 text-xs last:border-b-0"
        style={{ gridTemplateColumns: columns }}
      >
        <span className="text-muted-foreground">Loading…</span>
        <span />
        <span />
      </div>
    );
  }

  const load = loadQuery.data;
  if (!load) {
    return (
      <div
        className="grid gap-x-4 border-b border-border px-3 py-2 text-xs text-destructive last:border-b-0"
        style={{ gridTemplateColumns: columns }}
      >
        <span>—</span>
        <span>{buildInvoiceDescription({ loadId })}</span>
        <span className="text-right">—</span>
      </div>
    );
  }

  const vehicles: Array<LoadVehicle | null> = load.vehicles?.length
    ? load.vehicles
    : [null];

  return (
    <>
      {vehicles.map((vehicle, index) => (
        <div
          key={`${load.id}-${vehicle?.vehicleNumber ?? index}`}
          className="grid items-center gap-x-4 border-b border-border px-3 py-2 text-xs last:border-b-0"
          style={{ gridTemplateColumns: columns }}
        >
          <span className={index > 0 ? "select-none opacity-0" : "text-muted-foreground"}>
            {index === 0 ? formatDate(load.dispatchDate) : ""}
          </span>
          <span className="truncate font-medium">
            {buildInvoiceDescription({
              loadId: load.loadId,
              year: vehicle?.year,
              make: vehicle?.make,
              model: vehicle?.model,
            })}
          </span>
          <span className={index > 0 ? "select-none opacity-0" : "text-right font-bold"}>
            {index === 0 ? formatCurrency(load.rate) : ""}
          </span>
        </div>
      ))}
    </>
  );
}

function BillToSection({ carrierId }: { carrierId?: string | null }) {
  const resolvedCarrierId = carrierId ?? "";
  const carrierQuery = useGetCarrier(resolvedCarrierId, {
    query: {
      enabled: Boolean(resolvedCarrierId),
      queryKey: getGetCarrierQueryKey(resolvedCarrierId),
    },
  });
  const carrier = carrierQuery.data;

  return (
    <section className="border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Bill To
      </p>
      {carrierQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading billing recipient…</p>
      ) : carrier ? (
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{carrier.companyName}</p>
          <p className="text-muted-foreground">
            {carrier.primaryContact ?? "Primary contact not configured"}
          </p>
          <p className="text-muted-foreground">
            {joinAddress([
              carrier.companyAddress,
              carrier.companyCity,
              carrier.companyState,
              carrier.companyZip,
            ]) || "Address not configured"}
          </p>
          <p className="text-muted-foreground">
            {carrier.email ?? carrier.phone ?? "Contact details not configured"}
          </p>
        </div>
      ) : (
        <p className="text-sm text-destructive">Billing recipient not available.</p>
      )}
    </section>
  );
}

function PayToSection() {
  const companyQuery = useGetCompanyProfile();
  const company = companyQuery.data;

  return (
    <section className="border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Pay To
      </p>
      {companyQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading company profile…</p>
      ) : (
        <div className="space-y-1 text-sm">
          <p className="font-semibold">
            {company?.legalCompanyName || company?.companyName || "Lander Dispatch"}
          </p>
          <p className="text-muted-foreground">
            {joinAddress([
              company?.streetAddress,
              company?.city,
              company?.state,
              company?.zipCode,
              company?.country,
            ]) || "Address not configured"}
          </p>
          <p className="text-muted-foreground">
            {company?.companyEmail ?? company?.companyPhone ?? "Contact details not configured"}
          </p>
          {company?.website ? <p className="text-muted-foreground">{company.website}</p> : null}
        </div>
      )}
    </section>
  );
}

export function InvoiceViewModal({ invoice, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  if (!invoice) return null;
  if (showPdf) {
    return <InvoicePDFPreview invoice={invoice} onClose={() => setShowPdf(false)} />;
  }

  const invoiceData = invoice as InvoiceWithCommission;
  const subtotal = invoiceData.subtotal ?? 0;
  const commissionRate = invoiceData.commissionRate ?? 0;
  const loadIds = invoice.loadIds ?? [];

  return (
    <>
      <Dialog open={!editing} onOpenChange={(value) => !value && onClose()}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <DialogTitle className="text-base font-semibold">
                Invoice — {invoice.invoiceNumber}
              </DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowPdf(true)}>
                  <FileDown className="h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <InfoField label="Invoice #" value={invoice.invoiceNumber} />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <div className="mt-1">
                  <StatusBadge status={invoice.status} />
                </div>
              </div>
              <InfoField label="Issue Date" value={formatDate(invoice.issueDate)} />
              <InfoField label="Due Date" value={formatDate(invoice.dueDate)} />
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BillToSection carrierId={invoice.carrierId} />
              <PayToSection />
            </section>

            <section>
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Invoice Items
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {loadIds.length} load{loadIds.length === 1 ? "" : "s"} linked
                  </p>
                </div>
              </div>

              {loadIds.length ? (
                <div className="overflow-hidden border border-border">
                  <div
                    className="grid gap-x-4 border-b border-border bg-muted/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                    style={{ gridTemplateColumns: "6rem minmax(0, 3fr) minmax(5rem, 1fr)" }}
                  >
                    <span>Date</span>
                    <span>Description</span>
                    <span className="text-right">Rate</span>
                  </div>
                  {loadIds.map((loadId) => (
                    <LinkedLoadRow key={loadId} loadId={loadId} />
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No loads linked to this invoice.
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 gap-4 border border-border bg-muted/20 p-4 sm:grid-cols-3">
              <InfoField
                label={`Subtotal (${loadIds.length} load${loadIds.length === 1 ? "" : "s"})`}
                value={formatCurrency(subtotal)}
              />
              <InfoField
                label="Commission"
                value={commissionRate > 0 ? `${commissionRate.toFixed(2)}%` : "—"}
              />
              <InfoField label="Total Commission" value={formatCurrency(invoice.total)} emphasized />
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InfoField label="Total" value={formatCurrency(invoice.total)} />
              <InfoField label="Amount Paid" value={formatCurrency(invoice.amountPaid)} />
              <InfoField label="Balance" value={formatCurrency(invoice.balance)} emphasized />
            </section>

            {invoice.payments?.length ? (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Payment History
                </p>
                <div className="divide-y divide-border border border-border">
                  {invoice.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="grid grid-cols-2 gap-2 px-3 py-2 text-xs sm:grid-cols-4"
                    >
                      <span>{formatDate(payment.paymentDate)}</span>
                      <span>{payment.paymentMethod}</span>
                      <span className="text-muted-foreground">{payment.reference || "—"}</span>
                      <span className="text-right font-semibold">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Notes
              </p>
              <div className="min-h-16 border border-border bg-muted/10 p-3 text-sm whitespace-pre-wrap">
                {invoice.notes || "No notes."}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <InvoiceFormModal
        open={editing}
        onClose={() => {
          setEditing(false);
          onClose();
        }}
        initialData={invoice}
      />
    </>
  );
}

function InfoField({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={emphasized ? "mt-1 text-base font-bold text-primary" : "mt-1 text-sm font-semibold"}>
        {value}
      </p>
    </div>
  );
}
