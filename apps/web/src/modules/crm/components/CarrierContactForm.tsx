/**
 * CarrierContactForm — Spec sections 4.1–8
 * Layout: md:grid-cols-12 · 3-col rows use col-span-4 · 2-col rows use col-span-6
 */
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCrmContact, useUpdateCrmContact,
  getListCrmContactsQueryKey, getGetCrmContactQueryKey,
} from "@workspace/api-client-react";
import { DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { ChevronDown, ChevronUp, Copy, Plus, Trash2, X } from "lucide-react";
import type { FleetEquipment } from "@workspace/db";

// ── Constants ──────────────────────────────────────────────────────────────────
const CARRIER_TYPES = ["Open Trailer", "Enclosed Trailer", "Hotshot", "Flatbed", "Reefer / Refrigerated", "Box Truck", "Lowboy", "Step Deck", "Other"];
const AUTHORITY_STATUSES = ["Active", "Inactive", "Pending", "Suspended", "Revoked"];
const STATUSES = ["Active", "Inactive", "Blocked"];
const PAYMENT_TERMS_OPTS = ["Due on Receipt", "Net 7", "Net 15", "Net 30", "Net 45", "Custom"];
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const nt = (v: string) => v.trim() || null;
const nn = (v: string) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const ni = (v: string) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };

// ── Layout helpers ────────────────────────────────────────────────────────────
function Row3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-12 mb-4">{children}</div>;
}
function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-12 mb-4">{children}</div>;
}
function C4({ children }: { children: React.ReactNode }) {
  return <div className="md:col-span-4 flex flex-col gap-1.5">{children}</div>;
}
function C6({ children }: { children: React.ReactNode }) {
  return <div className="md:col-span-6 flex flex-col gap-1.5">{children}</div>;
}
function SH({ title }: { title: string }) {
  return (
    <div className="border-t border-border pt-4 mb-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
  );
}

