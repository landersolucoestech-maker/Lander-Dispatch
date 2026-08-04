import { useState } from "react";
import type { Carrier } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatDate } from "@/shared/lib/utils";
import { CarrierFormModal } from "./CarrierFormModal";
import { Pencil } from "lucide-react";

interface Props {
  carrier: Carrier | null;
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

export function CarrierViewModal({ carrier, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  if (!carrier) return null;

  const fleetData: any[] = (carrier as any).fleetData ?? [];
  const hasAddress = carrier.companyAddress || carrier.companyCity;
  const hasPayment = carrier.paymentTerms || carrier.factoringCompany || carrier.quickPay;
  const hasBanking = carrier.bankName || carrier.accountHolder || carrier.zelleAccount || carrier.cashAppAccount;

  return (
    <>
      <Dialog open={!!carrier && !editing} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-mono uppercase tracking-widest text-sm">
                {carrier.companyName}
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
                <StatusBadge status={carrier.status} />
              </div>
              <Row label="Type" value={carrier.carrierType} />
              <Row label="Priority" value={carrier.priority} />
              <Row label="Rating" value={carrier.rating != null ? `${carrier.rating.toFixed(1)} / 5.0` : undefined} />
              <Row label="Website" value={carrier.website} />
              <Row label="Last Load" value={formatDate(carrier.lastLoadDate)} />
            </div>

            {/* Identifiers */}
            <Section title="Identifiers & Authority" />
            <div className="grid grid-cols-2 gap-4 pb-3">
              <Row label="MC Number" value={carrier.mcNumber} />
              <Row label="USDOT Number" value={carrier.usdotNumber} />
              <Row label="EIN Number" value={carrier.einNumber} />
              <Row label="Authority Status" value={carrier.authorityStatus} />
              <Row label="Insurance Expiration" value={formatDate(carrier.insuranceExpiration)} />
            </div>

            {/* Contact */}
            <Section title="Contact" />
            <div className="grid grid-cols-2 gap-4 pb-3">
              <Row label="Primary Contact" value={carrier.primaryContact} />
              <Row label="Phone" value={carrier.phone} />
              <Row label="Email" value={carrier.email} />
              <Row label="Last Contact" value={formatDate(carrier.lastContact)} />
            </div>

            {/* Address */}
            {hasAddress && (
              <>
                <Section title="Address" />
                <div className="pb-3">
                  <p className="text-sm">
                    {[carrier.companyAddress, carrier.companyCity, carrier.companyState, carrier.companyZip]
                      .filter(Boolean).join(", ")}
                  </p>
                </div>
              </>
            )}

            {/* Rate */}
            {carrier.ratePerMile != null && (
              <div className="grid grid-cols-2 gap-4 pb-3">
                <Row label="Rate / Mile" value={`$${carrier.ratePerMile.toFixed(2)}/mi`} />
              </div>
            )}

            {/* Fleet */}
            {fleetData.length > 0 && (
              <>
                <Section title={`Fleet (${fleetData.length} ${fleetData.length === 1 ? "entry" : "entries"})`} />
                <div className="space-y-3 pb-3">
                  {fleetData.map((entry: any, i: number) => (
                    <div key={i} className="border border-border rounded p-3 space-y-2">
                      <p className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">Fleet #{i + 1}</p>
                      {(entry.truck?.make || entry.truck?.model) && (
                        <div>
                          <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-1">Truck</p>
                          <p className="text-sm">
                            {[entry.truck.year, entry.truck.make, entry.truck.model].filter(Boolean).join(" ")}
                            {entry.truck.vin && ` • VIN: ${entry.truck.vin}`}
                            {entry.truck.color && ` • ${entry.truck.color}`}
                            {entry.truck.plateNumber && ` • Plate: ${entry.truck.plateNumber}`}
                          </p>
                        </div>
                      )}
                      {(entry.trailer?.make || entry.trailer?.model) && (
                        <div>
                          <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-1">Trailer</p>
                          <p className="text-sm">
                            {[entry.trailer.year, entry.trailer.make, entry.trailer.model].filter(Boolean).join(" ")}
                            {entry.trailer.vin && ` • VIN: ${entry.trailer.vin}`}
                            {entry.trailer.color && ` • ${entry.trailer.color}`}
                            {entry.trailer.plateNumber && ` • Plate: ${entry.trailer.plateNumber}`}
                          </p>
                        </div>
                      )}
                      {entry.driver?.name && (
                        <div>
                          <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-1">Driver</p>
                          <p className="text-sm">
                            {entry.driver.name}
                            {entry.driver.phone && ` • ${entry.driver.phone}`}
                            {entry.driver.email && ` • ${entry.driver.email}`}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Operating States */}
            {carrier.operatingStates && carrier.operatingStates.length > 0 && (
              <>
                <Section title="Operating States" />
                <div className="pb-3 flex flex-wrap gap-1">
                  {carrier.operatingStates.map((st) => (
                    <span key={st} className="font-mono text-[10px] border border-border px-2 py-0.5 bg-card">{st}</span>
                  ))}
                </div>
              </>
            )}

            {/* Service Types */}
            {carrier.serviceTypes && carrier.serviceTypes.length > 0 && (
              <>
                <Section title="Service Types" />
                <div className="pb-3 flex flex-wrap gap-1">
                  {carrier.serviceTypes.map((st) => (
                    <span key={st} className="font-mono text-[10px] border border-border px-2 py-0.5 bg-card">{st}</span>
                  ))}
                </div>
              </>
            )}

            {/* Payment */}
            {hasPayment && (
              <>
                <Section title="Payment" />
                <div className="grid grid-cols-2 gap-4 pb-3">
                  <Row label="Payment Terms" value={carrier.paymentTerms} />
                  <Row label="QuickPay" value={carrier.quickPay} />
                  <Row label="Factoring Company" value={carrier.factoringCompany} />
                  {carrier.factoringFee != null && (
                    <Row label="Factoring Fee" value={`${carrier.factoringFee}%`} />
                  )}
                </div>
              </>
            )}

            {/* Banking */}
            {hasBanking && (
              <>
                <Section title="Banking" />
                <div className="grid grid-cols-2 gap-4 pb-3">
                  <Row label="Bank Name" value={carrier.bankName} />
                  <Row label="Account Holder" value={carrier.accountHolder} />
                  {carrier.accountNumberLast4 && (
                    <Row label="Account (last 4)" value={`••••${carrier.accountNumberLast4}`} />
                  )}
                  {carrier.routingNumberLast4 && (
                    <Row label="Routing (last 4)" value={`••••${carrier.routingNumberLast4}`} />
                  )}
                  <Row label="Bank City / State" value={[carrier.bankCity, carrier.bankState].filter(Boolean).join(", ")} />
                  <Row label="Zelle" value={carrier.zelleAccount} />
                  <Row label="Cash App" value={carrier.cashAppAccount} />
                </div>
              </>
            )}

            {/* Tags */}
            {carrier.tags && carrier.tags.length > 0 && (
              <>
                <Section title="Tags" />
                <div className="pb-3 flex flex-wrap gap-1">
                  {carrier.tags.map((tag) => (
                    <span key={tag} className="font-mono text-[10px] border border-border px-2 py-0.5 bg-card">{tag}</span>
                  ))}
                </div>
              </>
            )}

            {/* Notes */}
            {carrier.notes && (
              <>
                <Section title="Notes" />
                <p className="text-sm whitespace-pre-wrap pb-3">{carrier.notes}</p>
              </>
            )}

          </div>
        </DialogContent>
      </Dialog>

      <CarrierFormModal
        open={editing}
        onClose={() => { setEditing(false); onClose(); }}
        initialData={carrier}
      />
    </>
  );
}
