import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGetCrmContactQueryKey,
  getListCrmContactsQueryKey,
} from "@workspace/api-client-react";
import type { CrmContact } from "@workspace/api-client-react";
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
import {
  Building2,
  ContactRound,
  Truck,
  UserRound,
} from "lucide-react";
import { CarrierFormModal } from "@/modules/carriers/components/CarrierFormModal";
import { BrokerFormModal } from "@/modules/brokers/components/BrokerFormModal";
import {
  assertGenericContactType,
  createGenericContact,
  GENERIC_CONTACT_TYPES,
  updateGenericContact,
  type GenericContactInput,
  type GenericContactRecord,
  type GenericContactType,
} from "../api/contacts";
import {
  CONTACT_TYPE_CONFIG,
  type ContactType,
} from "../config/contactTypes";
import { DriverFormModal } from "./DriverFormModal";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: CrmContact;
}

type DedicatedType = "Carrier" | "Broker" | "Driver";
type Selection = DedicatedType | GenericContactType | "";

type GenericStatus = "Active" | "Inactive" | "Blocked";

interface GenericFormState {
  companyName: string;
  contactType: GenericContactType | "";
  status: GenericStatus;
  priority: string;
  rating: string;
  primaryContactName: string;
  primaryPhoneNumber: string;
  primaryPhoneNumber2: string;
  email: string;
  website: string;
  emergencyContactName: string;
  emergencyPhoneNumber: string;
  emergencyPhoneNumber2: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  coverageArea: string;
  businessHours: string;
  emergencyService: boolean;
  services: string;
  lastContact: string;
  tags: string;
  notes: string;
}

const EMPTY_FORM: GenericFormState = {
  companyName: "",
  contactType: "",
  status: "Active",
  priority: "",
  rating: "",
  primaryContactName: "",
  primaryPhoneNumber: "",
  primaryPhoneNumber2: "",
  email: "",
  website: "",
  emergencyContactName: "",
  emergencyPhoneNumber: "",
  emergencyPhoneNumber2: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  coverageArea: "",
  businessHours: "",
  emergencyService: false,
  services: "",
  lastContact: "",
  tags: "",
  notes: "",
};

function isDedicatedType(value?: string | null): value is DedicatedType {
  return value === "Carrier" || value === "Broker" || value === "Driver";
}

function isGenericStatus(value?: string | null): value is GenericStatus {
  return value === "Active" || value === "Inactive" || value === "Blocked";
}

function optionalText(value: string): string | null {
  return value.trim() || null;
}

function optionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 10) / 10 : null;
}

