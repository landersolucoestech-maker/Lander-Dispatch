import { useState } from "react";
import type { Load } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { LoadFormModal } from "./LoadFormModal";
import { ArrowRight, Pencil } from "lucide-react";

interface Props {
  load: Load | null;
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

export function LoadViewModal({ load, onClose }: Props) {
  const [editing, setEditing] = useState(false);

  if (!load) return null;

  return (
    <>
      <Dialog open={!!load && !editing} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-mono uppercase tracking-widest text-sm">
                Load — {load.loadId}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 font-mono text-xs"
                onClick={() => setEditing(true)}
              >
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-2 space-y-4">

            {/* Status + básicos */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Status</span>
                <StatusBadge status={load.status} />
              </div>
              <Row label="Dispatch Date" value={formatDate(load.dispatchDate)} />
              <Row label="Rate" value={formatCurrency(load.rate)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Row label="Rate / Mile" value={load.ratePerMile != null ? `$${load.ratePerMile.toFixed(2)}/mi` : undefined} />
              <Row label="Miles" value={load.miles?.toString()} />
              <Row label="Equipment Type" value={load.equipmentType} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Row label="Payment Status" value={load.paymentStatus} />
              <Row label="Payment Method" value={load.paymentMethod} />
            </div>

            {/* Carrier / Broker */}
            <div className="border-t border-border pt-3">
              <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2">Carrier / Broker</p>
              <div className="grid grid-cols-2 gap-4">
                <Row label="Carrier" value={load.carrierName ?? "Unassigned"} />
                <Row label="Broker" value={load.brokerName ?? "Unknown"} />
              </div>
            </div>

            {/* Pickup */}
            <div className="border-t border-border pt-3">
              <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2">Pickup (Origin)</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <Row label="Name / Company" value={load.pickupName} />
                <Row label="Phone" value={load.pickupPhone} />
                <Row label="Contact" value={load.pickupContactName} />
                <Row label="Email" value={load.pickupEmail} />
                {load.pickupAddress && <div className="col-span-2"><Row label="Address" value={[load.pickupAddress, load.pickupCity, load.pickupState, load.pickupZip].filter(Boolean).join(", ")} /></div>}
                {!load.pickupAddress && <div className="col-span-2"><Row label="Location" value={[load.pickupCity, load.pickupState, load.pickupZip].filter(Boolean).join(", ")} /></div>}
                <Row label="Est. Pickup" value={formatDate(load.pickupEstimated)} />
                <Row label="Deadline" value={formatDate(load.pickupDeadline)} />
              </div>
            </div>

            {/* Delivery */}
            <div className="border-t border-border pt-3">
              <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2">Delivery (Destination)</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <Row label="Name / Company" value={load.deliveryName} />
                <Row label="Phone" value={load.deliveryPhone} />
                <Row label="Contact" value={load.deliveryContactName} />
                <Row label="Email" value={load.deliveryEmail} />
                {load.deliveryAddress && <div className="col-span-2"><Row label="Address" value={[load.deliveryAddress, load.deliveryCity, load.deliveryState, load.deliveryZip].filter(Boolean).join(", ")} /></div>}
                {!load.deliveryAddress && <div className="col-span-2"><Row label="Location" value={[load.deliveryCity, load.deliveryState, load.deliveryZip].filter(Boolean).join(", ")} /></div>}
                <Row label="Est. Delivery" value={formatDate(load.deliveryEstimated)} />
                <Row label="Deadline" value={formatDate(load.deliveryDeadline)} />
              </div>
            </div>

            {/* Vehicles */}
            {load.vehicles && load.vehicles.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2">
                  Vehicles ({load.vehicles.length})
                </p>
                <div className="space-y-2">
                  {load.vehicles.map((v, i) => (
                    <div key={i} className="border border-border p-2 grid grid-cols-4 gap-2 text-xs font-mono">
                      <div className="col-span-4 font-bold text-[10px] text-muted-foreground uppercase">
                        Vehicle #{v.vehicleNumber}
                      </div>
                      {v.year && <Row label="Year" value={v.year} />}
                      {v.make && <Row label="Make" value={v.make} />}
                      {v.model && <Row label="Model" value={v.model} />}
                      {v.type && <Row label="Type" value={v.type} />}
                      {v.color && <Row label="Color" value={v.color} />}
                      {v.plate && <Row label="Plate" value={v.plate} />}
                      {v.vin && <div className="col-span-2"><Row label="VIN" value={v.vin} /></div>}
                      {v.buyerNumber && <Row label="Buyer Number" value={v.buyerNumber} />}
                      {v.lotNumber && <Row label="Lot Number" value={v.lotNumber} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instruções */}
            {(load.dispatchInstructions || load.pickupInstructions || load.deliveryInstructions) && (
              <div className="border-t border-border pt-3 space-y-3">
                {load.dispatchInstructions && (
                  <div>
                    <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1">Dispatch Instructions</p>
                    <p className="text-sm whitespace-pre-wrap">{load.dispatchInstructions}</p>
                  </div>
                )}
                {load.pickupInstructions && (
                  <div>
                    <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1">Pickup Instructions</p>
                    <p className="text-sm whitespace-pre-wrap">{load.pickupInstructions}</p>
                  </div>
                )}
                {load.deliveryInstructions && (
                  <div>
                    <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1">Delivery Instructions</p>
                    <p className="text-sm whitespace-pre-wrap">{load.deliveryInstructions}</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>

      <LoadFormModal
        open={editing}
        onClose={() => { setEditing(false); onClose(); }}
        initialData={load}
      />
    </>
  );
}
