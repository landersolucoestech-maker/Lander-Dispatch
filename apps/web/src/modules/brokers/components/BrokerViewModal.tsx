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
import { BrokerFormModal } from "./BrokerFormModal";
import { Pencil } from "lucide-react";

interface Props {
  broker: Broker | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{display ?? "—"}</span>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div className="border-t border-border pt-3">
      <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2">{title}</p>
    </div>
  );
}

export function BrokerViewModal({ broker, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  if (!broker) return null;

  return (
    <>
      <Dialog open={!!broker && !editing} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-mono uppercase tracking-widest text-sm">
                {broker.companyName}
              </DialogTitle>
              <Button variant="outline" size="sm" className="gap-1 font-mono text-xs" onClick={() => setEditing(true)}>
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-2 space-y-0">

            {/* Identity */}
            <div className="grid grid-cols-2 gap-4 pb-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Status</span>
                <StatusBadge status={broker.status} />
              </div>
              <Row label="Type" value={broker.brokerType} />
              <Row label="Priority" value={broker.priority} />
              <Row label="Rating" value={broker.rating != null ? `${broker.rating.toFixed(1)} / 5.0` : undefined} />
              <Row label="Website" value={broker.website} />
              <Row label="Onboarding Status" value={broker.onboardingStatus} />
            </div>

            {/* Identifiers */}
            <Section title="Identifiers" />
            <div className="grid grid-cols-2 gap-4 pb-3">
              <Row label="MC Number" value={broker.mcNumber} />
              <Row label="USDOT Number" value={broker.usdotNumber} />
            </div>

            {/* Contact */}
            <Section title="Contact" />
            <div className="grid grid-cols-2 gap-4 pb-3">
              <Row label="Primary Contact" value={broker.primaryContact} />
              <Row label="Phone" value={broker.phone} />
              <Row label="Email" value={broker.email} />
              <Row label="Last Contact" value={formatDate(broker.lastContact)} />
            </div>

            {/* Coverage */}
            {(broker.coverage || (broker.freightTypes && broker.freightTypes.length > 0) || (broker.selectedStates && broker.selectedStates.length > 0)) && (
              <>
                <Section title="Coverage" />
                <div className="pb-3 space-y-2">
                  {broker.coverage && <Row label="Coverage Area" value={broker.coverage} />}
                  {broker.freightTypes && broker.freightTypes.length > 0 && (
                    <div>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">Freight Types</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {broker.freightTypes.map((t) => (
                          <span key={t} className="font-mono text-[10px] border border-border px-2 py-0.5 bg-card">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {broker.selectedStates && broker.selectedStates.length > 0 && (
                    <div>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">Selected States</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {broker.selectedStates.map((s) => (
                          <span key={s} className="font-mono text-[10px] border border-border px-2 py-0.5 bg-card">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Payment Terms */}
            <Section title="Payment Terms" />
            <div className="grid grid-cols-2 gap-4 pb-3">
              <Row label="Terms" value={broker.paymentTerms} />
              <Row label="Payment Days" value={broker.paymentDays?.toString()} />
              <Row label="QuickPay" value={broker.quickPay} />
              {broker.quickPayFee != null && (
                <Row label="QuickPay Fee" value={`${broker.quickPayFee}%`} />
              )}
              <Row label="Factoring Accepted" value={broker.factoringAccepted} />
            </div>

            {/* Tags */}
            {broker.tags && broker.tags.length > 0 && (
              <>
                <Section title="Tags" />
                <div className="pb-3 flex flex-wrap gap-1">
                  {broker.tags.map((tag) => (
                    <span key={tag} className="font-mono text-[10px] border border-border px-2 py-0.5 bg-card">{tag}</span>
                  ))}
                </div>
              </>
            )}

            {/* Notes */}
            {broker.notes && (
              <>
                <Section title="Notes" />
                <p className="text-sm whitespace-pre-wrap pb-3">{broker.notes}</p>
              </>
            )}

          </div>
        </DialogContent>
      </Dialog>

      <BrokerFormModal
        open={editing}
        onClose={() => { setEditing(false); onClose(); }}
        initialData={broker}
      />
    </>
  );
}
