import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGetCrmLeadQueryKey,
  getListCrmLeadsQueryKey,
} from "@workspace/api-client-react";
import type { CrmLead } from "@workspace/api-client-react";
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
  createLead,
  updateLead,
  type LeadMutationInput,
  type LeadRecord,
} from "../api/leads";
import {
  EDITABLE_PIPELINE_STAGES,
  LEAD_SOURCES,
  LEAD_TYPES,
  PRIORITIES,
  type EditablePipelineStage,
  type LeadSource,
  type LeadType,
  type Priority,
} from "../config/leadTypes";
import {
  BrokerLeadFields,
  emptyBrokerLeadData,
  type BrokerLeadData,
} from "./BrokerLeadFields";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: CrmLead;
}

interface LeadFormState {
  companyName: string;
  leadType: LeadType | "";
  pipelineStage: EditablePipelineStage;
  leadSource: LeadSource | "";
  priority: Priority | "";
  rating: string;
  primaryContact: string;
  phone: string;
  email: string;
  website: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  serviceTypes: string;
  operatingStates: string;
  estimatedWeeklyLoads: string;
  estimatedWeeklyRevenue: string;
  nextFollowUpDate: string;
  nextFollowUpTime: string;
  followUpNotes: string;
  tags: string;
  notes: string;
}

const EMPTY_FORM: LeadFormState = {
  companyName: "",
  leadType: "",
  pipelineStage: "New Lead",
  leadSource: "",
  priority: "",
  rating: "",
  primaryContact: "",
  phone: "",
  email: "",
  website: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  serviceTypes: "",
  operatingStates: "",
  estimatedWeeklyLoads: "",
  estimatedWeeklyRevenue: "",
  nextFollowUpDate: "",
  nextFollowUpTime: "",
  followUpNotes: "",
  tags: "",
  notes: "",
};

function isLeadType(value: string): value is LeadType {
  return (LEAD_TYPES as readonly string[]).includes(value);
}

function isPipelineStage(value: string): value is EditablePipelineStage {
  return (EDITABLE_PIPELINE_STAGES as readonly string[]).includes(value);
}

function isLeadSource(value: string): value is LeadSource {
  return (LEAD_SOURCES as readonly string[]).includes(value);
}

function isPriority(value: string): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value);
}

function optionalText(value: string): string | null {
  return value.trim() || null;
}

