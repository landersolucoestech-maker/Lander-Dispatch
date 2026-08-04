import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCrmLead,
  useUpdateCrmLead,
  getListCrmLeadsQueryKey,
  getGetCrmLeadQueryKey,
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
  LEAD_TYPES,
  EDITABLE_PIPELINE_STAGES,
  LEAD_SOURCES,
  PRIORITIES,
  LEAD_TYPE_CONFIG,
  type LeadType,
  type EditablePipelineStage,
  type LeadSource,
  type Priority,
} from "../config/leadTypes";
import {
  BrokerLeadFields,
  emptyBrokerLeadData,
  type BrokerLeadData,
} from "./BrokerLeadFields";

// ── helpers ────────────────────────────────────────────────────────────────────

const nullableText = (v: string): string | null => v.trim() || null;
const nullableInt = (v: string): number | null => {
  if (!v.trim()) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};
const nullableMoney = (v: string): number | null => {
  if (!v.trim()) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
};
const nullableDecimal = (v: string): number | null => {
  if (!v.trim()) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

// ── form state ─────────────────────────────────────────────────────────────────

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

const createEmptyLeadForm = (): LeadFormState => ({
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
});

function fromLead(d: CrmLead): LeadFormState {
  const raw = d as any;
  return {
    companyName: raw.companyName ?? "",
    leadType: (raw.leadType ?? "") as LeadType | "",
    pipelineStage: (raw.pipelineStage ?? "New Lead") as EditablePipelineStage,
    leadSource: (raw.leadSource ?? "") as LeadSource | "",
    priority: (raw.priority ?? "") as Priority | "",
    rating: raw.rating != null ? String(raw.rating) : "",
    primaryContact: raw.primaryContact ?? "",
    phone: raw.phone ?? "",
    email: raw.email ?? "",
    website: raw.website ?? "",
    streetAddress: raw.streetAddress ?? "",
    city: raw.city ?? "",
    state: raw.state ?? "",
    zipCode: raw.zipCode ?? "",
    serviceTypes: Array.isArray(raw.serviceTypes) ? raw.serviceTypes.join(", ") : "",
    operatingStates: Array.isArray(raw.operatingStates) ? raw.operatingStates.join(", ") : "",
    estimatedWeeklyLoads: raw.estimatedWeeklyLoads?.toString() ?? "",
    estimatedWeeklyRevenue: raw.estimatedWeeklyRevenue?.toString() ?? "",
    nextFollowUpDate: raw.nextFollowUpDate?.slice?.(0, 10) ?? "",
    nextFollowUpTime: raw.nextFollowUpTime ?? "",
    followUpNotes: raw.followUpNotes ?? "",
    tags: Array.isArray(raw.tags) ? raw.tags.join(", ") : "",
    notes: raw.notes ?? "",
  };
}

function brokerDataFromLead(d: CrmLead): BrokerLeadData {
  const raw = d as any;
  return {
    brokerType: raw.brokerType ?? "",
    mcNumber: raw.mcNumber ?? "",
    usdotNumber: raw.usdotNumber ?? "",
    coverage: raw.coverage ?? "",
    freightTypes: raw.freightTypes ?? "",
    selectedStates: raw.selectedStates ?? "",
  };
}

// ── component ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: CrmLead;
}

