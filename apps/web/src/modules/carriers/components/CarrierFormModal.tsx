import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCarrier,
  useUpdateCarrier,
} from "@workspace/api-client-react";
import type { Carrier } from "@workspace/api-client-react";
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
  initialData?: Carrier;
}

type Equipment = {
  year: string;
  make: string;
  model: string;
  vin: string;
  color: string;
  plateNumber: string;
};

type AssignedDriver = {
  name: string;
  phone: string;
  phone2: string;
  emergencyContactName: string;
  emergencyPhone: string;
  emergencyPhone2: string;
  email: string;
  licenseType: string;
  cdlNumber: string;
  twicCard: boolean;
};

type FleetEntry = {
  id?: string;
  truck: Equipment;
  trailer: Equipment;
  driver: AssignedDriver;
};

type CarrierWithDetails = Carrier & {
  phone2?: string | null;
  emergencyContactName?: string | null;
  emergencyPhone?: string | null;
  emergencyPhone2?: string | null;
  weeklyMinimumAmount?: number | null;
  totalTripsPerWeek?: number | null;
  fleetData?: FleetEntry[];
};

type FormState = {
  companyName: string;
  carrierType: string;
  status: string;
  rating: string;
  notes: string;
  primaryContact: string;
  phone: string;
  phone2: string;
  emergencyContactName: string;
  emergencyPhone: string;
  emergencyPhone2: string;
  email: string;
  website: string;
  usdotNumber: string;
  mcNumber: string;
  einNumber: string;
  authorityStatus: string;
  insuranceExpiration: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyZip: string;
  operatingStates: string;
  weeklyMinimumAmount: string;
  totalTripsPerWeek: string;
  ratePerMile: string;
  lastLoadDate: string;
  paymentTerms: string;
  factoringCompany: string;
  factoringFee: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  routingNumber: string;
  bankAddress: string;
  bankCity: string;
  bankState: string;
  bankZip: string;
  zelleAccount: string;
  cashAppAccount: string;
};

const EMPTY_EQUIPMENT: Equipment = {
  year: "",
  make: "",
  model: "",
  vin: "",
  color: "",
  plateNumber: "",
};

const EMPTY_DRIVER: AssignedDriver = {
  name: "",
  phone: "",
  phone2: "",
  emergencyContactName: "",
  emergencyPhone: "",
  emergencyPhone2: "",
  email: "",
  licenseType: "",
  cdlNumber: "",
  twicCard: false,
};

const EMPTY_FORM: FormState = {
  companyName: "",
  carrierType: "",
  status: "Active",
  rating: "",
  notes: "",
  primaryContact: "",
  phone: "",
  phone2: "",
  emergencyContactName: "",
  emergencyPhone: "",
  emergencyPhone2: "",
  email: "",
  website: "",
  usdotNumber: "",
  mcNumber: "",
  einNumber: "",
  authorityStatus: "",
  insuranceExpiration: "",
  companyAddress: "",
  companyCity: "",
  companyState: "",
  companyZip: "",
  operatingStates: "",
  weeklyMinimumAmount: "",
  totalTripsPerWeek: "",
  ratePerMile: "",
  lastLoadDate: "",
  paymentTerms: "",
  factoringCompany: "",
  factoringFee: "",
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  routingNumber: "",
  bankAddress: "",
  bankCity: "",
  bankState: "",
  bankZip: "",
  zelleAccount: "",
  cashAppAccount: "",
};