function optionalInteger(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

function splitValues(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function recordFromLead(lead: CrmLead): LeadRecord {
  return lead as LeadRecord;
}

function formFromLead(lead: CrmLead): LeadFormState {
  const record = recordFromLead(lead);
  return {
    companyName: record.companyName ?? "",
    leadType: record.leadType && isLeadType(record.leadType) ? record.leadType : "",
    pipelineStage:
      record.pipelineStage && isPipelineStage(record.pipelineStage)
        ? record.pipelineStage
        : "New Lead",
    leadSource:
      record.leadSource && isLeadSource(record.leadSource)
        ? record.leadSource
        : "",
    priority:
      record.priority && isPriority(record.priority) ? record.priority : "",
    rating: record.rating == null ? "" : String(record.rating),
    primaryContact: record.primaryContact ?? "",
    phone: record.phone ?? "",
    email: record.email ?? "",
    website: record.website ?? "",
    streetAddress: record.streetAddress ?? "",
    city: record.city ?? "",
    state: record.state ?? "",
    zipCode: record.zipCode ?? "",
    serviceTypes: record.serviceTypes?.join(", ") ?? "",
    operatingStates: record.operatingStates?.join(", ") ?? "",
    estimatedWeeklyLoads:
      record.estimatedWeeklyLoads == null
        ? ""
        : String(record.estimatedWeeklyLoads),
    estimatedWeeklyRevenue:
      record.estimatedWeeklyRevenue == null
        ? ""
        : String(record.estimatedWeeklyRevenue),
    nextFollowUpDate: record.nextFollowUpDate?.slice(0, 10) ?? "",
    nextFollowUpTime: record.nextFollowUpTime ?? "",
    followUpNotes: record.followUpNotes ?? "",
    tags: record.tags?.join(", ") ?? "",
    notes: record.notes ?? "",
  };
}

function brokerFromLead(lead: CrmLead): BrokerLeadData {
  const record = recordFromLead(lead);
  return {
    brokerType: record.brokerType ?? "",
    mcNumber: record.mcNumber ?? "",
    usdotNumber: record.usdotNumber ?? "",
    coverage: record.coverage ?? "",
    freightTypes: record.freightTypes ?? "",
    selectedStates: record.selectedStates ?? "",
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

export function LeadFormModal({ open, onClose, initialData }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LeadFormState>(EMPTY_FORM);
  const [brokerData, setBrokerData] = useState<BrokerLeadData>(
    emptyBrokerLeadData(),
  );

  useEffect(() => {
    if (initialData) {
      setForm(formFromLead(initialData));
      setBrokerData(brokerFromLead(initialData));
    } else {
      setForm(EMPTY_FORM);
      setBrokerData(emptyBrokerLeadData());
    }
  }, [initialData, open]);

  const createMutation = useMutation({ mutationFn: createLead });
  const updateMutation = useMutation({
    mutationFn: ({
      leadId,
      data,
    }: {
      leadId: string;
      data: LeadMutationInput;
    }) => updateLead(leadId, data),
  });

  const updateForm = <K extends keyof LeadFormState>(
    field: K,
    value: LeadFormState[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleLeadTypeChange = (value: string) => {
    const leadType = isLeadType(value) ? value : "";
    if (leadType !== "Broker") setBrokerData(emptyBrokerLeadData());
    updateForm("leadType", leadType);
  };

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: getListCrmLeadsQueryKey(),
    });
    if (initialData?.id) {
      await queryClient.invalidateQueries({
        queryKey: getGetCrmLeadQueryKey(initialData.id),
      });
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.companyName.trim() || !form.leadType) return;

    const isBroker = form.leadType === "Broker";
    const payload: LeadMutationInput = {
      companyName: form.companyName.trim(),
      leadType: form.leadType,
      pipelineStage: form.pipelineStage,
      leadSource: form.leadSource || null,
      priority: form.priority || null,
      rating: optionalNumber(form.rating),
      primaryContact: optionalText(form.primaryContact),
      phone: optionalText(form.phone),
      email: optionalText(form.email),
      website: optionalText(form.website),
      streetAddress: optionalText(form.streetAddress),
      city: optionalText(form.city),
      state: optionalText(form.state.toUpperCase()),
      zipCode: optionalText(form.zipCode),
      serviceTypes: splitValues(form.serviceTypes),
      operatingStates: splitValues(form.operatingStates),
      estimatedWeeklyLoads: optionalInteger(form.estimatedWeeklyLoads),
      estimatedWeeklyRevenue: optionalNumber(form.estimatedWeeklyRevenue),
      nextFollowUpDate: optionalText(form.nextFollowUpDate),
      nextFollowUpTime: optionalText(form.nextFollowUpTime),
      followUpNotes: optionalText(form.followUpNotes),
      tags: splitValues(form.tags),
      notes: optionalText(form.notes),
      brokerType: isBroker ? optionalText(brokerData.brokerType) : null,
      mcNumber: isBroker ? optionalText(brokerData.mcNumber) : null,
      usdotNumber: isBroker ? optionalText(brokerData.usdotNumber) : null,
      coverage: isBroker ? optionalText(brokerData.coverage) : null,
      freightTypes: isBroker ? optionalText(brokerData.freightTypes) : null,
      selectedStates: isBroker ? optionalText(brokerData.selectedStates) : null,
    };

    const onSuccess = async () => {
      await invalidate();
      onClose();
    };

    if (initialData) {
      updateMutation.mutate(
        { leadId: initialData.id, data: payload },
        { onSuccess },
      );
      return;
    }

    createMutation.mutate(payload, { onSuccess });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error;
  const emailIsValid =
    !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const canSubmit =
    Boolean(form.companyName.trim()) &&
    Boolean(form.leadType) &&
    emailIsValid &&
    !isPending;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[94vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {initialData
              ? `Edit Lead — ${initialData.companyName}`
              : "Create Lead"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="border border-blue-500/25 bg-blue-500/5 p-3 text-sm text-muted-foreground">
            Leads represent potential demand sources. Carrier is not an allowed
            Lead type and remains exclusively in Contacts.
          </div>

          <Section
            title="Lead Information"
            description="Demand-source classification and pipeline qualification."
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
              <Field label="Lead Type *">
                <Select
                  value={form.leadType || "__none__"}
                  onValueChange={handleLeadTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select type…</SelectItem>
                    {LEAD_TYPES.map((leadType) => (
                      <SelectItem key={leadType} value={leadType}>
                        {leadType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Pipeline Stage">
                <Select
                  value={form.pipelineStage}
                  onValueChange={(value) => {
                    if (isPipelineStage(value)) {
                      updateForm("pipelineStage", value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDITABLE_PIPELINE_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Lead Source">
                <Select
                  value={form.leadSource || "__none__"}
                  onValueChange={(value) =>
                    updateForm(
                      "leadSource",
                      isLeadSource(value) ? value : "",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    {LEAD_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Priority">
                <Select
                  value={form.priority || "__none__"}
                  onValueChange={(value) =>
                    updateForm("priority", isPriority(value) ? value : "")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
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
            </div>
          </Section>

          <Section title="Primary Contact">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Contact Name">
                <Input
                  value={form.primaryContact}
                  onChange={(event) =>
                    updateForm("primaryContact", event.target.value)
                  }
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value)}
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
              <Field label="Website">
                <Input
                  value={form.website}
                  onChange={(event) => updateForm("website", event.target.value)}
                />
              </Field>
            </div>
          </Section>

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
                  onChange={(event) => updateForm("zipCode", event.target.value)}
                />
              </Field>
            </div>
          </Section>

          {form.leadType === "Broker" ? (
            <Section
              title="Broker Prospect Details"
              description="Lightweight prospect fields only; payment and onboarding belong to the Broker record after conversion."
            >
              <BrokerLeadFields data={brokerData} onChange={setBrokerData} />
            </Section>
          ) : null}

          <Section
            title="Demand Profile"
            description="Expected volume and operating scope for generating carrier demand."
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Service Types" className="md:col-span-2">
                <Input
                  value={form.serviceTypes}
                  onChange={(event) =>
                    updateForm("serviceTypes", event.target.value)
                  }
                  placeholder="Dealer Transfers, Auction Pickup"
                />
                <p className="text-[11px] text-muted-foreground">
                  Separate values with commas.
                </p>
              </Field>
              <Field label="Operating States" className="md:col-span-2">
                <Input
                  value={form.operatingStates}
                  onChange={(event) =>
                    updateForm(
                      "operatingStates",
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="FL, GA, SC"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use two-letter state codes separated by commas.
                </p>
              </Field>
              <Field label="Estimated Weekly Loads">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.estimatedWeeklyLoads}
                  onChange={(event) =>
                    updateForm("estimatedWeeklyLoads", event.target.value)
                  }
                />
              </Field>
              <Field label="Estimated Weekly Revenue">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.estimatedWeeklyRevenue}
                  onChange={(event) =>
                    updateForm("estimatedWeeklyRevenue", event.target.value)
                  }
                />
              </Field>
            </div>
          </Section>

          <Section title="Follow-Up">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Next Follow-Up Date">
                <Input
                  type="date"
                  value={form.nextFollowUpDate}
                  onChange={(event) =>
                    updateForm("nextFollowUpDate", event.target.value)
                  }
                />
              </Field>
              <Field label="Next Follow-Up Time">
                <Input
                  type="time"
                  value={form.nextFollowUpTime}
                  onChange={(event) =>
                    updateForm("nextFollowUpTime", event.target.value)
                  }
                />
              </Field>
              <Field label="Follow-Up Notes" className="md:col-span-2">
                <Textarea
                  rows={3}
                  value={form.followUpNotes}
                  onChange={(event) =>
                    updateForm("followUpNotes", event.target.value)
                  }
                />
              </Field>
            </div>
          </Section>

          <Section title="Internal Management">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Tags">
                <Input
                  value={form.tags}
                  onChange={(event) => updateForm("tags", event.target.value)}
                  placeholder="High volume, Referral"
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
                : "Lead could not be saved."}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isPending
                ? "Saving…"
                : initialData
                  ? "Save Changes"
                  : "Create Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
