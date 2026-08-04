import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateLoad,
  useUpdateLoad,
  useListCarriers,
  useListBrokers,
} from "@workspace/api-client-react";
import type { Load, LoadVehicle } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Load;
}

const STATUS_OPTIONS = ["New", "Dispatched", "Picked Up", "In Route", "Delivered", "Canceled"];
const PAYMENT_METHODS = ["Check", "ACH", "Wire", "QuickPay", "Factoring"];
const FREIGHT_TYPES = ["SUV", "Sedan", "Coupe", "Pickup Truck", "Minivan", "Van", "Sports Car", "Muscle Car", "Classic Car", "Luxury Car", "Electric Vehicle", "Motorcycle", "ATV/UTV", "Boat", "RV/Motorhome", "Heavy Equipment", "Other"];
const EQUIPMENT_TYPES = ["Open Carrier", "Enclosed Carrier", "Flatbed", "Hotshot", "Single Car Hauler", "Multi-Car Hauler", "Drive Away", "Container", "Other"];
const PAYMENT_STATUSES = ["Unpaid", "Invoiced", "Pending", "Factored", "Paid", "Partial", "Disputed", "Void"];

const emptyVehicle = (): LoadVehicle => ({
  vehicleNumber: 1,
  year: "",
  make: "",
  model: "",
  type: "",
  color: "",
  plate: "",
  vin: "",
  lotNumber: "",
  buyerNumber: "",
});