function emptyFleetEntry(): FleetEntry {
  return {
    truck: { ...EMPTY_EQUIPMENT },
    trailer: { ...EMPTY_EQUIPMENT },
    driver: { ...EMPTY_DRIVER },
  };
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

function EquipmentFields({
  title,
  equipment,
  onChange,
}: {
  title: string;
  equipment: Equipment;
  onChange: (field: keyof Equipment, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Year">
          <Input value={equipment.year} onChange={(event) => onChange("year", event.target.value)} />
        </Field>
        <Field label="Make">
          <Input value={equipment.make} onChange={(event) => onChange("make", event.target.value)} />
        </Field>
        <Field label="Model">
          <Input value={equipment.model} onChange={(event) => onChange("model", event.target.value)} />
        </Field>
        <Field label="VIN">
          <Input value={equipment.vin} onChange={(event) => onChange("vin", event.target.value)} />
        </Field>
        <Field label="Color">
          <Input value={equipment.color} onChange={(event) => onChange("color", event.target.value)} />
        </Field>
        <Field label="Plate">
          <Input
            value={equipment.plateNumber}
            onChange={(event) => onChange("plateNumber", event.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function DriverFields({
  driver,
  onChange,
}: {
  driver: AssignedDriver;
  onChange: (field: keyof AssignedDriver, value: string | boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Assigned Driver
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Name">
          <Input value={driver.name} onChange={(event) => onChange("name", event.target.value)} />
        </Field>
        <Field label="Phone Number">
          <Input value={driver.phone} onChange={(event) => onChange("phone", event.target.value)} />
        </Field>
        <Field label="Phone Number 2">
          <Input value={driver.phone2} onChange={(event) => onChange("phone2", event.target.value)} />
        </Field>
        <Field label="24/7 Emergency Contact">
          <Input
            value={driver.emergencyContactName}
            onChange={(event) => onChange("emergencyContactName", event.target.value)}
          />
        </Field>
        <Field label="Emergency Phone Number">
          <Input
            value={driver.emergencyPhone}
            onChange={(event) => onChange("emergencyPhone", event.target.value)}
          />
        </Field>
        <Field label="Emergency Phone Number 2">
          <Input
            value={driver.emergencyPhone2}
            onChange={(event) => onChange("emergencyPhone2", event.target.value)}
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={driver.email}
            onChange={(event) => onChange("email", event.target.value)}
          />
        </Field>
        <Field label="Driver License Type">
          <Input
            value={driver.licenseType}
            onChange={(event) => onChange("licenseType", event.target.value)}
            placeholder="CDL Class A"
          />
        </Field>
        <Field label="CDL Number">
          <Input
            value={driver.cdlNumber}
            onChange={(event) => onChange("cdlNumber", event.target.value)}
          />
        </Field>
        <label className="flex min-h-10 items-center gap-3 border border-border px-3 text-sm sm:col-span-2 xl:col-span-3">
          <input
            type="checkbox"
            checked={driver.twicCard}
            onChange={(event) => onChange("twicCard", event.target.checked)}
            className="h-4 w-4"
          />
          TWIC Card verified
        </label>
      </div>
    </div>
  );
}

export function CarrierFormModal({ open, onClose, initialData }: Props) {
  const queryClient = useQueryClient();
  const createMutation = useCreateCarrier();
  const updateMutation = useUpdateCarrier();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fleet, setFleet] = useState<FleetEntry[]>([]);

  useEffect(() => {
    if (!initialData) {
      setForm(EMPTY_FORM);
      setFleet([]);
      return;
    }

    const carrier = initialData as CarrierWithDetails;
    setForm({
      companyName: carrier.companyName ?? "",
      carrierType: carrier.carrierType ?? "",
      status: carrier.status ?? "Active",
      rating: carrier.rating == null ? "" : String(carrier.rating),
      notes: carrier.notes ?? "",
      primaryContact: carrier.primaryContact ?? "",
      phone: carrier.phone ?? "",
      phone2: carrier.phone2 ?? "",
      emergencyContactName: carrier.emergencyContactName ?? "",
      emergencyPhone: carrier.emergencyPhone ?? "",
      emergencyPhone2: carrier.emergencyPhone2 ?? "",
      email: carrier.email ?? "",
      website: carrier.website ?? "",
      usdotNumber: carrier.usdotNumber ?? "",
      mcNumber: carrier.mcNumber ?? "",
      einNumber: carrier.einNumber ?? "",
      authorityStatus: carrier.authorityStatus ?? "",
      insuranceExpiration: carrier.insuranceExpiration?.slice(0, 10) ?? "",
      companyAddress: carrier.companyAddress ?? "",
      companyCity: carrier.companyCity ?? "",
      companyState: carrier.companyState ?? "",
      companyZip: carrier.companyZip ?? "",
      operatingStates: carrier.operatingStates?.join(", ") ?? "",
      weeklyMinimumAmount:
        carrier.weeklyMinimumAmount == null ? "" : String(carrier.weeklyMinimumAmount),
      totalTripsPerWeek:
        carrier.totalTripsPerWeek == null ? "" : String(carrier.totalTripsPerWeek),
      ratePerMile: carrier.ratePerMile == null ? "" : String(carrier.ratePerMile),
      lastLoadDate: carrier.lastLoadDate?.slice(0, 10) ?? "",
      paymentTerms: carrier.paymentTerms ?? "",
      factoringCompany: carrier.factoringCompany ?? "",
      factoringFee: carrier.factoringFee == null ? "" : String(carrier.factoringFee),
      bankName: carrier.bankName ?? "",
      accountHolder: carrier.accountHolder ?? "",
      accountNumber: "",
      routingNumber: "",
      bankAddress: carrier.bankAddress ?? "",
      bankCity: carrier.bankCity ?? "",
      bankState: carrier.bankState ?? "",
      bankZip: carrier.bankZip ?? "",
      zelleAccount: carrier.zelleAccount ?? "",
      cashAppAccount: carrier.cashAppAccount ?? "",
    });
    setFleet(carrier.fleetData?.map((entry) => ({
      ...entry,
      truck: { ...EMPTY_EQUIPMENT, ...entry.truck },
      trailer: { ...EMPTY_EQUIPMENT, ...entry.trailer },
      driver: { ...EMPTY_DRIVER, ...entry.driver },
    })) ?? []);
  }, [initialData, open]);

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updateEquipment = (
    index: number,
    section: "truck" | "trailer",
    field: keyof Equipment,
    value: string,
  ) => {
    setFleet((previous) =>
      previous.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              [section]: { ...entry[section], [field]: value },
            }
          : entry,
      ),
    );
  };

  const updateDriver = (
    index: number,
    field: keyof AssignedDriver,
    value: string | boolean,
  ) => {
    setFleet((previous) =>
      previous.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              driver: { ...entry.driver, [field]: value } as AssignedDriver,
            }
          : entry,
      ),
    );
  };

  const parseOptionalNumber = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const parseList = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.companyName.trim()) return;

    const optional = (value: string) => value.trim() || undefined;
    const payload = {
      companyName: form.companyName.trim(),
      carrierType: optional(form.carrierType),
      status: form.status,
      rating: parseOptionalNumber(form.rating),
      notes: optional(form.notes),
      primaryContact: optional(form.primaryContact),
      phone: optional(form.phone),
      phone2: optional(form.phone2),
      emergencyContactName: optional(form.emergencyContactName),
      emergencyPhone: optional(form.emergencyPhone),
      emergencyPhone2: optional(form.emergencyPhone2),
      email: optional(form.email),
      website: optional(form.website),
      usdotNumber: optional(form.usdotNumber),
      mcNumber: optional(form.mcNumber),
      einNumber: optional(form.einNumber),
      authorityStatus: optional(form.authorityStatus),
      insuranceExpiration: optional(form.insuranceExpiration),
      companyAddress: optional(form.companyAddress),
      companyCity: optional(form.companyCity),
      companyState: optional(form.companyState),
      companyZip: optional(form.companyZip),
      operatingStates: parseList(form.operatingStates),
      weeklyMinimumAmount: parseOptionalNumber(form.weeklyMinimumAmount),
      totalTripsPerWeek: parseOptionalNumber(form.totalTripsPerWeek),
      ratePerMile: parseOptionalNumber(form.ratePerMile),
      paymentTerms: optional(form.paymentTerms),
      factoringCompany: optional(form.factoringCompany),
      factoringFee: parseOptionalNumber(form.factoringFee),
      bankName: optional(form.bankName),
      accountHolder: optional(form.accountHolder),
      accountNumber: optional(form.accountNumber),
      routingNumber: optional(form.routingNumber),
      bankAddress: optional(form.bankAddress),
      bankCity: optional(form.bankCity),
      bankState: optional(form.bankState),
      bankZip: optional(form.bankZip),
      zelleAccount: optional(form.zelleAccount),
      cashAppAccount: optional(form.cashAppAccount),
      fleetData: fleet,
    };

    const onSuccess = () => {
      void queryClient.invalidateQueries({ queryKey: ["carriers"] });
      onClose();
    };

    if (initialData) {
      updateMutation.mutate(
        { carrierId: initialData.id, data: payload },
        { onSuccess },
      );
      return;
    }

    createMutation.mutate({ data: payload }, { onSuccess });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[94vh] max-w-[1180px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {initialData ? `Edit Carrier — ${initialData.companyName}` : "Create Carrier"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Section title="Company" description="Core carrier identification and internal status.">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Company Name *" className="xl:col-span-2">
                <Input
                  required
                  value={form.companyName}
                  onChange={(event) => updateForm("companyName", event.target.value)}
                />
              </Field>
              <Field label="Carrier Type">
                <Select value={form.carrierType || "__none__"} onValueChange={(value) => updateForm("carrierType", value === "__none__" ? "" : value)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    <SelectItem value="Owner Operator">Owner Operator</SelectItem>
                    <SelectItem value="Fleet">Fleet</SelectItem>
                    <SelectItem value="Company Driver">Company Driver</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(value) => updateForm("status", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Rating">
                <Input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(event) => updateForm("rating", event.target.value)} />
              </Field>
              <Field label="Notes" className="md:col-span-2 xl:col-span-5">
                <Textarea rows={3} value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Contacts" description="Primary contact and 24/7 emergency communication.">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Primary Contact">
                <Input value={form.primaryContact} onChange={(event) => updateForm("primaryContact", event.target.value)} />
              </Field>
              <Field label="Phone Number">
                <Input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
              </Field>
              <Field label="Phone Number 2">
                <Input value={form.phone2} onChange={(event) => updateForm("phone2", event.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
              </Field>
              <Field label="24/7 Emergency Contact">
                <Input value={form.emergencyContactName} onChange={(event) => updateForm("emergencyContactName", event.target.value)} />
              </Field>
              <Field label="Emergency Phone Number">
                <Input value={form.emergencyPhone} onChange={(event) => updateForm("emergencyPhone", event.target.value)} />
              </Field>
              <Field label="Emergency Phone Number 2">
                <Input value={form.emergencyPhone2} onChange={(event) => updateForm("emergencyPhone2", event.target.value)} />
              </Field>
              <Field label="Website">
                <Input value={form.website} onChange={(event) => updateForm("website", event.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Authority & Compliance">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Field label="USDOT Number"><Input value={form.usdotNumber} onChange={(event) => updateForm("usdotNumber", event.target.value)} /></Field>
              <Field label="MC Number"><Input value={form.mcNumber} onChange={(event) => updateForm("mcNumber", event.target.value)} /></Field>
              <Field label="EIN Number"><Input value={form.einNumber} onChange={(event) => updateForm("einNumber", event.target.value)} /></Field>
              <Field label="Authority Status"><Input value={form.authorityStatus} onChange={(event) => updateForm("authorityStatus", event.target.value)} /></Field>
              <Field label="Insurance Expiration"><Input type="date" value={form.insuranceExpiration} onChange={(event) => updateForm("insuranceExpiration", event.target.value)} /></Field>
            </div>
          </Section>

          <Section title="Company Address">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Company Address" className="xl:col-span-2"><Input value={form.companyAddress} onChange={(event) => updateForm("companyAddress", event.target.value)} /></Field>
              <Field label="City"><Input value={form.companyCity} onChange={(event) => updateForm("companyCity", event.target.value)} /></Field>
              <Field label="State"><Input value={form.companyState} onChange={(event) => updateForm("companyState", event.target.value)} /></Field>
              <Field label="ZIP Code"><Input value={form.companyZip} onChange={(event) => updateForm("companyZip", event.target.value)} /></Field>
            </div>
          </Section>

          <Section title="Fleet Equipment" description="Each entry groups one truck, one trailer and its assigned driver.">
            <div className="space-y-4">
              {fleet.map((entry, index) => (
                <div key={entry.id ?? index} className="space-y-5 border border-border bg-muted/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Equipment #{index + 1}</p>
                    <Button type="button" variant="outline" size="sm" className="gap-2 text-destructive" onClick={() => setFleet((previous) => previous.filter((_, entryIndex) => entryIndex !== index))}>
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                  <EquipmentFields title="Truck" equipment={entry.truck} onChange={(field, value) => updateEquipment(index, "truck", field, value)} />
                  <EquipmentFields title="Trailer" equipment={entry.trailer} onChange={(field, value) => updateEquipment(index, "trailer", field, value)} />
                  <DriverFields driver={entry.driver} onChange={(field, value) => updateDriver(index, field, value)} />
                </div>
              ))}

              {fleet.length === 0 ? (
                <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No fleet equipment registered.
                </div>
              ) : null}

              <Button type="button" variant="outline" className="gap-2" onClick={() => setFleet((previous) => [...previous, emptyFleetEntry()])}>
                <Plus className="h-4 w-4" /> Add Fleet Equipment
              </Button>
            </div>
          </Section>

          <Section title="Operations">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Operating States" className="xl:col-span-2"><Input placeholder="FL, GA, TX" value={form.operatingStates} onChange={(event) => updateForm("operatingStates", event.target.value)} /></Field>
              <Field label="Weekly Minimum Amount"><Input type="number" min="0" step="0.01" value={form.weeklyMinimumAmount} onChange={(event) => updateForm("weeklyMinimumAmount", event.target.value)} /></Field>
              <Field label="Total Trips per Week"><Input type="number" min="0" step="1" value={form.totalTripsPerWeek} onChange={(event) => updateForm("totalTripsPerWeek", event.target.value)} /></Field>
              <Field label="Rate per Mile"><Input type="number" min="0" step="0.0001" value={form.ratePerMile} onChange={(event) => updateForm("ratePerMile", event.target.value)} /></Field>
              <Field label="Last Load"><Input type="date" value={form.lastLoadDate} disabled title="Updated from load activity" /></Field>
            </div>
          </Section>

          <Section title="Payment & Factoring">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Payment Terms"><Input value={form.paymentTerms} onChange={(event) => updateForm("paymentTerms", event.target.value)} placeholder="Net 7" /></Field>
              <Field label="Factoring Company"><Input value={form.factoringCompany} onChange={(event) => updateForm("factoringCompany", event.target.value)} /></Field>
              <Field label="Factoring Fee"><Input type="number" min="0" step="0.01" value={form.factoringFee} onChange={(event) => updateForm("factoringFee", event.target.value)} /></Field>
            </div>
          </Section>

          <Section title="Banking" description="Account and routing numbers are encrypted and never returned in full.">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Bank Name"><Input value={form.bankName} onChange={(event) => updateForm("bankName", event.target.value)} /></Field>
              <Field label="Account Holder"><Input value={form.accountHolder} onChange={(event) => updateForm("accountHolder", event.target.value)} /></Field>
              <Field label="Account Number"><Input type="password" autoComplete="off" value={form.accountNumber} onChange={(event) => updateForm("accountNumber", event.target.value)} placeholder={initialData?.accountNumberLast4 ? `Leave blank to keep ••••${initialData.accountNumberLast4}` : ""} /></Field>
              <Field label="Routing Number"><Input type="password" autoComplete="off" value={form.routingNumber} onChange={(event) => updateForm("routingNumber", event.target.value)} placeholder={initialData?.routingNumberLast4 ? `Leave blank to keep ••••${initialData.routingNumberLast4}` : ""} /></Field>
              <Field label="Bank Address" className="xl:col-span-2"><Input value={form.bankAddress} onChange={(event) => updateForm("bankAddress", event.target.value)} /></Field>
              <Field label="Bank City"><Input value={form.bankCity} onChange={(event) => updateForm("bankCity", event.target.value)} /></Field>
              <Field label="Bank State"><Input value={form.bankState} onChange={(event) => updateForm("bankState", event.target.value)} /></Field>
              <Field label="Bank ZIP Code"><Input value={form.bankZip} onChange={(event) => updateForm("bankZip", event.target.value)} /></Field>
              <Field label="Zelle Account"><Input value={form.zelleAccount} onChange={(event) => updateForm("zelleAccount", event.target.value)} /></Field>
              <Field label="Cash App"><Input value={form.cashAppAccount} onChange={(event) => updateForm("cashAppAccount", event.target.value)} /></Field>
            </div>
          </Section>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending || !form.companyName.trim()}>
              {isPending ? "Saving…" : initialData ? "Save Changes" : "Create Carrier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
