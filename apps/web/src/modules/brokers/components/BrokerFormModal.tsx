import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateBroker,
  useUpdateBroker,
} from "@workspace/api-client-react";
import type { Broker } from "@workspace/api-client-react";
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

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Broker;
}

type BrokerFormState = {
  companyName: string;
  brokerType: string;
  status: string;
  priority: string;
  website: string;
  rating: string;
  mcNumber: string;
  usdotNumber: string;
  primaryContact: string;
  phone: string;
  email: string;
  lastContact: string;
  coverage: string;
  freightTypes: string;
  selectedStates: string;
  paymentTerms: string;
  paymentDays: string;
  quickPay: boolean;
  quickPayFee: string;
  factoringAccepted: string;
  onboardingStatus: string;
  tags: string;
  notes: string;
};

const EMPTY_FORM: BrokerFormState = {
  companyName: "",
  brokerType: "",
  status: "Active",
  priority: "",
  website: "",
  rating: "",
  mcNumber: "",
  usdotNumber: "",
  primaryContact: "",
  phone: "",
  email: "",
  lastContact: "",
  coverage: "",
  freightTypes: "",
  selectedStates: "",
  paymentTerms: "",
  paymentDays: "",
  quickPay: false,
  quickPayFee: "",
  factoringAccepted: "",
  onboardingStatus: "Not Started",
  tags: "",
  notes: "",
};