export function LoadFormModal({ open, onClose, initialData }: Props) {
  const qc = useQueryClient();
  const isEdit = !!initialData;

  const { data: carriersData } = useListCarriers({ pageSize: 200 } as any);
  const { data: brokersData } = useListBrokers({ pageSize: 200 } as any);

  const createMutation = useCreateLoad();
  const updateMutation = useUpdateLoad();

  const [form, setForm] = useState({
    loadId: "",
    carrierId: "",
    brokerId: "",
    status: "New",
    dispatchDate: "",
    pickupName: "",
    pickupAddress: "",
    pickupCity: "",
    pickupState: "",
    pickupZip: "",
    pickupPhone: "",
    pickupContactName: "",
    pickupEmail: "",
    pickupEstimated: "",
    pickupDeadline: "",
    deliveryName: "",
    deliveryAddress: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryZip: "",
    deliveryPhone: "",
    deliveryContactName: "",
    deliveryEmail: "",
    deliveryEstimated: "",
    deliveryDeadline: "",
    miles: "",
    rate: "",
    ratePerMile: "",
    freightType: "",
    equipmentType: "",
    paymentMethod: "",
    paymentStatus: "",
    dispatchInstructions: "",
    pickupInstructions: "",
    deliveryInstructions: "",
  });

  const [vehicles, setVehicles] = useState<LoadVehicle[]>([]);

  useEffect(() => {
    if (initialData) {
      setForm({
        loadId: initialData.loadId ?? "",
        carrierId: initialData.carrierId ?? "",
        brokerId: initialData.brokerId ?? "",
        status: initialData.status ?? "New",
        dispatchDate: initialData.dispatchDate?.slice(0, 10) ?? "",
        pickupName: initialData.pickupName ?? "",
        pickupAddress: initialData.pickupAddress ?? "",
        pickupCity: initialData.pickupCity ?? "",
        pickupState: initialData.pickupState ?? "",
        pickupZip: initialData.pickupZip ?? "",
        pickupPhone: initialData.pickupPhone ?? "",
        pickupContactName: initialData.pickupContactName ?? "",
        pickupEmail: initialData.pickupEmail ?? "",
        pickupEstimated: initialData.pickupEstimated?.slice(0, 16) ?? "",
        pickupDeadline: initialData.pickupDeadline?.slice(0, 16) ?? "",
        deliveryName: initialData.deliveryName ?? "",
        deliveryAddress: initialData.deliveryAddress ?? "",
        deliveryCity: initialData.deliveryCity ?? "",
        deliveryState: initialData.deliveryState ?? "",
        deliveryZip: initialData.deliveryZip ?? "",
        deliveryPhone: initialData.deliveryPhone ?? "",
        deliveryContactName: initialData.deliveryContactName ?? "",
        deliveryEmail: initialData.deliveryEmail ?? "",
        deliveryEstimated: initialData.deliveryEstimated?.slice(0, 16) ?? "",
        deliveryDeadline: initialData.deliveryDeadline?.slice(0, 16) ?? "",
        miles: initialData.miles?.toString() ?? "",
        rate: initialData.rate?.toString() ?? "",
        ratePerMile: initialData.ratePerMile?.toString() ?? "",
        freightType: initialData.freightType ?? "",
        equipmentType: initialData.equipmentType ?? "",
        paymentMethod: initialData.paymentMethod ?? "",
        paymentStatus: initialData.paymentStatus ?? "",
        dispatchInstructions: initialData.dispatchInstructions ?? "",
        pickupInstructions: initialData.pickupInstructions ?? "",
        deliveryInstructions: initialData.deliveryInstructions ?? "",
      });
      setVehicles(initialData.vehicles ?? []);
    } else {
      setForm({
        loadId: "", carrierId: "", brokerId: "", status: "New", dispatchDate: "",
        pickupName: "", pickupAddress: "", pickupCity: "", pickupState: "", pickupZip: "", pickupPhone: "", pickupContactName: "", pickupEmail: "", pickupEstimated: "", pickupDeadline: "",
        deliveryName: "", deliveryAddress: "", deliveryCity: "", deliveryState: "", deliveryZip: "", deliveryPhone: "", deliveryContactName: "", deliveryEmail: "", deliveryEstimated: "", deliveryDeadline: "",
        miles: "", rate: "", ratePerMile: "", freightType: "", equipmentType: "", paymentMethod: "", paymentStatus: "",
        dispatchInstructions: "", pickupInstructions: "", deliveryInstructions: "",
      });
      setVehicles([]);
    }
  }, [initialData, open]);

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  /* Vehicles helpers */
  const addVehicle = () =>
    setVehicles((v) => [...v, { ...emptyVehicle(), vehicleNumber: v.length + 1 }]);

  const removeVehicle = (idx: number) =>
    setVehicles((v) => v.filter((_, i) => i !== idx).map((veh, i) => ({ ...veh, vehicleNumber: i + 1 })));

  const updateVehicle = (idx: number, field: keyof LoadVehicle, value: string) =>
    setVehicles((v) => v.map((veh, i) => (i === idx ? { ...veh, [field]: value } : veh)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...(form.loadId.trim() && !isEdit ? { loadId: form.loadId.trim() } : {}),
      carrierId: form.carrierId || undefined,
      brokerId: form.brokerId || undefined,
      status: form.status || undefined,
      dispatchDate: form.dispatchDate || undefined,
      pickupName: form.pickupName || undefined,
      pickupAddress: form.pickupAddress || undefined,
      pickupCity: form.pickupCity || undefined,
      pickupState: form.pickupState || undefined,
      pickupZip: form.pickupZip || undefined,
      pickupPhone: form.pickupPhone || undefined,
      pickupContactName: form.pickupContactName || undefined,
      pickupEmail: form.pickupEmail || undefined,
      pickupEstimated: form.pickupEstimated || undefined,
      pickupDeadline: form.pickupDeadline || undefined,
      deliveryName: form.deliveryName || undefined,
      deliveryAddress: form.deliveryAddress || undefined,
      deliveryCity: form.deliveryCity || undefined,
      deliveryState: form.deliveryState || undefined,
      deliveryZip: form.deliveryZip || undefined,
      deliveryPhone: form.deliveryPhone || undefined,
      deliveryContactName: form.deliveryContactName || undefined,
      deliveryEmail: form.deliveryEmail || undefined,
      deliveryEstimated: form.deliveryEstimated || undefined,
      deliveryDeadline: form.deliveryDeadline || undefined,
      miles: form.miles ? parseFloat(form.miles) : undefined,
      rate: form.rate ? parseFloat(form.rate) : undefined,
      freightType: form.freightType || undefined,
      equipmentType: form.equipmentType || undefined,
      paymentMethod: form.paymentMethod || undefined,
      paymentStatus: form.paymentStatus || undefined,
      vehicles: vehicles.length > 0 ? vehicles : undefined,
      dispatchInstructions: form.dispatchInstructions || undefined,
      pickupInstructions: form.pickupInstructions || undefined,
      deliveryInstructions: form.deliveryInstructions || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(
        { loadId: initialData!.id, data: payload },
        {
          onSuccess: () => { qc.invalidateQueries({ queryKey: ["loads"] }); onClose(); },
        }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: () => { qc.invalidateQueries({ queryKey: ["loads"] }); onClose(); },
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-widest text-sm">
            {isEdit ? `Edit Load — ${initialData?.loadId}` : "Create New Load"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mt-2">

          {/* ── Load ID ── */}
          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Load ID</Label>
            <Input
              value={isEdit ? (initialData?.loadId ?? "") : form.loadId}
              onChange={isEdit ? undefined : f("loadId")}
              readOnly={isEdit}
              placeholder="e.g. LD-00001"
              className={isEdit ? "font-mono text-xs text-muted-foreground bg-muted/40 cursor-default" : "font-mono text-xs"}
            />
          </div>

          {/* ── Carrier / Broker ── */}
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Carrier</Label>
            <Select
              value={form.carrierId || "__none__"}
              onValueChange={(v) => setForm((p) => ({ ...p, carrierId: v === "__none__" ? "" : v }))}
            >
              <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {carriersData?.data.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Broker</Label>
            <Select
              value={form.brokerId || "__none__"}
              onValueChange={(v) => setForm((p) => ({ ...p, brokerId: v === "__none__" ? "" : v }))}
            >
              <SelectTrigger><SelectValue placeholder="Select broker" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {brokersData?.data.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Status / Dispatch Date ── */}
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Dispatch Date</Label>
            <Input type="date" value={form.dispatchDate} onChange={f("dispatchDate")} />
          </div>

          {/* ── Pickup ── */}
          <div className="col-span-2 border-t border-border pt-3">
            <p className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-widest">Pickup (Origin)</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="font-mono text-xs">Name / Company</Label>
                  <Input value={form.pickupName} onChange={f("pickupName")} placeholder="ABC Auto Auction" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="font-mono text-xs">Phone</Label>
                  <Input value={form.pickupPhone} onChange={f("pickupPhone")} placeholder="(555) 000-0000" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="font-mono text-xs">Contact Name</Label>
                  <Input value={form.pickupContactName} onChange={f("pickupContactName")} placeholder="John Smith" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="font-mono text-xs">Email</Label>
                  <Input type="email" value={form.pickupEmail} onChange={f("pickupEmail")} placeholder="contact@abc.com" />
                </div>
              </div>
              <div className="col-span-3 flex flex-col gap-1">
                <Label className="font-mono text-xs">Address</Label>
                <Input value={form.pickupAddress} onChange={f("pickupAddress")} placeholder="123 Main St" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">City</Label>
                <Input value={form.pickupCity} onChange={f("pickupCity")} placeholder="Chicago" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">State</Label>
                <Input value={form.pickupState} onChange={f("pickupState")} placeholder="IL" maxLength={2} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">ZIP</Label>
                <Input value={form.pickupZip} onChange={f("pickupZip")} placeholder="60601" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Est. Pickup</Label>
                <Input type="datetime-local" value={form.pickupEstimated} onChange={f("pickupEstimated")} />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label className="font-mono text-xs">Deadline</Label>
                <Input type="datetime-local" value={form.pickupDeadline} onChange={f("pickupDeadline")} />
              </div>
              <div className="col-span-3 flex flex-col gap-1">
                <Label className="font-mono text-xs">Pickup Instructions</Label>
                <Textarea value={form.pickupInstructions} onChange={f("pickupInstructions")} rows={2} />
              </div>
            </div>
          </div>

          {/* ── Delivery ── */}
          <div className="col-span-2 border-t border-border pt-3">
            <p className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-widest">Delivery (Destination)</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="font-mono text-xs">Name / Company</Label>
                  <Input value={form.deliveryName} onChange={f("deliveryName")} placeholder="XYZ Dealership" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="font-mono text-xs">Phone</Label>
                  <Input value={form.deliveryPhone} onChange={f("deliveryPhone")} placeholder="(555) 000-0000" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="font-mono text-xs">Contact Name</Label>
                  <Input value={form.deliveryContactName} onChange={f("deliveryContactName")} placeholder="Jane Doe" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="font-mono text-xs">Email</Label>
                  <Input type="email" value={form.deliveryEmail} onChange={f("deliveryEmail")} placeholder="contact@xyz.com" />
                </div>
              </div>
              <div className="col-span-3 flex flex-col gap-1">
                <Label className="font-mono text-xs">Address</Label>
                <Input value={form.deliveryAddress} onChange={f("deliveryAddress")} placeholder="456 Oak Ave" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">City</Label>
                <Input value={form.deliveryCity} onChange={f("deliveryCity")} placeholder="Dallas" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">State</Label>
                <Input value={form.deliveryState} onChange={f("deliveryState")} placeholder="TX" maxLength={2} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">ZIP</Label>
                <Input value={form.deliveryZip} onChange={f("deliveryZip")} placeholder="75201" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Est. Delivery</Label>
                <Input type="datetime-local" value={form.deliveryEstimated} onChange={f("deliveryEstimated")} />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label className="font-mono text-xs">Deadline</Label>
                <Input type="datetime-local" value={form.deliveryDeadline} onChange={f("deliveryDeadline")} />
              </div>
              <div className="col-span-3 flex flex-col gap-1">
                <Label className="font-mono text-xs">Delivery Instructions</Label>
                <Textarea value={form.deliveryInstructions} onChange={f("deliveryInstructions")} rows={2} />
              </div>
            </div>
          </div>

          {/* ── Financials ── */}
          <div className="col-span-2 border-t border-border pt-3">
            <p className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-widest">Financials</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Rate ($)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={form.rate}
                  onChange={(e) => {
                    const rate = e.target.value;
                    const ratePerMile =
                      rate && form.miles && parseFloat(form.miles) > 0
                        ? (parseFloat(rate) / parseFloat(form.miles)).toFixed(2)
                        : form.ratePerMile;
                    setForm((p) => ({ ...p, rate, ratePerMile }));
                  }}
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Miles</Label>
                <Input
                  type="number" step="0.1" min="0"
                  value={form.miles}
                  onChange={(e) => {
                    const miles = e.target.value;
                    const ratePerMile =
                      miles && form.rate && parseFloat(miles) > 0
                        ? (parseFloat(form.rate) / parseFloat(miles)).toFixed(2)
                        : form.ratePerMile;
                    setForm((p) => ({ ...p, miles, ratePerMile }));
                  }}
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Rate / Mile ($) <span className="text-muted-foreground">auto</span></Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={form.ratePerMile}
                  onChange={f("ratePerMile")}
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Equipment Type</Label>
                <Select
                  value={form.equipmentType || ""}
                  onValueChange={(v) => setForm((p) => ({ ...p, equipmentType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Payment Status</Label>
                <Select
                  value={form.paymentStatus || ""}
                  onValueChange={(v) => setForm((p) => ({ ...p, paymentStatus: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Payment Method</Label>
                <Input
                  value={form.paymentMethod}
                  onChange={f("paymentMethod")}
                  placeholder="Check, ACH, Wire, QuickPay, Factoring..."
                />
              </div>
            </div>
          </div>

          {/* ── Dispatch Instructions ── */}
          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Dispatch Instructions</Label>
            <Textarea value={form.dispatchInstructions} onChange={f("dispatchInstructions")} rows={2} />
          </div>

          {/* ── Vehicles ── */}
          <div className="col-span-2 border-t border-border pt-3">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Vehicles</p>
              <Button type="button" variant="outline" size="sm" className="gap-1 font-mono text-xs" onClick={addVehicle}>
                <Plus className="w-3 h-3" /> Add Vehicle
              </Button>
            </div>
            {vehicles.length === 0 && (
              <p className="text-xs font-mono text-muted-foreground">No vehicles added.</p>
            )}
            {vehicles.map((veh, idx) => (
              <div key={idx} className="border border-border p-3 mb-2 grid grid-cols-3 gap-2">
                <div className="col-span-3 flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold">VEHICLE #{veh.vehicleNumber}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeVehicle(idx)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
                {(["year", "make", "model", "type", "color", "plate", "vin", "buyerNumber", "lotNumber"] as (keyof LoadVehicle)[]).map((field) => (
                  <div key={field} className="flex flex-col gap-1">
                    <Label className="font-mono text-[10px] uppercase">{field === "buyerNumber" ? "Buyer Number" : field === "lotNumber" ? "Lot Number" : field}</Label>
                    <Input
                      value={(veh[field] as string) ?? ""}
                      onChange={(e) => updateVehicle(idx, field, e.target.value)}
                      placeholder={field === "buyerNumber" ? "BUYER #" : field === "lotNumber" ? "LOT #" : field.toUpperCase()}
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="col-span-2 flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Load"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