export function LeadFormModal({ open, onClose, initialData }: Props) {
  const qc = useQueryClient();
  const isEdit = !!initialData;
  const createMutation = useCreateCrmLead();
  const updateMutation = useUpdateCrmLead();

  const [form, setForm] = useState<LeadFormState>(createEmptyLeadForm);
  const [brokerData, setBrokerData] = useState<BrokerLeadData>(emptyBrokerLeadData());

  useEffect(() => {
    if (initialData) {
      setForm(fromLead(initialData));
      setBrokerData(brokerDataFromLead(initialData));
    } else {
      setForm(createEmptyLeadForm());
      setBrokerData(emptyBrokerLeadData());
    }
  }, [initialData, open]);

  const set = <K extends keyof LeadFormState>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const sel = <K extends keyof LeadFormState>(k: K) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v === "__none__" ? "" : v as any }));

  function handleLeadTypeChange(value: string) {
    const leadType = (value === "__none__" ? "" : value) as LeadType | "";
    // Clear broker data when switching away from Broker
    if (leadType !== "Broker") setBrokerData(emptyBrokerLeadData());
    setForm((p) => ({ ...p, leadType }));
  }

  const splitArr = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const brokerFields = form.leadType === "Broker" ? {
      brokerType: nullableText(brokerData.brokerType),
      mcNumber: nullableText(brokerData.mcNumber),
      usdotNumber: nullableText(brokerData.usdotNumber),
      coverage: nullableText(brokerData.coverage),
      freightTypes: nullableText(brokerData.freightTypes),
      selectedStates: nullableText(brokerData.selectedStates),
    } : {
      brokerType: null, mcNumber: null, usdotNumber: null,
      coverage: null, freightTypes: null, selectedStates: null,
    };

    const payload = {
      companyName: form.companyName.trim(),
      leadType: nullableText(form.leadType),
      pipelineStage: form.pipelineStage,
      leadSource: nullableText(form.leadSource),
      priority: nullableText(form.priority),
      rating: nullableDecimal(form.rating),
      primaryContact: nullableText(form.primaryContact),
      phone: nullableText(form.phone),
      email: nullableText(form.email),
      website: nullableText(form.website),
      streetAddress: nullableText(form.streetAddress),
      city: nullableText(form.city),
      state: nullableText(form.state.toUpperCase()),
      zipCode: nullableText(form.zipCode),
      serviceTypes: splitArr(form.serviceTypes),
      operatingStates: splitArr(form.operatingStates),
      estimatedWeeklyLoads: nullableInt(form.estimatedWeeklyLoads),
      estimatedWeeklyRevenue: nullableMoney(form.estimatedWeeklyRevenue),
      nextFollowUpDate: nullableText(form.nextFollowUpDate),
      nextFollowUpTime: nullableText(form.nextFollowUpTime),
      followUpNotes: nullableText(form.followUpNotes),
      tags: splitArr(form.tags),
      notes: nullableText(form.notes),
      ...brokerFields,
    };

    const invalidate = () => {
      qc.invalidateQueries({ queryKey: getListCrmLeadsQueryKey() });
      if (initialData?.id) {
        qc.invalidateQueries({ queryKey: getGetCrmLeadQueryKey(initialData.id) });
      }
    };

    if (isEdit) {
      updateMutation.mutate(
        { leadId: initialData!.id, data: payload as any },
        { onSuccess: () => { invalidate(); onClose(); } }
      );
    } else {
      createMutation.mutate(
        { data: payload as any },
        { onSuccess: () => { invalidate(); onClose(); } }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isBroker = form.leadType === "Broker";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit Lead — ${initialData?.companyName}` : "Add Lead"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">

          {/* ── 1. Lead Information ──────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Lead Information</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div className="md:col-span-2 flex flex-col gap-1.5">
                <Label>Company Name *</Label>
                <Input required value={form.companyName} onChange={set("companyName")} placeholder="Acme Freight Inc." />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Lead Type *</Label>
                <Select value={form.leadType || "__none__"} onValueChange={handleLeadTypeChange}>
                  <SelectTrigger><SelectValue placeholder="Select lead type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select type…</SelectItem>
                    {LEAD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Pipeline Stage</Label>
                <Select
                  value={form.pipelineStage}
                  onValueChange={(v) => setForm((p) => ({ ...p, pipelineStage: v as EditablePipelineStage }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EDITABLE_PIPELINE_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Lead Source</Label>
                <Select value={form.leadSource || "__none__"} onValueChange={sel("leadSource")}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Priority</Label>
                <Select value={form.priority || "__none__"} onValueChange={sel("priority")}>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Rating (0–5)</Label>
                <Input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={set("rating")} placeholder="0.0" />
              </div>
            </div>
          </section>

          {/* ── 2. Primary Contact ───────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Primary Contact</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Contact Name</Label>
                <Input value={form.primaryContact} onChange={set("primaryContact")} placeholder="John Doe" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={set("phone")} placeholder="(555) 555-5555" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={set("email")} placeholder="contact@company.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Website</Label>
                <Input value={form.website} onChange={set("website")} placeholder="https://example.com" />
              </div>
            </div>
          </section>

          {/* ── 3. Address ───────────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Address</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <Label>Street Address</Label>
                <Input value={form.streetAddress} onChange={set("streetAddress")} placeholder="123 Main St" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>City</Label>
                <Input value={form.city} onChange={set("city")} placeholder="Houston" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))}
                  maxLength={2}
                  placeholder="TX"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>ZIP Code</Label>
                <Input value={form.zipCode} onChange={set("zipCode")} placeholder="77001" />
              </div>
            </div>
          </section>

          {/* ── 4. Demand Profile ────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Demand Profile</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <Label>Service Types <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                <Input value={form.serviceTypes} onChange={set("serviceTypes")} placeholder="Dry Van, Flatbed, Reefer…" />
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <Label>Operating States <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                <Input value={form.operatingStates} onChange={set("operatingStates")} placeholder="TX, FL, CA…" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Est. Weekly Loads</Label>
                <Input type="number" min="0" step="1" value={form.estimatedWeeklyLoads} onChange={set("estimatedWeeklyLoads")} placeholder="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Est. Weekly Revenue ($)</Label>
                <Input type="number" min="0" step="0.01" value={form.estimatedWeeklyRevenue} onChange={set("estimatedWeeklyRevenue")} placeholder="0.00" />
              </div>
            </div>
          </section>

          {/* ── 5. Type-Specific Information ─────────────────────── */}
          {isBroker && (
            <BrokerLeadFields data={brokerData} onChange={setBrokerData} />
          )}

          {/* ── 6. Follow-Up ─────────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Follow-Up</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Next Follow-Up Date</Label>
                <Input type="date" value={form.nextFollowUpDate} onChange={set("nextFollowUpDate")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Next Follow-Up Time</Label>
                <Input
                  type="time"
                  value={form.nextFollowUpTime}
                  onChange={set("nextFollowUpTime")}
                  disabled={!form.nextFollowUpDate}
                  title={!form.nextFollowUpDate ? "Set a date first" : undefined}
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <Label>Follow-Up Notes</Label>
                <Textarea value={form.followUpNotes} onChange={set("followUpNotes")} rows={2} placeholder="What to discuss…" />
              </div>
              {isEdit && (initialData as any)?.lastContact && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-muted-foreground">Last Contact</Label>
                  <p className="text-sm">{String((initialData as any).lastContact).slice(0, 10)}</p>
                </div>
              )}
            </div>
          </section>

          {/* ── 7. Internal Management ───────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Internal Management</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Tags <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                <Input value={form.tags} onChange={set("tags")} placeholder="hot-lead, referral…" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={set("notes")} rows={3} placeholder="Internal notes…" />
              </div>
            </div>
          </section>

          {/* ── Actions ──────────────────────────────────────────── */}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending || !form.companyName.trim()}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Lead"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
