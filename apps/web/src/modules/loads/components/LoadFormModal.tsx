import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateLoad,
  useListBrokers,
  useListCarriers,
  useUpdateLoad,
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

type LoadFormState = {
  loadId: string;
  carrierId: string;
  brokerId: string;
  status: string;
  dispatchDate: string;
  pickupName: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string;
  pickupZip: string;
  pickupPhone: string;
  pickupContactName: string;
  pickupEmail: string;
  pickupEstimated: string;
  pickupDeadline: string;
  deliveryName: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip: string;
  deliveryPhone: string;
  deliveryContactName: string;
  deliveryEmail: string;
  deliveryEstimated: string;
  deliveryDeadline: string;
  miles: string;
  rate: string;
  carrierPay: string;
  fuelSurcharge: string;
  freightType: string;
  equipmentType: string;
  weight: string;
  paymentMethod: string;
  paymentStatus: string;
  dispatchInstructions: string;
  pickupInstructions: string;
  deliveryInstructions: string;
};

const STATUS_OPTIONS = [
  "New",
  "Dispatched",
  "Picked Up",
  "In Route",
  "Delivered",
  "Canceled",
] as const;

const PAYMENT_METHODS = ["Check", "ACH", "Wire", "QuickPay", "Factoring"] as const;
const PAYMENT_STATUSES = [
  "Unpaid",
  "Invoiced",
  "Pending",
  "Factored",
  "Paid",
  "Partial",
  "Disputed",
  "Void",
] as const;

const FREIGHT_TYPES = [
  "Auto Transport",
  "Dealer Transfer",
  "Fleet Repositioning",
  "Auction",
  "SUV",
  "Sedan",
  "Coupe",
  "Pickup Truck",
  "Minivan",
  "Van",
  "Sports Car",
  "Classic Car",
  "Luxury Car",
  "Electric Vehicle",
  "Motorcycle",
  "ATV/UTV",
  "Boat",
  "RV/Motorhome",
  "Heavy Equipment",
  "Other",
] as const;

const EQUIPMENT_TYPES = [
  "Open Carrier",
  "Open 3-Car",
  "Open 4-Car",
  "Open 9-Car",
  "Enclosed",
  "Enclosed Carrier",
  "Flatbed",
  "Hotshot",
  "Single Car Hauler",
  "Multi-Car Hauler",
  "Drive Away",
  "Container",
  "Other",
] as const;

const EMPTY_FORM: LoadFormState = {
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
  carrierPay: "",
  fuelSurcharge: "",
  freightType: "",
  equipmentType: "",
  weight: "",
  paymentMethod: "",
  paymentStatus: "Unpaid",
  dispatchInstructions: "",
  pickupInstructions: "",
  deliveryInstructions: "",
};

function emptyVehicle(vehicleNumber: number): LoadVehicle {
  return {
    vehicleNumber,
    year: "",
    make: "",
    model: "",
    type: "",
    color: "",
    plate: "",
    vin: "",
    lotNumber: "",
    buyerNumber: "",
    additionalInfo: "",
  };
}

function loadToForm(load?: Load): LoadFormState {
  if (!load) return EMPTY_FORM;

  return {
    loadId: load.loadId ?? "",
    carrierId: load.carrierId ?? "",
    brokerId: load.brokerId ?? "",
    status: load.status ?? "New",
    dispatchDate: load.dispatchDate?.slice(0, 10) ?? "",
    pickupName: load.pickupName ?? "",
    pickupAddress: load.pickupAddress ?? "",
    pickupCity: load.pickupCity ?? "",
    pickupState: load.pickupState ?? "",
    pickupZip: load.pickupZip ?? "",
    pickupPhone: load.pickupPhone ?? "",
    pickupContactName: load.pickupContactName ?? "",
    pickupEmail: load.pickupEmail ?? "",
    pickupEstimated: load.pickupEstimated?.slice(0, 16) ?? "",
    pickupDeadline: load.pickupDeadline?.slice(0, 16) ?? "",
    deliveryName: load.deliveryName ?? "",
    deliveryAddress: load.deliveryAddress ?? "",
    deliveryCity: load.deliveryCity ?? "",
    deliveryState: load.deliveryState ?? "",
    deliveryZip: load.deliveryZip ?? "",
    deliveryPhone: load.deliveryPhone ?? "",
    deliveryContactName: load.deliveryContactName ?? "",
    deliveryEmail: load.deliveryEmail ?? "",
    deliveryEstimated: load.deliveryEstimated?.slice(0, 16) ?? "",
    deliveryDeadline: load.deliveryDeadline?.slice(0, 16) ?? "",
    miles: load.miles == null ? "" : String(load.miles),
    rate: load.rate == null ? "" : String(load.rate),
    carrierPay: load.carrierPay == null ? "" : String(load.carrierPay),
    fuelSurcharge: load.fuelSurcharge == null ? "" : String(load.fuelSurcharge),
    freightType: load.freightType ?? "",
    equipmentType: load.equipmentType ?? "",
    weight: load.weight == null ? "" : String(load.weight),
    paymentMethod: load.paymentMethod ?? "",
    paymentStatus: load.paymentStatus ?? "Unpaid",
    dispatchInstructions: load.dispatchInstructions ?? "",
    pickupInstructions: load.pickupInstructions ?? "",
    deliveryInstructions: load.deliveryInstructions ?? "",
  };
}