// ── Compact multiselect (for operatingStates in 4-col context) ────────────────
function CompactMultiSelect({ label, options, value, onChange }: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="flex flex-col gap-1.5 relative" ref={ref}>
      <Label className="text-sm">{label}</Label>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="h-10 px-3 border border-border rounded-md text-sm text-left bg-card hover:bg-muted flex items-center justify-between">
        <span className={value.length === 0 ? "text-muted-foreground" : ""}>
          {value.length === 0 ? "Select states…" : `${value.length} selected`}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 border border-border bg-card rounded-md shadow-lg max-h-56 overflow-y-auto">
          <div className="grid grid-cols-5 gap-0.5 p-2">
            {options.map(o => (
              <label key={o} className="flex items-center gap-1 px-0.5 py-0.5 hover:bg-muted rounded text-[11px] cursor-pointer">
                <input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} className="w-3 h-3" />
                {o}
              </label>
            ))}
          </div>
        </div>
      )}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {value.map(v => (
            <span key={v} className="text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded flex items-center gap-0.5">
              {v}<button type="button" onClick={() => toggle(v)}><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Fleet Equipment ──────────────────────────────────────────────────────────
type FleetItem = FleetEquipment & { _collapsed: boolean };

function newEquipment(): FleetItem {
  return {
    id: crypto.randomUUID(), _collapsed: false,
    truckYear: "", truckMake: "", truckModel: "", truckVin: "", truckColor: "", truckPlate: "",
    trailerYear: "", trailerMake: "", trailerModel: "", trailerVin: "", trailerColor: "", trailerPlate: "",
    assignedDriverId: undefined,
    assignedDriverName: "", assignedDriverPhoneNumber: "", assignedDriverPhoneNumber2: "",
    assignedDriverEmergencyContactName: "", assignedDriverEmergencyPhoneNumber: "",
    assignedDriverEmergencyPhoneNumber2: "", assignedDriverEmail: "",
  };
}

// ── Form state ────────────────────────────────────────────────────────────────
interface CF {
  companyName: string; carrierType: string; status: string; rating: string; notes: string;
  primaryContactName: string; primaryPhoneNumber: string; primaryPhoneNumber2: string;
  emergencyContactName: string; emergencyPhoneNumber: string; emergencyPhoneNumber2: string;
  email: string; website: string;
  usdotNumber: string; mcNumber: string; einNumber: string; authorityStatus: string; insuranceExpiration: string;
  companyAddress: string; companyCity: string; companyState: string; companyZipCode: string;
  operatingStates: string[]; weeklyMinimumAmount: string; totalTripsPerWeek: string;
  ratePerMile: string; paymentTerms: string;
  factoringCompany: string; factoringFee: string;
  bankName: string; accountHolder: string; accountNumber: string; routingNumber: string;
  bankAddress: string; bankCity: string; bankState: string; bankZipCode: string;
  zelleAccount: string; cashAppAccount: string;
}

const empty = (): CF => ({
  companyName: "", carrierType: "", status: "Active", rating: "", notes: "",
  primaryContactName: "", primaryPhoneNumber: "", primaryPhoneNumber2: "",
  emergencyContactName: "", emergencyPhoneNumber: "", emergencyPhoneNumber2: "",
  email: "", website: "",
  usdotNumber: "", mcNumber: "", einNumber: "", authorityStatus: "", insuranceExpiration: "",
  companyAddress: "", companyCity: "", companyState: "", companyZipCode: "",
  operatingStates: [], weeklyMinimumAmount: "", totalTripsPerWeek: "", ratePerMile: "", paymentTerms: "",
  factoringCompany: "", factoringFee: "",
  bankName: "", accountHolder: "", accountNumber: "", routingNumber: "",
  bankAddress: "", bankCity: "", bankState: "", bankZipCode: "",
  zelleAccount: "", cashAppAccount: "",
});

function fromRaw(d: Record<string, any>): CF {
  const s = (v: any) => v ?? "";
  return {
    companyName: s(d.companyName), carrierType: s(d.carrierType), status: s(d.status) || "Active",
    rating: d.rating != null ? String(d.rating) : "", notes: s(d.notes),
    primaryContactName: s(d.primaryContactName), primaryPhoneNumber: s(d.primaryPhoneNumber),
    primaryPhoneNumber2: s(d.primaryPhoneNumber2),
    emergencyContactName: s(d.emergencyContactName), emergencyPhoneNumber: s(d.emergencyPhoneNumber),
    emergencyPhoneNumber2: s(d.emergencyPhoneNumber2),
    email: s(d.email), website: s(d.website),
    usdotNumber: s(d.usdotNumber), mcNumber: s(d.mcNumber), einNumber: s(d.einNumber),
    authorityStatus: s(d.authorityStatus), insuranceExpiration: s(d.insuranceExpiration),
    companyAddress: s(d.companyAddress), companyCity: s(d.companyCity),
    companyState: s(d.companyState), companyZipCode: s(d.companyZipCode),
    operatingStates: Array.isArray(d.operatingStates) ? d.operatingStates : [],
    weeklyMinimumAmount: d.weeklyMinimumAmount != null ? String(d.weeklyMinimumAmount) : "",
    totalTripsPerWeek: d.totalTripsPerWeek != null ? String(d.totalTripsPerWeek) : "",
    ratePerMile: d.ratePerMile != null ? String(d.ratePerMile) : "",
    paymentTerms: s(d.paymentTerms),
    factoringCompany: s(d.factoringCompany), factoringFee: d.factoringFee != null ? String(d.factoringFee) : "",
    bankName: s(d.bankName), accountHolder: s(d.accountHolder),
    accountNumber: s(d.accountNumber), routingNumber: s(d.routingNumber),
    bankAddress: s(d.bankAddress), bankCity: s(d.bankCity),
    bankState: s(d.bankState), bankZipCode: s(d.bankZipCode),
    zelleAccount: s(d.zelleAccount), cashAppAccount: s(d.cashAppAccount),
  };
}

// ── Component ──────────────────────────────────────────────────────────────────
interface Props {
  initialData?: Record<string, any>;
  onClose: () => void;
  onBack?: () => void;
}

export function CarrierContactForm({ initialData, onClose, onBack }: Props) {
  const qc = useQueryClient();
  const isEdit = !!initialData?.id;
  const createMut = useCreateCrmContact();
  const updateMut = useUpdateCrmContact();

  const [form, setForm] = useState<CF>(initialData ? fromRaw(initialData) : empty());
  const [fleet, setFleet] = useState<FleetItem[]>(() =>
    (Array.isArray(initialData?.fleetEquipment) ? initialData!.fleetEquipment : [])
      .map((e: FleetEquipment) => ({ ...newEquipment(), ...e, _collapsed: false }))
  );

  useEffect(() => {
    setForm(initialData ? fromRaw(initialData) : empty());
    setFleet((Array.isArray(initialData?.fleetEquipment) ? initialData!.fleetEquipment : [])
      .map((e: FleetEquipment) => ({ ...newEquipment(), ...e, _collapsed: false })));
  }, [initialData]);

  const s = (k: keyof CF) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));
  const sel = (k: keyof CF) => (v: string) => setForm(p => ({ ...p, [k]: v === "__none__" ? "" : v }));
  const up = (v: string) => v.toUpperCase();

  // Fleet helpers
  const addEq = () => setFleet(p => [...p, newEquipment()]);
  const removeEq = (i: number) => { if (!window.confirm(`Remove Equipment ${i + 1}?`)) return; setFleet(p => p.filter((_, j) => j !== i)); };
  const dupEq = (i: number) => setFleet(p => { const c = [...p]; c.splice(i + 1, 0, { ...p[i], id: crypto.randomUUID(), _collapsed: false }); return c; });
  const toggleEq = (i: number) => setFleet(p => p.map((e, j) => j === i ? { ...e, _collapsed: !e._collapsed } : e));
  const setEqField = (i: number, k: keyof FleetEquipment, v: string) =>
    setFleet(p => { const n = [...p]; (n[i] as any)[k] = v; return n; });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {
      companyName: form.companyName.trim(), contactType: "Carrier",
      carrierType: nt(form.carrierType), status: form.status,
      rating: nn(form.rating) ?? undefined, notes: nt(form.notes),
      primaryContactName: nt(form.primaryContactName),
      primaryPhoneNumber: nt(form.primaryPhoneNumber),
      primaryPhoneNumber2: nt(form.primaryPhoneNumber2),
      emergencyContactName: nt(form.emergencyContactName),
      emergencyPhoneNumber: nt(form.emergencyPhoneNumber),
      emergencyPhoneNumber2: nt(form.emergencyPhoneNumber2),
      email: nt(form.email), website: nt(form.website),
      usdotNumber: nt(form.usdotNumber), mcNumber: nt(form.mcNumber), einNumber: nt(form.einNumber),
      authorityStatus: nt(form.authorityStatus), insuranceExpiration: nt(form.insuranceExpiration),
      companyAddress: nt(form.companyAddress), companyCity: nt(form.companyCity),
      companyState: nt(form.companyState), companyZipCode: nt(form.companyZipCode),
      operatingStates: form.operatingStates,
      weeklyMinimumAmount: nn(form.weeklyMinimumAmount) ?? undefined,
      totalTripsPerWeek: ni(form.totalTripsPerWeek) ?? undefined,
      ratePerMile: nn(form.ratePerMile) ?? undefined,
      paymentTerms: nt(form.paymentTerms),
      factoringCompany: nt(form.factoringCompany),
      factoringFee: nn(form.factoringFee) ?? undefined,
      bankName: nt(form.bankName), accountHolder: nt(form.accountHolder),
      accountNumber: nt(form.accountNumber), routingNumber: nt(form.routingNumber),
      bankAddress: nt(form.bankAddress), bankCity: nt(form.bankCity),
      bankState: nt(form.bankState), bankZipCode: nt(form.bankZipCode),
      zelleAccount: nt(form.zelleAccount), cashAppAccount: nt(form.cashAppAccount),
      fleetEquipment: fleet.map(({ _collapsed: _, ...rest }) => rest),
    };
    const inv = () => {
      qc.invalidateQueries({ queryKey: getListCrmContactsQueryKey() });
      if (isEdit) qc.invalidateQueries({ queryKey: getGetCrmContactQueryKey(initialData!.id) });
    };
    if (isEdit) {
      updateMut.mutate({ contactId: initialData!.id, data: payload as any }, { onSuccess: () => { inv(); onClose(); } });
    } else {
      createMut.mutate({ data: payload as any }, { onSuccess: () => { inv(); onClose(); } });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;
  const err = createMut.error || updateMut.error;

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          {onBack && <Button type="button" variant="ghost" size="sm" onClick={onBack} className="text-xs text-muted-foreground">← Back</Button>}
          <DialogTitle>{isEdit ? `Edit Carrier — ${initialData?.companyName}` : "Add Carrier Contact"}</DialogTitle>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="mt-2">

        {/* ── 4.1 Company Information ── */}
        <SH title="Company Information" />
        <Row3>
          <C4><Label className="text-sm">Company Name *</Label><Input required value={form.companyName} onChange={s("companyName")} placeholder="ABC Transport LLC" /></C4>
          <C4><Label className="text-sm">Carrier Type *</Label>
            <Select value={form.carrierType || "__none__"} onValueChange={sel("carrierType")}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent><SelectItem value="__none__">—</SelectItem>{CARRIER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </C4>
          <C4><Label className="text-sm">Status *</Label>
            <Select value={form.status} onValueChange={sel("status")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </C4>
        </Row3>
        <Row2>
          <C6><Label className="text-sm">Rating (0–5)</Label><Input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={s("rating")} placeholder="0.0" /></C6>
          <C6><Label className="text-sm">Notes</Label><Textarea rows={3} value={form.notes} onChange={s("notes")} /></C6>
        </Row2>

        {/* ── 4.2 Primary and Emergency Contact ── */}
        <SH title="Primary and Emergency Contact" />
        <Row3>
          <C4><Label className="text-sm">Primary Contact</Label><Input value={form.primaryContactName} onChange={s("primaryContactName")} placeholder="John Doe" /></C4>
          <C4><Label className="text-sm">Phone Number</Label><Input type="tel" value={form.primaryPhoneNumber} onChange={s("primaryPhoneNumber")} placeholder="(555) 555-5555" /></C4>
          <C4><Label className="text-sm">Phone Number 2</Label><Input type="tel" value={form.primaryPhoneNumber2} onChange={s("primaryPhoneNumber2")} /></C4>
        </Row3>
        <Row3>
          <C4><Label className="text-sm">Emergency Contact</Label><Input value={form.emergencyContactName} onChange={s("emergencyContactName")} placeholder="Jane Doe" /></C4>
          <C4><Label className="text-sm">Phone Number</Label><Input type="tel" value={form.emergencyPhoneNumber} onChange={s("emergencyPhoneNumber")} /></C4>
          <C4><Label className="text-sm">Phone Number 2</Label><Input type="tel" value={form.emergencyPhoneNumber2} onChange={s("emergencyPhoneNumber2")} /></C4>
        </Row3>
        <Row2>
          <C6><Label className="text-sm">Email</Label><Input type="email" value={form.email} onChange={s("email")} /></C6>
          <C6><Label className="text-sm">Website</Label><Input type="url" value={form.website} onChange={s("website")} placeholder="https://" /></C6>
        </Row2>

        {/* ── 4.3 Regulatory Information ── */}
        <SH title="Regulatory Information" />
        <Row3>
          <C4><Label className="text-sm">USDOT Number</Label><Input value={form.usdotNumber} onChange={s("usdotNumber")} /></C4>
          <C4><Label className="text-sm">MC Number</Label><Input value={form.mcNumber} onChange={s("mcNumber")} /></C4>
          <C4><Label className="text-sm">EIN Number</Label><Input value={form.einNumber} onChange={s("einNumber")} placeholder="12-3456789" /></C4>
        </Row3>
        <Row2>
          <C6><Label className="text-sm">Authority Status</Label>
            <Select value={form.authorityStatus || "__none__"} onValueChange={sel("authorityStatus")}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent><SelectItem value="__none__">—</SelectItem>{AUTHORITY_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </C6>
          <C6><Label className="text-sm">Insurance Expiration</Label><Input type="date" value={form.insuranceExpiration} onChange={s("insuranceExpiration")} /></C6>
        </Row2>

        {/* ── 4.4 Company Address ── */}
        <SH title="Company Address" />
        <Row2>
          <C6><Label className="text-sm">Company Address</Label><Input value={form.companyAddress} onChange={s("companyAddress")} /></C6>
          <C6><Label className="text-sm">Company City</Label><Input value={form.companyCity} onChange={s("companyCity")} /></C6>
        </Row2>
        <Row2>
          <C6><Label className="text-sm">Company State</Label>
            <Input value={form.companyState} maxLength={2} onChange={e => setForm(p => ({ ...p, companyState: up(e.target.value).slice(0, 2) }))} placeholder="TX" />
          </C6>
          <C6><Label className="text-sm">Company ZIP Code</Label><Input value={form.companyZipCode} onChange={s("companyZipCode")} placeholder="77001 or 77001-2345" /></C6>
        </Row2>

        {/* ── 5. Fleet Equipment ── */}
        <SH title="Fleet Equipment" />
        <div className="space-y-3 mb-4">
          {fleet.map((eq, i) => {
            const truckSummary = [eq.truckYear, eq.truckMake, eq.truckModel].filter(Boolean).join(" ") || "—";
            const driverSummary = eq.assignedDriverName || "—";
            return (
              <div key={eq.id} className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30">
                  <div>
                    <span className="text-xs font-semibold">Equipment {i + 1}</span>
                    {eq._collapsed && <span className="ml-2 text-[11px] text-muted-foreground">Truck: {truckSummary} · Driver: {driverSummary}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" title="Duplicate" onClick={() => dupEq(i)} className="p-1 hover:text-primary text-muted-foreground"><Copy className="w-3.5 h-3.5" /></button>
                    <button type="button" title="Remove" onClick={() => removeEq(i)} className="p-1 hover:text-destructive text-muted-foreground"><Trash2 className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => toggleEq(i)} className="p-1 text-muted-foreground">
                      {eq._collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {!eq._collapsed && (
                  <div className="px-4 py-4 space-y-4">
                    {/* Truck — 5.1 */}
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Truck</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                      {(["truckYear","truckMake","truckModel"] as const).map(k => (
                        <div key={k} className="md:col-span-4 flex flex-col gap-1"><Label className="text-xs capitalize">{k.replace("truck","")}</Label>
                          <Input value={(eq as any)[k]} onChange={e => setEqField(i, k, e.target.value)} placeholder={k === "truckYear" ? "2022" : k === "truckMake" ? "Kenworth" : "T680"} /></div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                      {(["truckVin","truckColor","truckPlate"] as const).map(k => (
                        <div key={k} className="md:col-span-4 flex flex-col gap-1"><Label className="text-xs">{k === "truckVin" ? "VIN" : k.replace("truck","")}</Label>
                          <Input value={(eq as any)[k]}
                            onChange={e => setEqField(i, k, k === "truckVin" || k === "truckPlate" ? e.target.value.toUpperCase() : e.target.value)}
                            placeholder={k === "truckVin" ? "1XKWD49X…" : k === "truckColor" ? "White" : "ABC-1234"} /></div>
                      ))}
                    </div>
                    {/* Trailer — 5.2 */}
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">Trailer</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                      {(["trailerYear","trailerMake","trailerModel"] as const).map(k => (
                        <div key={k} className="md:col-span-4 flex flex-col gap-1"><Label className="text-xs capitalize">{k.replace("trailer","")}</Label>
                          <Input value={(eq as any)[k]} onChange={e => setEqField(i, k, e.target.value)} /></div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                      {(["trailerVin","trailerColor","trailerPlate"] as const).map(k => (
                        <div key={k} className="md:col-span-4 flex flex-col gap-1"><Label className="text-xs">{k === "trailerVin" ? "VIN" : k.replace("trailer","")}</Label>
                          <Input value={(eq as any)[k]}
                            onChange={e => setEqField(i, k, k === "trailerVin" || k === "trailerPlate" ? e.target.value.toUpperCase() : e.target.value)} /></div>
                      ))}
                    </div>
                    {/* Assigned Driver — 5.3 */}
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">Assigned Driver</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                      <div className="md:col-span-6 flex flex-col gap-1"><Label className="text-xs">Name</Label>
                        <Input value={eq.assignedDriverName} onChange={e => setEqField(i, "assignedDriverName", e.target.value)} /></div>
                      <div className="md:col-span-6 flex flex-col gap-1"><Label className="text-xs">Email</Label>
                        <Input type="email" value={eq.assignedDriverEmail} onChange={e => setEqField(i, "assignedDriverEmail", e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                      <div className="md:col-span-4 flex flex-col gap-1"><Label className="text-xs">Phone Number</Label>
                        <Input type="tel" value={eq.assignedDriverPhoneNumber} onChange={e => setEqField(i, "assignedDriverPhoneNumber", e.target.value)} /></div>
                      <div className="md:col-span-4 flex flex-col gap-1"><Label className="text-xs">Phone Number 2</Label>
                        <Input type="tel" value={eq.assignedDriverPhoneNumber2} onChange={e => setEqField(i, "assignedDriverPhoneNumber2", e.target.value)} /></div>
                      <div className="md:col-span-4 flex flex-col gap-1"><Label className="text-xs">Emergency Contact</Label>
                        <Input value={eq.assignedDriverEmergencyContactName} onChange={e => setEqField(i, "assignedDriverEmergencyContactName", e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                      <div className="md:col-span-6 flex flex-col gap-1"><Label className="text-xs">Emergency Phone Number</Label>
                        <Input type="tel" value={eq.assignedDriverEmergencyPhoneNumber} onChange={e => setEqField(i, "assignedDriverEmergencyPhoneNumber", e.target.value)} /></div>
                      <div className="md:col-span-6 flex flex-col gap-1"><Label className="text-xs">Emergency Phone Number 2</Label>
                        <Input type="tel" value={eq.assignedDriverEmergencyPhoneNumber2} onChange={e => setEqField(i, "assignedDriverEmergencyPhoneNumber2", e.target.value)} /></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <Button type="button" variant="outline" className="w-full gap-2" onClick={addEq}>
            <Plus className="w-4 h-4" /> Add Equipment
          </Button>
        </div>

        {/* ── 6. Operations ── */}
        <SH title="Operations" />
        <Row3>
          <C4>
            <CompactMultiSelect label="Operating States" options={US_STATES} value={form.operatingStates}
              onChange={v => setForm(p => ({ ...p, operatingStates: v }))} />
          </C4>
          <C4><Label className="text-sm">Weekly Minimum Amount ($)</Label><Input type="number" min="0" step="0.01" value={form.weeklyMinimumAmount} onChange={s("weeklyMinimumAmount")} placeholder="0.00" /></C4>
          <C4><Label className="text-sm">Total Trips per Week</Label><Input type="number" min="0" step="1" value={form.totalTripsPerWeek} onChange={s("totalTripsPerWeek")} placeholder="0" /></C4>
        </Row3>
        <Row3>
          <C4><Label className="text-sm">Rate per Mile ($)</Label><Input type="number" min="0" step="0.01" value={form.ratePerMile} onChange={s("ratePerMile")} placeholder="0.00" /></C4>
          <C4><Label className="text-sm">Last Load <span className="text-xs text-muted-foreground">(auto)</span></Label>
            <div className="h-10 px-3 flex items-center text-sm border border-border rounded-md bg-muted text-muted-foreground">
              {initialData?.lastLoad ? String(initialData.lastLoad).slice(0, 10) : "No loads"}
            </div>
          </C4>
          <C4><Label className="text-sm">Payment Terms</Label>
            <Select value={form.paymentTerms || "__none__"} onValueChange={sel("paymentTerms")}>
              <SelectTrigger><SelectValue placeholder="Select terms" /></SelectTrigger>
              <SelectContent><SelectItem value="__none__">—</SelectItem>{PAYMENT_TERMS_OPTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </C4>
        </Row3>

        {/* ── 7. Factoring ── */}
        <SH title="Factoring" />
        <Row2>
          <C6><Label className="text-sm">Factoring Company</Label><Input value={form.factoringCompany} onChange={s("factoringCompany")} /></C6>
          <C6><Label className="text-sm">Factoring Fee (%)</Label><Input type="number" min="0" max="100" step="0.01" value={form.factoringFee} onChange={s("factoringFee")} placeholder="0.00" /></C6>
        </Row2>

        {/* ── 8. Bank Information ── */}
        <SH title="Bank Information" />
        <Row3>
          <C4><Label className="text-sm">Bank Name</Label><Input value={form.bankName} onChange={s("bankName")} /></C4>
          <C4><Label className="text-sm">Account Holder</Label><Input value={form.accountHolder} onChange={s("accountHolder")} /></C4>
          <C4><Label className="text-sm">Account Number</Label><Input value={form.accountNumber} onChange={s("accountNumber")} autoComplete="off" /></C4>
        </Row3>
        <Row3>
          <C4><Label className="text-sm">Routing Number</Label><Input value={form.routingNumber} onChange={s("routingNumber")} autoComplete="off" /></C4>
          <C4><Label className="text-sm">Bank Address</Label><Input value={form.bankAddress} onChange={s("bankAddress")} /></C4>
          <C4><Label className="text-sm">Bank City</Label><Input value={form.bankCity} onChange={s("bankCity")} /></C4>
        </Row3>
        <Row2>
          <C6><Label className="text-sm">Bank State</Label>
            <Input value={form.bankState} maxLength={2} onChange={e => setForm(p => ({ ...p, bankState: up(e.target.value).slice(0, 2) }))} placeholder="TX" />
          </C6>
          <C6><Label className="text-sm">Bank ZIP Code</Label><Input value={form.bankZipCode} onChange={s("bankZipCode")} /></C6>
        </Row2>
        <Row2>
          <C6><Label className="text-sm">Zelle Account</Label><Input value={form.zelleAccount} onChange={s("zelleAccount")} /></C6>
          <C6><Label className="text-sm">Cash App Account</Label><Input value={form.cashAppAccount} onChange={s("cashAppAccount")} placeholder="$cashtag" /></C6>
        </Row2>

        {err && <p className="text-sm text-destructive mt-2">Error: {(err as any)?.message ?? "Could not save."}</p>}

        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending || !form.companyName.trim()}>
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Carrier"}
          </Button>
        </div>
      </form>
    </>
  );
}
