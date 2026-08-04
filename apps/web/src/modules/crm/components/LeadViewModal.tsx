import { useState } from "react";
import type { CrmLead } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { LeadFormModal } from "./LeadFormModal";
import { Pencil } from "lucide-react";

interface Props {
  lead: CrmLead | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
  if (display == null || display === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{display}</span>
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

export function LeadViewModal({ lead, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  if (!lead) return null;
  const d = lead as any;
  const isBroker = d.leadType === "Broker";

  return (
    <>
      <Dialog open={!!lead && !editing} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-mono uppercase tracking-widest text-sm">
                {lead.companyName}
              </DialogTitle>
              <Button variant="outline" size="sm" className="gap-1 font-mono text-xs" onClick={() => setEditing(true)}>
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-2 space-y-0">

            {/* Pipeline */}
            <div className="grid grid-cols-2 gap-4 pb-3">
              <Row label="Lead Type" value={d.leadType} />
              <Row label="Lead Source" value={d.leadSource} />
            </div>
            <div className="grid grid-cols-3 gap-4 pb-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Pipeline Stage</span>
                <StatusBadge status={lead.pipelineStage ?? "New Lead"} />
              </div>
              <Row label="Priority" value={lead.priority} />
              <Row label="Rating" value={lead.rating != null ? `${Number(lead.rating).toFixed(1)} / 5.0` : undefined} />
              <Row label="Next Follow-Up" value={formatDate(d.nextFollowUpDate)} />
              <Row label="Follow-Up Time" value={d.nextFollowUpTime} />
              <Row label="Last Contact" value={formatDate(lead.lastContact)} />
            </div>
            {d.followUpNotes && (
              <div className="pb-3">
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Follow-Up Notes</span>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">{d.followUpNotes}</p>
              </div>
            )}

            {/* Contact */}
            <Section title="Contact" />
            <div className="grid grid-cols-2 gap-4 pb-3">
              <Row label="Primary Contact" value={lead.primaryContact} />
              <Row label="Phone" value={lead.phone} />
              <Row label="Email" value={lead.email} />
              <Row label="Website" value={d.website} />
            </div>

            {/* Location */}
            {(d.streetAddress || d.city || d.state || d.zipCode) && (
              <>
                <Section title="Location" />
                <div className="pb-3 space-y-1">
                  {d.streetAddress && <p className="text-sm">{d.streetAddress}</p>}
                  <p className="text-sm">
                    {[d.city, d.state, d.zipCode].filter(Boolean).join(", ")}
                  </p>
                </div>
              </>
            )}

            {/* Broker fields */}
            {isBroker && (
              <>
                <Section title="Broker — Identifiers" />
                <div className="grid grid-cols-2 gap-4 pb-3">
                  <Row label="Broker Type" value={d.brokerType} />
                  <Row label="MC Number" value={d.mcNumber} />
                  <Row label="USDOT Number" value={d.usdotNumber} />
                </div>
                <Section title="Broker — Coverage" />
                <div className="grid grid-cols-2 gap-4 pb-3">
                  <Row label="Coverage" value={d.coverage} />
                  <Row label="Freight Types" value={d.freightTypes} />
                  <Row label="Selected States" value={d.selectedStates} />
                </div>
              </>
            )}

            {/* Revenue Estimates */}
            <Section title="Revenue Estimates" />
            <div className="grid grid-cols-2 gap-4 pb-3">
              <Row label="Est. Weekly Loads" value={lead.estimatedWeeklyLoads?.toString()} />
              <Row
                label="Est. Weekly Revenue"
                value={lead.estimatedWeeklyRevenue != null ? formatCurrency(lead.estimatedWeeklyRevenue) : undefined}
              />
            </div>

            {/* Tags */}
            {lead.tags && lead.tags.length > 0 && (
              <>
                <Section title="Tags" />
                <div className="pb-3 flex flex-wrap gap-1">
                  {lead.tags.map((tag) => (
                    <span key={tag} className="font-mono text-[10px] border border-border px-2 py-0.5 bg-card">{tag}</span>
                  ))}
                </div>
              </>
            )}

            {/* Notes */}
            {lead.notes && (
              <>
                <Section title="Notes" />
                <p className="text-sm whitespace-pre-wrap pb-3">{lead.notes}</p>
              </>
            )}

          </div>
        </DialogContent>
      </Dialog>

      <LeadFormModal
        open={editing}
        onClose={() => { setEditing(false); onClose(); }}
        initialData={lead}
      />
    </>
  );
}