function splitValues(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formFromContact(contact: CrmContact): GenericFormState {
  const record = contact as GenericContactRecord;
  const contactType = assertGenericContactType(record.contactType ?? "");

  return {
    companyName: record.companyName ?? "",
    contactType,
    status: isGenericStatus(record.status) ? record.status : "Active",
    priority: record.priority ?? "",
    rating: record.rating == null ? "" : String(record.rating),
    primaryContactName: record.primaryContactName ?? "",
    primaryPhoneNumber: record.primaryPhoneNumber ?? "",
    primaryPhoneNumber2: record.primaryPhoneNumber2 ?? "",
    email: record.email ?? "",
    website: record.website ?? "",
    emergencyContactName: record.emergencyContactName ?? "",
    emergencyPhoneNumber: record.emergencyPhoneNumber ?? "",
    emergencyPhoneNumber2: record.emergencyPhoneNumber2 ?? "",
    streetAddress: record.streetAddress ?? "",
    city: record.city ?? "",
    state: record.state ?? "",
    zipCode: record.zipCode ?? "",
    coverageArea: record.coverageArea ?? "",
    businessHours: record.businessHours ?? "",
    emergencyService: record.emergencyService ?? false,
    services: record.services ?? "",
    lastContact: record.lastContact?.slice(0, 10) ?? "",
    tags: record.tags?.join(", ") ?? "",
    notes: record.notes ?? "",
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
        <h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3>
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

function TypePicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (type: Selection) => void;
}) {
  const options = [
    {
      type: "Carrier" as const,
      icon: Truck,
      title: "Carrier",
      description: "Create a transport company in the Carrier module.",
    },
    {
      type: "Broker" as const,
      icon: Building2,
      title: "Broker",
      description: "Create a freight broker in the Broker module.",
    },
    {
      type: "Driver" as const,
      icon: UserRound,
      title: "Driver",
      description: "Create a qualified driver record with CDL and compliance.",
    },
    {
      type: "Other" as const,
      icon: ContactRound,
      title: "Other Contact",
      description: "Create a dealer, shipper, service provider or business contact.",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Select Contact Type
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => onSelect(option.type)}
                className="flex items-start gap-3 border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/20 bg-primary/5 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{option.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LegacyRestrictedContact({
  open,
  onClose,
  contactType,
}: {
  open: boolean;
  onClose: () => void;
  contactType: DedicatedType;
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Legacy {contactType} CRM Record
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            This record was created in the legacy generic CRM table. New {contactType}
            records are managed exclusively by the dedicated {contactType} module to
            prevent duplicate operational entities and insecure field handling.
          </p>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ContactFormModal({ open, onClose, initialData }: Props) {
  const initialType = initialData?.contactType ?? "";
  const [selection, setSelection] = useState<Selection>(
    initialData && !isDedicatedType(initialType)
      ? assertGenericContactType(initialType)
      : "",
  );

  useEffect(() => {
    if (!open) {
      setSelection("");
      return;
    }
    if (initialData && !isDedicatedType(initialData.contactType)) {
      setSelection(assertGenericContactType(initialData.contactType ?? ""));
    }
  }, [initialData, open]);

  if (initialData && isDedicatedType(initialType)) {
    return (
      <LegacyRestrictedContact
        open={open}
        onClose={onClose}
        contactType={initialType}
      />
    );
  }

  if (!initialData && !selection) {
    return (
      <TypePicker open={open} onClose={onClose} onSelect={setSelection} />
    );
  }

  if (!initialData && selection === "Carrier") {
    return <CarrierFormModal open={open} onClose={onClose} />;
  }

  if (!initialData && selection === "Broker") {
    return <BrokerFormModal open={open} onClose={onClose} />;
  }

  if (!initialData && selection === "Driver") {
    return <DriverFormModal open={open} onClose={onClose} />;
  }

  const genericType = assertGenericContactType(
    initialData?.contactType ?? selection,
  );

  return (
    <GenericContactForm
      open={open}
      onClose={onClose}
      initialData={initialData}
      initialType={genericType}
      onBack={!initialData ? () => setSelection("") : undefined}
    />
  );
}

function GenericContactForm({
  open,
  onClose,
  initialData,
  initialType,
  onBack,
}: {
  open: boolean;
  onClose: () => void;
  initialData?: CrmContact;
  initialType: GenericContactType;
  onBack?: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GenericFormState>(
    initialData
      ? formFromContact(initialData)
      : { ...EMPTY_FORM, contactType: initialType },
  );

  useEffect(() => {
    setForm(
      initialData
        ? formFromContact(initialData)
        : { ...EMPTY_FORM, contactType: initialType },
    );
  }, [initialData, initialType, open]);

  const createMutation = useMutation({ mutationFn: createGenericContact });
  const updateMutation = useMutation({
    mutationFn: ({
      contactId,
      data,
    }: {
      contactId: string;
      data: GenericContactInput;
    }) => updateGenericContact(contactId, data),
  });

  const updateForm = <K extends keyof GenericFormState>(
    field: K,
    value: GenericFormState[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const config = CONTACT_TYPE_CONFIG[form.contactType || initialType];
  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error;
  const emailIsValid =
    !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const canSubmit =
    Boolean(form.companyName.trim()) &&
    Boolean(form.contactType) &&
    emailIsValid &&
    !isPending;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !form.contactType) return;

    const payload: GenericContactInput = {
      companyName: form.companyName.trim(),
      contactType: form.contactType,
      status: form.status,
      priority: optionalText(form.priority),
      rating: optionalNumber(form.rating),
      primaryContactName: optionalText(form.primaryContactName),
      primaryPhoneNumber: optionalText(form.primaryPhoneNumber),
      primaryPhoneNumber2: optionalText(form.primaryPhoneNumber2),
      email: optionalText(form.email),
      website: optionalText(form.website),
      emergencyContactName: optionalText(form.emergencyContactName),
      emergencyPhoneNumber: optionalText(form.emergencyPhoneNumber),
      emergencyPhoneNumber2: optionalText(form.emergencyPhoneNumber2),
      streetAddress: config.showAddress ? optionalText(form.streetAddress) : null,
      city: config.showAddress ? optionalText(form.city) : null,
      state: config.showAddress ? optionalText(form.state.toUpperCase()) : null,
      zipCode: config.showAddress ? optionalText(form.zipCode) : null,
      coverageArea: config.showCoverageArea
        ? optionalText(form.coverageArea)
        : null,
      businessHours: config.showBusinessHours
        ? optionalText(form.businessHours)
        : null,
      emergencyService: config.showEmergencyService
        ? form.emergencyService
        : false,
      services: config.showServices ? optionalText(form.services) : null,
      lastContact: optionalText(form.lastContact),
      tags: splitValues(form.tags),
      notes: optionalText(form.notes),
    };

    const onSuccess = async () => {
      await queryClient.invalidateQueries({
        queryKey: getListCrmContactsQueryKey(),
      });
      await queryClient.invalidateQueries({ queryKey: ["crm", "contacts"] });
      if (initialData?.id) {
        await queryClient.invalidateQueries({
          queryKey: getGetCrmContactQueryKey(initialData.id),
        });
      }
      onClose();
    };

    if (initialData) {
      updateMutation.mutate(
        { contactId: initialData.id, data: payload },
        { onSuccess },
      );
      return;
    }

    createMutation.mutate(payload, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[94vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {initialData
              ? `Edit Contact — ${initialData.companyName}`
              : `Create ${form.contactType} Contact`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Section
            title="Identification"
            description="Generic business contact stored in CRM. Carrier, Broker and Driver use dedicated modules."
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Company Name *" className="md:col-span-2">
                <Input
                  required
                  value={form.companyName}
                  onChange={(event) =>
                    updateForm("companyName", event.target.value)
                  }
                />
              </Field>
              <Field label="Contact Type *">
                <Select
                  value={form.contactType}
                  disabled={Boolean(initialData)}
                  onValueChange={(value) =>
                    updateForm("contactType", assertGenericContactType(value))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GENERIC_CONTACT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select
                  value={form.status}
                  onValueChange={(value) => {
                    if (isGenericStatus(value)) updateForm("status", value);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
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
                  <SelectTrigger><SelectValue placeholder="Not specified" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
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
              <Field label="Last Contact">
                <Input
                  type="date"
                  value={form.lastContact}
                  onChange={(event) =>
                    updateForm("lastContact", event.target.value)
                  }
                />
              </Field>
            </div>
          </Section>

          <Section title="Primary Contact">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Contact Name">
                <Input
                  value={form.primaryContactName}
                  onChange={(event) =>
                    updateForm("primaryContactName", event.target.value)
                  }
                />
              </Field>
              <Field label="Phone Number">
                <Input
                  value={form.primaryPhoneNumber}
                  onChange={(event) =>
                    updateForm("primaryPhoneNumber", event.target.value)
                  }
                />
              </Field>
              <Field label="Phone Number 2">
                <Input
                  value={form.primaryPhoneNumber2}
                  onChange={(event) =>
                    updateForm("primaryPhoneNumber2", event.target.value)
                  }
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  aria-invalid={!emailIsValid}
                  onChange={(event) => updateForm("email", event.target.value)}
                />
                {!emailIsValid ? (
                  <p className="text-xs text-destructive">
                    Enter a valid email address.
                  </p>
                ) : null}
              </Field>
              <Field label="Website" className="md:col-span-2">
                <Input
                  value={form.website}
                  onChange={(event) => updateForm("website", event.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section title="24/7 Emergency Contact">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Emergency Contact Name">
                <Input
                  value={form.emergencyContactName}
                  onChange={(event) =>
                    updateForm("emergencyContactName", event.target.value)
                  }
                />
              </Field>
              <Field label="Emergency Phone">
                <Input
                  value={form.emergencyPhoneNumber}
                  onChange={(event) =>
                    updateForm("emergencyPhoneNumber", event.target.value)
                  }
                />
              </Field>
              <Field label="Emergency Phone 2">
                <Input
                  value={form.emergencyPhoneNumber2}
                  onChange={(event) =>
                    updateForm("emergencyPhoneNumber2", event.target.value)
                  }
                />
              </Field>
            </div>
          </Section>

          {config.showAddress ? (
            <Section title="Address">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                <Field label="Street Address" className="md:col-span-2">
                  <Input
                    value={form.streetAddress}
                    onChange={(event) =>
                      updateForm("streetAddress", event.target.value)
                    }
                  />
                </Field>
                <Field label="City">
                  <Input
                    value={form.city}
                    onChange={(event) => updateForm("city", event.target.value)}
                  />
                </Field>
                <Field label="State">
                  <Input
                    maxLength={2}
                    value={form.state}
                    onChange={(event) =>
                      updateForm("state", event.target.value.toUpperCase())
                    }
                  />
                </Field>
                <Field label="ZIP Code">
                  <Input
                    value={form.zipCode}
                    onChange={(event) =>
                      updateForm("zipCode", event.target.value)
                    }
                  />
                </Field>
              </div>
            </Section>
          ) : null}

          {config.showCoverageArea ||
          config.showBusinessHours ||
          config.showEmergencyService ||
          config.showServices ? (
            <Section title="Service Profile">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {config.showCoverageArea ? (
                  <Field label="Coverage Area">
                    <Input
                      value={form.coverageArea}
                      onChange={(event) =>
                        updateForm("coverageArea", event.target.value)
                      }
                    />
                  </Field>
                ) : null}
                {config.showBusinessHours ? (
                  <Field label="Business Hours">
                    <Input
                      value={form.businessHours}
                      onChange={(event) =>
                        updateForm("businessHours", event.target.value)
                      }
                    />
                  </Field>
                ) : null}
                {config.showEmergencyService ? (
                  <label className="flex min-h-10 items-center gap-3 border border-border px-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.emergencyService}
                      onChange={(event) =>
                        updateForm("emergencyService", event.target.checked)
                      }
                      className="h-4 w-4"
                    />
                    Provides 24/7 emergency service
                  </label>
                ) : null}
                {config.showServices ? (
                  <Field label="Services" className="md:col-span-2">
                    <Textarea
                      rows={3}
                      value={form.services}
                      onChange={(event) =>
                        updateForm("services", event.target.value)
                      }
                    />
                  </Field>
                ) : null}
              </div>
            </Section>
          ) : null}

          <Section title="Internal Management">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Tags">
                <Input
                  value={form.tags}
                  onChange={(event) => updateForm("tags", event.target.value)}
                  placeholder="Preferred, Emergency, Vendor"
                />
                <p className="text-[11px] text-muted-foreground">
                  Separate values with commas.
                </p>
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

          {mutationError ? (
            <div className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {mutationError instanceof Error
                ? mutationError.message
                : "Contact could not be saved."}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
            <div>
              {onBack ? (
                <Button type="button" variant="ghost" onClick={onBack}>
                  Back to type selection
                </Button>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isPending
                  ? "Saving…"
                  : initialData
                    ? "Save Changes"
                    : "Create Contact"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