function optionalText(value: string): string | undefined {
  return value.trim() || undefined;
}

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border border-border bg-card p-4 sm:p-5">
      <div className="border-b border-border pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

export function LoadFormModal({ open, onClose, initialData }: Props) {
  const queryClient = useQueryClient();
  const createMutation = useCreateLoad();
  const updateMutation = useUpdateLoad();
  const carriersQuery = useListCarriers({ page: 1, pageSize: 200 });
  const brokersQuery = useListBrokers({ page: 1, pageSize: 200 });
  const [form, setForm] = useState<LoadFormState>(EMPTY_FORM);
  const [vehicles, setVehicles] = useState<LoadVehicle[]>([]);

  useEffect(() => {
    setForm(loadToForm(initialData));
    setVehicles(initialData?.vehicles?.map((vehicle) => ({ ...vehicle })) ?? []);
  }, [initialData, open]);

  const updateForm = <K extends keyof LoadFormState>(
    field: K,
    value: LoadFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateVehicle = (
    index: number,
    field: keyof LoadVehicle,
    value: string,
  ) => {
    setVehicles((current) =>
      current.map((vehicle, vehicleIndex) =>
        vehicleIndex === index ? { ...vehicle, [field]: value } : vehicle,
      ),
    );
  };

  const removeVehicle = (index: number) => {
    setVehicles((current) =>
      current
        .filter((_, vehicleIndex) => vehicleIndex !== index)
        .map((vehicle, vehicleIndex) => ({
          ...vehicle,
          vehicleNumber: vehicleIndex + 1,
        })),
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      ...(!initialData && form.loadId.trim()
        ? { loadId: form.loadId.trim() }
        : {}),
      carrierId: optionalText(form.carrierId),
      brokerId: optionalText(form.brokerId),
      status: form.status,
      dispatchDate: optionalText(form.dispatchDate),
      pickupName: optionalText(form.pickupName),
      pickupAddress: optionalText(form.pickupAddress),
      pickupCity: optionalText(form.pickupCity),
      pickupState: optionalText(form.pickupState)?.toUpperCase(),
      pickupZip: optionalText(form.pickupZip),
      pickupPhone: optionalText(form.pickupPhone),
      pickupContactName: optionalText(form.pickupContactName),
      pickupEmail: optionalText(form.pickupEmail),
      pickupEstimated: optionalText(form.pickupEstimated),
      pickupDeadline: optionalText(form.pickupDeadline),
      deliveryName: optionalText(form.deliveryName),
      deliveryAddress: optionalText(form.deliveryAddress),
      deliveryCity: optionalText(form.deliveryCity),
      deliveryState: optionalText(form.deliveryState)?.toUpperCase(),
      deliveryZip: optionalText(form.deliveryZip),
      deliveryPhone: optionalText(form.deliveryPhone),
      deliveryContactName: optionalText(form.deliveryContactName),
      deliveryEmail: optionalText(form.deliveryEmail),
      deliveryEstimated: optionalText(form.deliveryEstimated),
      deliveryDeadline: optionalText(form.deliveryDeadline),
      miles: optionalNumber(form.miles),
      rate: optionalNumber(form.rate),
      carrierPay: optionalNumber(form.carrierPay),
      fuelSurcharge: optionalNumber(form.fuelSurcharge),
      freightType: optionalText(form.freightType),
      equipmentType: optionalText(form.equipmentType),
      weight: optionalNumber(form.weight),
      paymentMethod: optionalText(form.paymentMethod),
      paymentStatus: optionalText(form.paymentStatus),
      vehicles: vehicles.length ? vehicles : undefined,
      dispatchInstructions: optionalText(form.dispatchInstructions),
      pickupInstructions: optionalText(form.pickupInstructions),
      deliveryInstructions: optionalText(form.deliveryInstructions),
    };

    const onSuccess = async () => {
      await queryClient.invalidateQueries({ queryKey: ["loads"] });
      onClose();
    };

    if (initialData) {
      updateMutation.mutate(
        { loadId: initialData.id, data: payload },
        { onSuccess },
      );
      return;
    }

    createMutation.mutate({ data: payload }, { onSuccess });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {initialData ? `Edit Load — ${initialData.loadId}` : "Create Load"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Section
            title="Assignment"
            description="Load identity, status and operational ownership."
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Load ID *">
                <Input
                  required={!initialData}
                  readOnly={Boolean(initialData)}
                  value={initialData?.loadId ?? form.loadId}
                  onChange={(event) => updateForm("loadId", event.target.value)}
                />
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(value) => updateForm("status", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Dispatch Date">
                <Input type="date" value={form.dispatchDate} onChange={(event) => updateForm("dispatchDate", event.target.value)} />
              </Field>
              <Field label="Carrier">
                <Select value={form.carrierId || "__none__"} onValueChange={(value) => updateForm("carrierId", value === "__none__" ? "" : value)}>
                  <SelectTrigger><SelectValue placeholder="Select Carrier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {carriersQuery.data?.data.map((carrier) => (
                      <SelectItem key={carrier.id} value={carrier.id}>{carrier.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Broker">
                <Select value={form.brokerId || "__none__"} onValueChange={(value) => updateForm("brokerId", value === "__none__" ? "" : value)}>
                  <SelectTrigger><SelectValue placeholder="Select Broker" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {brokersQuery.data?.data.map((broker) => (
                      <SelectItem key={broker.id} value={broker.id}>{broker.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Section title="Pickup" description="Origin facility, contact and schedule.">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Facility Name"><Input value={form.pickupName} onChange={(event) => updateForm("pickupName", event.target.value)} /></Field>
                <Field label="Contact Name"><Input value={form.pickupContactName} onChange={(event) => updateForm("pickupContactName", event.target.value)} /></Field>
                <Field label="Phone"><Input value={form.pickupPhone} onChange={(event) => updateForm("pickupPhone", event.target.value)} /></Field>
                <Field label="Email"><Input type="email" value={form.pickupEmail} onChange={(event) => updateForm("pickupEmail", event.target.value)} /></Field>
                <Field label="Street Address" className="sm:col-span-2"><Input value={form.pickupAddress} onChange={(event) => updateForm("pickupAddress", event.target.value)} /></Field>
                <Field label="City"><Input value={form.pickupCity} onChange={(event) => updateForm("pickupCity", event.target.value)} /></Field>
                <Field label="State"><Input maxLength={2} value={form.pickupState} onChange={(event) => updateForm("pickupState", event.target.value.toUpperCase())} /></Field>
                <Field label="ZIP"><Input value={form.pickupZip} onChange={(event) => updateForm("pickupZip", event.target.value)} /></Field>
                <Field label="Estimated"><Input type="datetime-local" value={form.pickupEstimated} onChange={(event) => updateForm("pickupEstimated", event.target.value)} /></Field>
                <Field label="Deadline"><Input type="datetime-local" value={form.pickupDeadline} onChange={(event) => updateForm("pickupDeadline", event.target.value)} /></Field>
              </div>
            </Section>

            <Section title="Delivery" description="Destination facility, contact and schedule.">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Facility Name"><Input value={form.deliveryName} onChange={(event) => updateForm("deliveryName", event.target.value)} /></Field>
                <Field label="Contact Name"><Input value={form.deliveryContactName} onChange={(event) => updateForm("deliveryContactName", event.target.value)} /></Field>
                <Field label="Phone"><Input value={form.deliveryPhone} onChange={(event) => updateForm("deliveryPhone", event.target.value)} /></Field>
                <Field label="Email"><Input type="email" value={form.deliveryEmail} onChange={(event) => updateForm("deliveryEmail", event.target.value)} /></Field>
                <Field label="Street Address" className="sm:col-span-2"><Input value={form.deliveryAddress} onChange={(event) => updateForm("deliveryAddress", event.target.value)} /></Field>
                <Field label="City"><Input value={form.deliveryCity} onChange={(event) => updateForm("deliveryCity", event.target.value)} /></Field>
                <Field label="State"><Input maxLength={2} value={form.deliveryState} onChange={(event) => updateForm("deliveryState", event.target.value.toUpperCase())} /></Field>
                <Field label="ZIP"><Input value={form.deliveryZip} onChange={(event) => updateForm("deliveryZip", event.target.value)} /></Field>
                <Field label="Estimated"><Input type="datetime-local" value={form.deliveryEstimated} onChange={(event) => updateForm("deliveryEstimated", event.target.value)} /></Field>
                <Field label="Deadline"><Input type="datetime-local" value={form.deliveryDeadline} onChange={(event) => updateForm("deliveryDeadline", event.target.value)} /></Field>
              </div>
            </Section>
          </div>

          <Section title="Financial and Equipment" description="Revenue, Carrier cost and transport requirements.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Field label="Miles"><Input type="number" min="0" step="0.01" value={form.miles} onChange={(event) => updateForm("miles", event.target.value)} /></Field>
              <Field label="Gross Rate"><Input type="number" min="0" step="0.01" value={form.rate} onChange={(event) => updateForm("rate", event.target.value)} /></Field>
              <Field label="Carrier Pay"><Input type="number" min="0" step="0.01" value={form.carrierPay} onChange={(event) => updateForm("carrierPay", event.target.value)} /></Field>
              <Field label="Fuel Surcharge"><Input type="number" min="0" step="0.01" value={form.fuelSurcharge} onChange={(event) => updateForm("fuelSurcharge", event.target.value)} /></Field>
              <Field label="Weight"><Input type="number" min="0" step="0.01" value={form.weight} onChange={(event) => updateForm("weight", event.target.value)} /></Field>
              <Field label="Freight Type">
                <Select value={form.freightType || "__none__"} onValueChange={(value) => updateForm("freightType", value === "__none__" ? "" : value)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent><SelectItem value="__none__">Not specified</SelectItem>{FREIGHT_TYPES.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Equipment Type">
                <Select value={form.equipmentType || "__none__"} onValueChange={(value) => updateForm("equipmentType", value === "__none__" ? "" : value)}>
                  <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent><SelectItem value="__none__">Not specified</SelectItem>{EQUIPMENT_TYPES.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Payment Method">
                <Select value={form.paymentMethod || "__none__"} onValueChange={(value) => updateForm("paymentMethod", value === "__none__" ? "" : value)}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent><SelectItem value="__none__">Not specified</SelectItem>{PAYMENT_METHODS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Payment Status">
                <Select value={form.paymentStatus} onValueChange={(value) => updateForm("paymentStatus", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_STATUSES.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Vehicles" description="One Load may contain one or more vehicles.">
            <div className="space-y-3">
              {vehicles.map((vehicle, index) => (
                <div key={`${vehicle.vehicleNumber}-${index}`} className="space-y-3 border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide">Vehicle #{vehicle.vehicleNumber}</h3>
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label={`Remove vehicle ${vehicle.vehicleNumber}`} onClick={() => removeVehicle(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {(["year", "make", "model", "type", "color", "plate", "vin", "lotNumber", "buyerNumber", "additionalInfo"] as const).map((field) => (
                      <Field key={field} label={field.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())} className={field === "vin" || field === "additionalInfo" ? "xl:col-span-2" : ""}>
                        <Input value={vehicle[field] ?? ""} onChange={(event) => updateVehicle(index, field, event.target.value)} />
                      </Field>
                    ))}
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" className="gap-2" onClick={() => setVehicles((current) => [...current, emptyVehicle(current.length + 1)])}>
                <Plus className="h-4 w-4" />
                Add Vehicle
              </Button>
            </div>
          </Section>

          <Section title="Instructions">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              <Field label="Dispatch Instructions"><Textarea rows={4} value={form.dispatchInstructions} onChange={(event) => updateForm("dispatchInstructions", event.target.value)} /></Field>
              <Field label="Pickup Instructions"><Textarea rows={4} value={form.pickupInstructions} onChange={(event) => updateForm("pickupInstructions", event.target.value)} /></Field>
              <Field label="Delivery Instructions"><Textarea rows={4} value={form.deliveryInstructions} onChange={(event) => updateForm("deliveryInstructions", event.target.value)} /></Field>
            </div>
          </Section>

          {error ? (
            <div className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {error instanceof Error ? error.message : "Load request failed."}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending || (!initialData && !form.loadId.trim())}>
              {isPending ? "Saving…" : initialData ? "Save Changes" : "Create Load"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
