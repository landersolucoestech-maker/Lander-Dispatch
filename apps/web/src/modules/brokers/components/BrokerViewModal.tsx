import { useState } from "react";
import type { Broker } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatDate } from "@/shared/lib/utils";
import {
  Building2,
  CreditCard,
  MapPinned,
  Pencil,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { BrokerFormModal } from "./BrokerFormModal";

interface Props {
  broker: Broker | null;
  onClose: () => void;
}

function DataField({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value;

  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium">{display ?? "—"}</p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Building2;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-xs font-semibold uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function TokenList({ values }: { values?: string[] | null }) {
  if (!values?.length) return <p className="text-sm text-muted-foreground">Not configured.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span key={value} className="border border-border bg-muted/30 px-2 py-1 text-xs">
          {value}
        </span>
      ))}
    </div>
  );
}

export function BrokerViewModal({ broker, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  if (!broker) return null;

  return (
    <>
      <Dialog open={!editing} onOpenChange={(value) => !value && onClose()}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <DialogTitle className="text-base font-semibold">{broker.companyName}</DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  MC {broker.mcNumber || "not configured"} · USDOT {broker.usdotNumber || "not configured"}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" />
                Edit Broker
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-border bg-card p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                <div className="mt-2"><StatusBadge status={broker.status} /></div>
              </div>
              <div className="border border-border bg-card p-4">
                <DataField label="Broker Type" value={broker.brokerType} />
              </div>
              <div className="border border-border bg-card p-4">
                <DataField label="Priority" value={broker.priority} />
              </div>
              <div className="border border-border bg-card p-4">
                <DataField
                  label="Rating"
                  value={broker.rating == null ? "Not rated" : `${broker.rating.toFixed(1)} / 5.0`}
                />
              </div>
            </section>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Section title="Company & Contact" icon={Building2}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DataField label="Primary Contact" value={broker.primaryContact} />
                  <DataField label="Phone" value={broker.phone} />
                  <DataField label="Email" value={broker.email} />
                  <DataField label="Website" value={broker.website} />
                  <DataField label="Last Contact" value={formatDate(broker.lastContact)} />
                  <DataField label="Onboarding Status" value={broker.onboardingStatus} />
                </div>
              </Section>

              <Section title="Authority" icon={ShieldCheck}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DataField label="MC Number" value={broker.mcNumber} />
                  <DataField label="USDOT Number" value={broker.usdotNumber} />
                  <DataField label="Status" value={broker.status} />
                  <DataField label="Priority" value={broker.priority} />
                </div>
              </Section>
            </div>

            <Section title="Coverage" icon={MapPinned}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div>
                  <DataField label="Coverage Area" value={broker.coverage} />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Freight Types
                  </p>
                  <TokenList values={broker.freightTypes} />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Selected States
                  </p>
                  <TokenList values={broker.selectedStates} />
                </div>
              </div>
            </Section>

            <Section title="Payment Terms" icon={CreditCard}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <DataField label="Terms" value={broker.paymentTerms} />
                <DataField label="Payment Days" value={broker.paymentDays} />
                <DataField label="QuickPay" value={broker.quickPay} />
                <DataField
                  label="QuickPay Fee"
                  value={broker.quickPayFee == null ? "—" : `${broker.quickPayFee.toFixed(2)}%`}
                />
                <DataField label="Factoring Accepted" value={broker.factoringAccepted} />
              </div>
            </Section>

            {broker.tags?.length ? (
              <Section title="Tags" icon={Phone}>
                <TokenList values={broker.tags} />
              </Section>
            ) : null}

            <Section title="Notes" icon={Phone}>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {broker.notes || "No notes available."}
              </p>
            </Section>
          </div>
        </DialogContent>
      </Dialog>

      <BrokerFormModal
        open={editing}
        initialData={broker}
        onClose={() => {
          setEditing(false);
          onClose();
        }}
      />
    </>
  );
}
