/**
 * ContactFormModal — switcher between type-specific forms
 * Carrier → CarrierContactForm (9 sections)
 * Broker  → BrokerContactForm  (7 sections)
 * Other   → GenericContactForm
 */
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCrmContact,
  useUpdateCrmContact,
  getListCrmContactsQueryKey,
  getGetCrmContactQueryKey,
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
import { Switch } from "@/shared/components/ui/switch";
import {
  CONTACT_TYPES,
  CONTACT_TYPE_CONFIG,
  type ContactType,
} from "../config/contactTypes";
import { X } from "lucide-react";
import { CarrierContactForm } from "./CarrierContactForm";
import { BrokerContactForm } from "./BrokerContactForm";
import { DriverFormModal } from "./DriverFormModal";

// ── TagChips ──────────────────────────────────────────────────────────────────
function TagChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [raw, setRaw] = useState("");
  const add = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = raw.trim().replace(/,+$/, "");
      if (tag && !value.includes(tag)) onChange([...value, tag]);
      setRaw("");
    }
  };
  return (
    <div className="flex flex-wrap gap-1.5 border border-input rounded-md px-2 py-1.5 min-h-[38px]">
      {value.map((t) => (
        <span key={t} className="flex items-center gap-1 bg-muted text-xs px-2 py-0.5 rounded-full font-mono">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
        </span>
      ))}
      <input
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onKeyDown={add}
        placeholder={value.length ? "" : "Add tag, press Enter…"}
        className="flex-1 min-w-[100px] bg-transparent text-sm outline-none"
      />
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────────

const nt = (v: string): string | null => v.trim() || null;
const nn = (v: string): number | null => { const n = Number(v); return Number.isFinite(n) ? n : null; };

// ── generic form state ────────────────────────────────────────────────────────
// Spec section 10: phoneNumber/phoneNumber2 map to primaryPhoneNumber/primaryPhoneNumber2 in DB
// servicesProvided maps to services column in DB

interface GenericForm {
  companyName: string;
  contactType: ContactType | "";
  status: "Active" | "Inactive" | "Blocked";
  rating: string;
  // 10.2 Primary Contact — no "name" for generic; just phones + emergency
  phoneNumber: string;
  phoneNumber2: string;
  email: string;
  emergencyContactName: string;
  emergencyPhoneNumber: string;
  emergencyPhoneNumber2: string;
  // 10.3 Website and Address
  website: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  // 10.4 Service Profile
  coverageArea: string;
  businessHours: string;
  emergencyService: boolean;
  servicesProvided: string;
  tags: string[];
  notes: string;
}

const emptyGeneric = (): GenericForm => ({
  companyName: "", contactType: "", status: "Active", rating: "",
  phoneNumber: "", phoneNumber2: "", email: "",
  emergencyContactName: "", emergencyPhoneNumber: "", emergencyPhoneNumber2: "",
  website: "", streetAddress: "", city: "", state: "", zipCode: "",
  coverageArea: "", businessHours: "", emergencyService: false,
  servicesProvided: "", tags: [], notes: "",
});

function fromContact(d: CrmContact): GenericForm {
  const a = d as any;
  return {
    companyName: d.companyName ?? "",
    contactType: (d.contactType as ContactType) ?? "",
    status: (d.status as GenericForm["status"]) ?? "Active",
    rating: d.rating != null ? String(d.rating) : "",
    phoneNumber: d.primaryPhoneNumber ?? "",
    phoneNumber2: d.primaryPhoneNumber2 ?? "",
    email: d.email ?? "",
    emergencyContactName: d.emergencyContactName ?? "",
    emergencyPhoneNumber: d.emergencyPhoneNumber ?? "",
    emergencyPhoneNumber2: d.emergencyPhoneNumber2 ?? "",
    website: a.website ?? "",
    streetAddress: a.streetAddress ?? "",
    city: a.city ?? "",
    state: a.state ?? "",
    zipCode: a.zipCode ?? "",
    coverageArea: a.coverageArea ?? "",
    businessHours: a.businessHours ?? "",
    emergencyService: a.emergencyService ?? false,
    servicesProvided: a.services ?? "",
    tags: Array.isArray(a.tags) ? a.tags : [],
    notes: a.notes ?? "",
  };
}

// ── main component ────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: CrmContact;
}