function brokerToForm(broker?: Broker): BrokerFormState {
  if (!broker) return EMPTY_FORM;

  return {
    companyName: broker.companyName ?? "",
    brokerType: broker.brokerType ?? "",
    status: broker.status ?? "Active",
    priority: broker.priority ?? "",
    website: broker.website ?? "",
    rating: broker.rating == null ? "" : String(broker.rating),
    mcNumber: broker.mcNumber ?? "",
    usdotNumber: broker.usdotNumber ?? "",
    primaryContact: broker.primaryContact ?? "",
    phone: broker.phone ?? "",
    email: broker.email ?? "",
    lastContact: broker.lastContact?.slice(0, 10) ?? "",
    coverage: broker.coverage ?? "",
    freightTypes: broker.freightTypes?.join(", ") ?? "",
    selectedStates: broker.selectedStates?.join(", ") ?? "",
    paymentTerms: broker.paymentTerms ?? "",
    paymentDays: broker.paymentDays == null ? "" : String(broker.paymentDays),
    quickPay: broker.quickPay ?? false,
    quickPayFee: broker.quickPayFee == null ? "" : String(broker.quickPayFee),
    factoringAccepted: broker.factoringAccepted ?? "",
    onboardingStatus: broker.onboardingStatus ?? "Not Started",
    tags: broker.tags?.join(", ") ?? "",
    notes: broker.notes ?? "",
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

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseList(value: string): string[] | undefined {
  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length ? values : undefined;
}

export function BrokerFormModal({ open, onClose, initialData }: Props) {
  const queryClient = useQueryClient();
  const createMutation = useCreateBroker();
  const updateMutation = useUpdateBroker();
  const [form, setForm] = useState<BrokerFormState>(EMPTY_FORM);

  useEffect(() => {
    setForm(brokerToForm(initialData));
  }, [initialData, open]);

  const updateForm = <K extends keyof BrokerFormState>(
    field: K,
    value: BrokerFormState[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.companyName.trim()) return;

    const optional = (value: string) => value.trim() || undefined;
    const payload = {
      companyName: form.companyName.trim(),
      brokerType: optional(form.brokerType),
      status: form.status,
      priority: optional(form.priority),
      website: optional(form.website),
      rating: parseOptionalNumber(form.rating),
      mcNumber: optional(form.mcNumber),
      usdotNumber: optional(form.usdotNumber),
      primaryContact: optional(form.primaryContact),
      phone: optional(form.phone),
      email: optional(form.email),
      lastContact: optional(form.lastContact),
      coverage: optional(form.coverage),
      freightTypes: parseList(form.freightTypes),
      selectedStates: parseList(form.selectedStates),
      paymentTerms: optional(form.paymentTerms),
      paymentDays: parseOptionalNumber(form.paymentDays),
      quickPay: form.quickPay,
      quickPayFee: parseOptionalNumber(form.quickPayFee),
      factoringAccepted: optional(form.factoringAccepted),
      onboardingStatus: optional(form.onboardingStatus),
      tags: parseList(form.tags),
      notes: optional(form.notes),
    };

    const onSuccess = async () => {
      await queryClient.invalidateQueries({ queryKey: ["brokers"] });
      onClose();
    };

    if (initialData) {
      updateMutation.mutate(
        { brokerId: initialData.id, data: payload },
        { onSuccess },
      );
      return;
    }

    createMutation.mutate({ data: payload }, { onSuccess });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const emailIsValid = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const canSubmit = Boolean(form.companyName.trim()) && emailIsValid && !isPending;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[94vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {initialData ? `Edit Broker — ${initialData.companyName}` : "Create Broker"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Section
            title="Company"
            description="Broker identity, authority and internal qualification."
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Company Name *" className="md:col-span-2">
                <Input
                  required
                  value={form.companyName}
                  onChange={(event) => updateForm("companyName", event.target.value)}
                  placeholder="Broker company name"
                />
              </Field>
              <Field label="Broker Type">
                <Select
                  value={form.brokerType || "__none__"}
                  onValueChange={(value) =>
                    updateForm("brokerType", value === "__none__" ? "" : value)
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    <SelectItem value="Freight Broker">Freight Broker</SelectItem>
                    <SelectItem value="Freight Forwarder">Freight Forwarder</SelectItem>
                    <SelectItem value="3PL">3PL</SelectItem>
                    <SelectItem value="Direct Shipper">Direct Shipper</SelectItem>
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
                    <SelectItem value="Blacklisted">Blacklisted</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Priority">
                <Select
                  value={form.priority || "__none__"}
                  onValueChange={(value) =>
                    updateForm("priority", value === "__none__" ? "" : value)
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Rating">
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={(event) => updateForm("rating", event.target.value)}
                />
              </Field>
              <Field label="MC Number">
                <Input
                  value={form.mcNumber}
                  onChange={(event) => updateForm("mcNumber", event.target.value)}
                />
              </Field>
              <Field label="USDOT Number">
                <Input
                  value={form.usdotNumber}
                  onChange={(event) => updateForm("usdotNumber", event.target.value)}
                />
              </Field>
              <Field label="Website" className="md:col-span-2">
                <Input
                  value={form.website}
                  onChange={(event) => updateForm("website", event.target.value)}
                  placeholder="https://"
                />
              </Field>
            </div>
          </Section>

          <Section title="Contact" description="Primary communication and relationship tracking.">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Primary Contact">
                <Input
                  value={form.primaryContact}
                  onChange={(event) => updateForm("primaryContact", event.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  aria-invalid={!emailIsValid}
                />
                {!emailIsValid ? (
                  <p className="text-xs text-destructive">Enter a valid email address.</p>
                ) : null}
              </Field>
              <Field label="Last Contact">
                <Input
                  type="date"
                  value={form.lastContact}
                  onChange={(event) => updateForm("lastContact", event.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Coverage" description="Freight profile and geographic operating scope.">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Coverage Area" className="md:col-span-2">
                <Input
                  value={form.coverage}
                  onChange={(event) => updateForm("coverage", event.target.value)}
                  placeholder="Nationwide, Southeast, Midwest"
                />
              </Field>
              <Field label="Freight Types">
                <Input
                  value={form.freightTypes}
                  onChange={(event) => updateForm("freightTypes", event.target.value)}
                  placeholder="Auto Transport, Dry Van, Flatbed"
                />
                <p className="text-[11px] text-muted-foreground">Separate values with commas.</p>
              </Field>
              <Field label="Selected States">
                <Input
                  value={form.selectedStates}
                  onChange={(event) => updateForm("selectedStates", event.target.value.toUpperCase())}
                  placeholder="FL, GA, TX"
                />
                <p className="text-[11px] text-muted-foreground">Use two-letter state codes.</p>
              </Field>
            </div>
          </Section>

          <Section title="Payment" description="Payment terms, QuickPay and factoring compatibility.">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Payment Terms">
                <Select
                  value={form.paymentTerms || "__none__"}
                  onValueChange={(value) =>
                    updateForm("paymentTerms", value === "__none__" ? "" : value)
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select terms" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    <SelectItem value="Net 7">Net 7</SelectItem>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="QuickPay">QuickPay</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Payment Days">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.paymentDays}
                  onChange={(event) => updateForm("paymentDays", event.target.value)}
                />
              </Field>
              <Field label="QuickPay Fee">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.quickPayFee}
                  onChange={(event) => updateForm("quickPayFee", event.target.value)}
                />
              </Field>
              <Field label="Factoring Accepted">
                <Select
                  value={form.factoringAccepted || "__none__"}
                  onValueChange={(value) =>
                    updateForm("factoringAccepted", value === "__none__" ? "" : value)
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unknown</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <label className="flex min-h-10 items-center gap-3 border border-border px-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.quickPay}
                  onChange={(event) => updateForm("quickPay", event.target.checked)}
                  className="h-4 w-4"
                />
                QuickPay available
              </label>
            </div>
          </Section>

          <Section title="Relationship Management">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Onboarding Status">
                <Select
                  value={form.onboardingStatus || "__none__"}
                  onValueChange={(value) =>
                    updateForm("onboardingStatus", value === "__none__" ? "" : value)
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Documents Pending">Documents Pending</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Tags">
                <Input
                  value={form.tags}
                  onChange={(event) => updateForm("tags", event.target.value)}
                  placeholder="Preferred, High volume, Auto auctions"
                />
                <p className="text-[11px] text-muted-foreground">Separate values with commas.</p>
              </Field>
              <Field label="Notes" className="md:col-span-2">
                <Textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                />
              </Field>
            </div>
          </Section>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isPending ? "Saving…" : initialData ? "Save Changes" : "Create Broker"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