export function ContactFormModal({ open, onClose, initialData }: Props) {
  // For new contacts the user first picks a type; for edit we already know it
  const [pendingType, setPendingType] = useState<string>("");

  useEffect(() => {
    if (!open) setPendingType("");
  }, [open]);

  // Resolve which form to show
  const resolvedType = (initialData?.contactType as string | undefined) || pendingType;

  if (resolvedType === "Carrier") {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <CarrierContactForm
            initialData={initialData as any}
            onClose={onClose}
            onBack={initialData ? undefined : () => setPendingType("")}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (resolvedType === "Broker") {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <BrokerContactForm
            initialData={initialData as any}
            onClose={onClose}
            onBack={initialData ? undefined : () => setPendingType("")}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (resolvedType === "Driver") {
    return (
      <DriverFormModal
        open={open}
        onClose={onClose}
        onBack={initialData ? undefined : () => setPendingType("")}
      />
    );
  }

  // Generic form (all other types) — includes the type selector for new contacts
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <GenericContactForm
          initialData={initialData}
          pendingType={pendingType}
          onPendingTypeChange={setPendingType}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

// ── generic form ──────────────────────────────────────────────────────────────

interface GenericProps {
  initialData?: CrmContact;
  pendingType: string;
  onPendingTypeChange: (t: string) => void;
  onClose: () => void;
}

function GenericContactForm({ initialData, pendingType, onPendingTypeChange, onClose }: GenericProps) {
  const qc = useQueryClient();
  const isEdit = !!initialData;
  const createMutation = useCreateCrmContact();
  const updateMutation = useUpdateCrmContact();

  const [form, setForm] = useState<GenericForm>(initialData ? fromContact(initialData) : {
    ...emptyGeneric(),
    contactType: (pendingType as ContactType) || "",
  });

  useEffect(() => {
    setForm(initialData ? fromContact(initialData) : { ...emptyGeneric(), contactType: (pendingType as ContactType) || "" });
  }, [initialData, open]);

  const set = <K extends keyof GenericForm>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const sel = <K extends keyof GenericForm>(k: K) => (v: string) =>
    setForm((p) => ({ ...p, [k]: (v === "__none__" ? "" : v) as GenericForm[K] }));

  function handleTypeChange(value: string) {
    const ct = value === "__none__" ? "" : value;
    // If switching to Carrier or Broker, bubble up so the switcher takes over
    if (ct === "Carrier" || ct === "Broker") {
      onPendingTypeChange(ct);
      return;
    }
    const config = ct ? CONTACT_TYPE_CONFIG[ct as ContactType] : undefined;
    setForm((prev) => ({
      ...prev,
      contactType: ct as ContactType,
      coverageArea: config?.showCoverageArea ? prev.coverageArea : "",
      businessHours: config?.showBusinessHours ? prev.businessHours : "",
      emergencyService: config?.showEmergencyService ? prev.emergencyService : false,
      servicesProvided: config?.showServices ? prev.servicesProvided : "",
    }));
  }

  const config = form.contactType ? CONTACT_TYPE_CONFIG[form.contactType as ContactType] : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      companyName: form.companyName.trim(),
      contactType: nt(form.contactType) ?? undefined,
      status: form.status,
      rating: nn(form.rating) ?? undefined,
      primaryPhoneNumber: nt(form.phoneNumber),
      primaryPhoneNumber2: nt(form.phoneNumber2),
      email: nt(form.email),
      emergencyContactName: nt(form.emergencyContactName),
      emergencyPhoneNumber: nt(form.emergencyPhoneNumber),
      emergencyPhoneNumber2: nt(form.emergencyPhoneNumber2),
      website: nt(form.website),
      streetAddress: nt(form.streetAddress),
      city: nt(form.city),
      state: nt(form.state),
      zipCode: nt(form.zipCode),
      coverageArea: config?.showCoverageArea ? nt(form.coverageArea) : null,
      businessHours: config?.showBusinessHours ? nt(form.businessHours) : null,
      emergencyService: config?.showEmergencyService ? form.emergencyService : false,
      services: config?.showServices ? nt(form.servicesProvided) : null,
      tags: form.tags,
      notes: nt(form.notes),
    };

    const invalidate = () => {
      qc.invalidateQueries({ queryKey: getListCrmContactsQueryKey() });
      if (initialData?.id) qc.invalidateQueries({ queryKey: getGetCrmContactQueryKey(initialData.id) });
    };

    if (isEdit) {
      updateMutation.mutate({ contactId: initialData!.id, data: payload as any },
        { onSuccess: () => { invalidate(); onClose(); } });
    } else {
      createMutation.mutate({ data: payload as any },
        { onSuccess: () => { invalidate(); onClose(); } });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? `Edit Contact — ${initialData?.companyName}` : "Add Contact"}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="mt-2 space-y-0">

        {/* ── 10.1 Identification ── */}
        <div className="border-t border-border pt-4 mb-4">
          <p className="text-sm font-semibold text-foreground">Identification</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 mb-4">
          <div className="md:col-span-4 flex flex-col gap-1.5">
            <Label>Company Name *</Label>
            <Input required value={form.companyName} onChange={set("companyName")} placeholder="Quick Fix Repairs LLC" />
          </div>
          <div className="md:col-span-4 flex flex-col gap-1.5">
            <Label>Contact Type *</Label>
            <Select value={form.contactType || "__none__"} onValueChange={handleTypeChange}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select type…</SelectItem>
                {CONTACT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4 flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as GenericForm["status"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── 10.2 Primary Contact ── */}
        <div className="border-t border-border pt-4 mb-4">
          <p className="text-sm font-semibold text-foreground">Primary Contact</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 mb-4">
          <div className="md:col-span-4 flex flex-col gap-1.5"><Label>Phone Number</Label><Input type="tel" value={form.phoneNumber} onChange={set("phoneNumber")} placeholder="(555) 555-5555" /></div>
          <div className="md:col-span-4 flex flex-col gap-1.5"><Label>Phone Number 2</Label><Input type="tel" value={form.phoneNumber2} onChange={set("phoneNumber2")} /></div>
          <div className="md:col-span-4 flex flex-col gap-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={set("email")} /></div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 mb-4">
          <div className="md:col-span-4 flex flex-col gap-1.5"><Label>Emergency Contact</Label><Input value={form.emergencyContactName} onChange={set("emergencyContactName")} /></div>
          <div className="md:col-span-4 flex flex-col gap-1.5"><Label>Emergency Phone</Label><Input type="tel" value={form.emergencyPhoneNumber} onChange={set("emergencyPhoneNumber")} /></div>
          <div className="md:col-span-4 flex flex-col gap-1.5"><Label>Emergency Phone 2</Label><Input type="tel" value={form.emergencyPhoneNumber2} onChange={set("emergencyPhoneNumber2")} /></div>
        </div>

        {/* ── 10.3 Website and Address ── */}
        {(!config || config.showAddress) && (
          <>
            <div className="border-t border-border pt-4 mb-4">
              <p className="text-sm font-semibold text-foreground">Website and Address</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 mb-4">
              <div className="md:col-span-6 flex flex-col gap-1.5"><Label>Website</Label><Input type="url" value={form.website} onChange={set("website")} placeholder="https://…" /></div>
              <div className="md:col-span-6 flex flex-col gap-1.5"><Label>Street Address</Label><Input value={form.streetAddress} onChange={set("streetAddress")} /></div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 mb-4">
              <div className="md:col-span-4 flex flex-col gap-1.5"><Label>City</Label><Input value={form.city} onChange={set("city")} /></div>
              <div className="md:col-span-4 flex flex-col gap-1.5"><Label>State</Label>
                <Input value={form.state} maxLength={2} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="TX" />
              </div>
              <div className="md:col-span-4 flex flex-col gap-1.5"><Label>ZIP Code</Label><Input value={form.zipCode} onChange={set("zipCode")} /></div>
            </div>
          </>
        )}

        {/* ── 10.4 Service Profile ── */}
        {config && (config.showCoverageArea || config.showBusinessHours || config.showEmergencyService || config.showServices) && (
          <>
            <div className="border-t border-border pt-4 mb-4">
              <p className="text-sm font-semibold text-foreground">Service Profile</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 mb-4">
              {config.showCoverageArea && <div className="md:col-span-4 flex flex-col gap-1.5"><Label>Coverage Area</Label><Input value={form.coverageArea} onChange={set("coverageArea")} /></div>}
              {config.showBusinessHours && <div className="md:col-span-4 flex flex-col gap-1.5"><Label>Business Hours</Label><Input value={form.businessHours} onChange={set("businessHours")} /></div>}
              {config.showEmergencyService && (
                <div className="md:col-span-4 flex items-center gap-3 pt-5">
                  <Switch id="es" checked={form.emergencyService} onCheckedChange={(v) => setForm((p) => ({ ...p, emergencyService: v }))} />
                  <Label htmlFor="es" className="cursor-pointer">24/7 Emergency</Label>
                </div>
              )}
            </div>
            {config.showServices && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12 mb-4">
                <div className="md:col-span-12 flex flex-col gap-1.5"><Label>Services Provided</Label>
                  <Textarea rows={2} value={form.servicesProvided} onChange={set("servicesProvided")} />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Tags and Notes ── */}
        <div className="border-t border-border pt-4 mb-4">
          <p className="text-sm font-semibold text-foreground">Internal</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 mb-4">
          <div className="md:col-span-4 flex flex-col gap-1.5">
            <Label>Rating (0–5)</Label>
            <Input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={set("rating")} placeholder="0.0" />
          </div>
          <div className="md:col-span-8 flex flex-col gap-1.5">
            <Label>Tags</Label>
            <TagChips value={form.tags} onChange={tags => setForm(p => ({ ...p, tags }))} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 mb-4">
          <div className="md:col-span-12 flex flex-col gap-1.5"><Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={set("notes")} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending || !form.companyName.trim()}>
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Contact"}
          </Button>
        </div>
      </form>
    </>
  );
}
