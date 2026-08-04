/**
 * BrokerContactForm — Spec sections 9.1–9.4
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
import { ChevronDown, X } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────
const BROKER_TYPES = ["Auto Transport Broker", "Freight Broker", "Logistics Company", "Shipper", "Dealer", "Auction", "Other"];
const STATUSES = ["Active", "Inactive", "Blocked"];
const FREIGHT_TYPES = ["Vehicles", "General Freight", "Machinery", "Auto Parts", "Oversized", "Inoperable Vehicles", "Enclosed Transport", "Open Transport", "Other"];
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const PAYMENT_TERMS_OPTS = ["Due on Receipt", "Net 7", "Net 15", "Net 30", "Net 45", "Custom"];
const PAYMENT_DAYS_MAP: Record<string, number> = { "Due on Receipt": 0, "Net 7": 7, "Net 15": 15, "Net 30": 30, "Net 45": 45 };
const FACTORING_OPTS = ["Yes", "No", "Conditional"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const nt = (v: string) => v.trim() || null;
const nn = (v: string) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const ni = (v: string) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };

// ── Layout ────────────────────────────────────────────────────────────────────
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
  return <div className="border-t border-border pt-4 mb-4"><p className="text-sm font-semibold text-foreground">{title}</p></div>;
}

// ── Compact multi-select ──────────────────────────────────────────────────────
function CMS({ label, options, value, onChange, cols = 3 }: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void; cols?: number;
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
        <span className={value.length === 0 ? "text-muted-foreground" : ""}>{value.length === 0 ? "Select…" : `${value.length} selected`}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 border border-border bg-card rounded-md shadow-lg max-h-56 overflow-y-auto">
          <div className={`grid gap-0.5 p-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
            {options.map(o => (
              <label key={o} className="flex items-center gap-1 px-1 py-0.5 hover:bg-muted rounded text-[11px] cursor-pointer">
                <input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} className="w-3 h-3" />{o}
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

// ── Compact tag input ─────────────────────────────────────────────────────────
function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [inp, setInp] = useState("");
  const add = () => { const t = inp.trim(); if (t && !value.includes(t)) onChange([...value, t]); setInp(""); };
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">Tags</Label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map(t => (
            <Badge key={t} variant="secondary" className="gap-1 text-xs">{t}
              <button type="button" onClick={() => onChange(value.filter(x => x !== t))}><X className="w-2.5 h-2.5" /></button>
            </Badge>
          ))}
        </div>
      )}
      <Input value={inp} onChange={e => setInp(e.target.value)} placeholder="Type + Enter"
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }}} />
    </div>
  );
}

// ── Form type ─────────────────────────────────────────────────────────────────
interface BF {
  companyName: string; brokerType: string; status: string; rating: string; tags: string[]; notes: string;
  primaryContactName: string; primaryPhoneNumber: string; primaryPhoneNumber2: string;
  emergencyContactName: string; emergencyPhoneNumber: string; emergencyPhoneNumber2: string;
  email: string; website: string;
  mcNumber: string; usdotNumber: string;
  freightTypes: string[]; coverageStates: string[];
  paymentTerms: string; paymentDays: string; quickPay: boolean; quickPayFee: string;
  factoringAccepted: string; factoringConditions: string;
}

const empty = (): BF => ({
  companyName: "", brokerType: "", status: "Active", rating: "", tags: [], notes: "",
  primaryContactName: "", primaryPhoneNumber: "", primaryPhoneNumber2: "",
  emergencyContactName: "", emergencyPhoneNumber: "", emergencyPhoneNumber2: "",
  email: "", website: "",
  mcNumber: "", usdotNumber: "",
  freightTypes: [], coverageStates: [],
  paymentTerms: "", paymentDays: "", quickPay: false, quickPayFee: "",
  factoringAccepted: "", factoringConditions: "",
});

function fromRaw(d: Record<string, any>): BF {
  const s = (v: any) => v ?? "";
  const terms = s(d.paymentTerms);
  const days = d.paymentDays != null ? String(d.paymentDays)
    : terms in PAYMENT_DAYS_MAP ? String(PAYMENT_DAYS_MAP[terms]) : "";
  return {
    companyName: s(d.companyName), brokerType: s(d.brokerType), status: s(d.status) || "Active",
    rating: d.rating != null ? String(d.rating) : "", tags: Array.isArray(d.tags) ? d.tags : [], notes: s(d.notes),
    primaryContactName: s(d.primaryContactName), primaryPhoneNumber: s(d.primaryPhoneNumber),
    primaryPhoneNumber2: s(d.primaryPhoneNumber2),
    emergencyContactName: s(d.emergencyContactName), emergencyPhoneNumber: s(d.emergencyPhoneNumber),
    emergencyPhoneNumber2: s(d.emergencyPhoneNumber2),
    email: s(d.email), website: s(d.website),
    mcNumber: s(d.mcNumber), usdotNumber: s(d.usdotNumber),
    freightTypes: Array.isArray(d.freightTypes) ? d.freightTypes : [],
    coverageStates: Array.isArray(d.coverageStates) ? d.coverageStates : [],
    paymentTerms: terms, paymentDays: days,
    quickPay: d.quickPay ?? false, quickPayFee: d.quickPayFee != null ? String(d.quickPayFee) : "",
    factoringAccepted: s(d.factoringAccepted), factoringConditions: s(d.factoringConditions),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  initialData?: Record<string, any>;
  onClose: () => void;
  onBack?: () => void;
}

export function BrokerContactForm({ initialData, onClose, onBack }: Props) {
  const qc = useQueryClient();
  const isEdit = !!initialData?.id;
  const createMut = useCreateCrmContact();
  const updateMut = useUpdateCrmContact();
  const [form, setForm] = useState<BF>(initialData ? fromRaw(initialData) : empty());

  useEffect(() => { setForm(initialData ? fromRaw(initialData) : empty()); }, [initialData]);

  const s = (k: keyof BF) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));
  const sel = (k: keyof BF) => (v: string) => setForm(p => ({ ...p, [k]: v === "__none__" ? "" : v }));

  function handleTermsChange(v: string) {
    const terms = v === "__none__" ? "" : v;
    const days = terms in PAYMENT_DAYS_MAP ? String(PAYMENT_DAYS_MAP[terms]) : form.paymentDays;
    setForm(p => ({ ...p, paymentTerms: terms, paymentDays: days }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {
      companyName: form.companyName.trim(), contactType: "Broker",
      brokerType: nt(form.brokerType), status: form.status,
      rating: nn(form.rating) ?? undefined, tags: form.tags, notes: nt(form.notes),
      primaryContactName: nt(form.primaryContactName),
      primaryPhoneNumber: nt(form.primaryPhoneNumber),
      primaryPhoneNumber2: nt(form.primaryPhoneNumber2),
      emergencyContactName: nt(form.emergencyContactName),
      emergencyPhoneNumber: nt(form.emergencyPhoneNumber),
      emergencyPhoneNumber2: nt(form.emergencyPhoneNumber2),
      email: nt(form.email), website: nt(form.website),
      mcNumber: nt(form.mcNumber), usdotNumber: nt(form.usdotNumber),
      freightTypes: form.freightTypes,
      coverageStates: form.coverageStates,
      paymentTerms: nt(form.paymentTerms),
      paymentDays: ni(form.paymentDays) ?? undefined,
      quickPay: form.quickPay,
      quickPayFee: form.quickPay ? (nn(form.quickPayFee) ?? undefined) : null,
      factoringAccepted: nt(form.factoringAccepted),
      factoringConditions: form.factoringAccepted === "Conditional" ? nt(form.factoringConditions) : null,
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
          <DialogTitle>{isEdit ? `Edit Broker — ${initialData?.companyName}` : "Add Broker Contact"}</DialogTitle>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="mt-2">

        {/* ── 9.1 Company Information ── */}
        <SH title="Company Information" />
        <Row3>
          <C4><Label className="text-sm">Company Name *</Label><Input required value={form.companyName} onChange={s("companyName")} /></C4>
          <C4><Label className="text-sm">Broker Type *</Label>
            <Select value={form.brokerType || "__none__"} onValueChange={sel("brokerType")}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent><SelectItem value="__none__">—</SelectItem>{BROKER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </C4>
          <C4><Label className="text-sm">Status *</Label>
            <Select value={form.status} onValueChange={sel("status")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </C4>
        </Row3>
        <Row3>
          <C4><Label className="text-sm">Rating (0–5)</Label><Input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={s("rating")} placeholder="0.0" /></C4>
          <C4><TagInput value={form.tags} onChange={tags => setForm(p => ({ ...p, tags }))} /></C4>
          <C4><Label className="text-sm">Notes</Label><Textarea rows={2} value={form.notes} onChange={s("notes")} /></C4>
        </Row3>

        {/* ── 9.2 Primary and Emergency Contact ── */}
        <SH title="Primary and Emergency Contact" />
        <Row3>
          <C4><Label className="text-sm">Primary Contact *</Label><Input required value={form.primaryContactName} onChange={s("primaryContactName")} placeholder="Jane Smith" /></C4>
          <C4><Label className="text-sm">Phone Number</Label><Input type="tel" value={form.primaryPhoneNumber} onChange={s("primaryPhoneNumber")} /></C4>
          <C4><Label className="text-sm">Phone Number 2</Label><Input type="tel" value={form.primaryPhoneNumber2} onChange={s("primaryPhoneNumber2")} /></C4>
        </Row3>
        <Row3>
          <C4><Label className="text-sm">Emergency Contact</Label><Input value={form.emergencyContactName} onChange={s("emergencyContactName")} /></C4>
          <C4><Label className="text-sm">Phone Number</Label><Input type="tel" value={form.emergencyPhoneNumber} onChange={s("emergencyPhoneNumber")} /></C4>
          <C4><Label className="text-sm">Phone Number 2</Label><Input type="tel" value={form.emergencyPhoneNumber2} onChange={s("emergencyPhoneNumber2")} /></C4>
        </Row3>
        <Row3>
          <C4><Label className="text-sm">Email</Label><Input type="email" value={form.email} onChange={s("email")} /></C4>
          <C4><Label className="text-sm">Website</Label><Input type="url" value={form.website} onChange={s("website")} placeholder="https://" /></C4>
          <C4><Label className="text-sm">Last Contact <span className="text-xs text-muted-foreground">(auto)</span></Label>
            <div className="h-10 px-3 flex items-center text-sm border border-border rounded-md bg-muted text-muted-foreground">
              {initialData?.lastContact ? String(initialData.lastContact).slice(0, 10) : "No contact activity"}
            </div>
          </C4>
        </Row3>

        {/* ── 9.3 Regulatory and Operations ── */}
        <SH title="Regulatory and Operations" />
        <Row3>
          <C4><Label className="text-sm">MC Number</Label><Input value={form.mcNumber} onChange={s("mcNumber")} /></C4>
          <C4><Label className="text-sm">USDOT Number</Label><Input value={form.usdotNumber} onChange={s("usdotNumber")} /></C4>
          <C4>
            <CMS label="Freight Types" options={FREIGHT_TYPES} value={form.freightTypes}
              onChange={v => setForm(p => ({ ...p, freightTypes: v }))} cols={2} />
          </C4>
        </Row3>
        <Row2>
          <C6>
            <CMS label="Coverage States" options={US_STATES} value={form.coverageStates}
              onChange={v => setForm(p => ({ ...p, coverageStates: v }))} cols={5} />
          </C6>
          <C6><Label className="text-sm">Last Load <span className="text-xs text-muted-foreground">(auto)</span></Label>
            <div className="h-10 px-3 flex items-center text-sm border border-border rounded-md bg-muted text-muted-foreground">
              {initialData?.lastLoad ? String(initialData.lastLoad).slice(0, 10) : "No loads"}
            </div>
          </C6>
        </Row2>

        {/* ── 9.4 Payment and Factoring ── */}
        <SH title="Payment and Factoring" />
        <Row3>
          <C4><Label className="text-sm">Payment Terms</Label>
            <Select value={form.paymentTerms || "__none__"} onValueChange={handleTermsChange}>
              <SelectTrigger><SelectValue placeholder="Select terms" /></SelectTrigger>
              <SelectContent><SelectItem value="__none__">—</SelectItem>{PAYMENT_TERMS_OPTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </C4>
          <C4><Label className="text-sm">Payment Days</Label>
            <Input type="number" min="0" step="1" value={form.paymentDays}
              readOnly={!!form.paymentTerms && form.paymentTerms !== "Custom"}
              className={form.paymentTerms && form.paymentTerms !== "Custom" ? "bg-muted text-muted-foreground" : ""}
              onChange={s("paymentDays")} placeholder="0" />
          </C4>
          <C4><Label className="text-sm">QuickPay</Label>
            <Select value={form.quickPay ? "Yes" : "No"} onValueChange={v => setForm(p => ({ ...p, quickPay: v === "Yes", quickPayFee: v === "No" ? "" : p.quickPayFee }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
            </Select>
          </C4>
        </Row3>
        <Row3>
          <C4>
            {form.quickPay ? (
              <><Label className="text-sm">QuickPay Fee (%) *</Label>
                <Input type="number" min="0" max="100" step="0.01" required value={form.quickPayFee} onChange={s("quickPayFee")} placeholder="0.00" /></>
            ) : <div />}
          </C4>
          <C4><Label className="text-sm">Factoring Accepted</Label>
            <Select value={form.factoringAccepted || "__none__"} onValueChange={v => setForm(p => ({
              ...p, factoringAccepted: v === "__none__" ? "" : v,
              factoringConditions: v !== "Conditional" ? "" : p.factoringConditions,
            }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent><SelectItem value="__none__">—</SelectItem>{FACTORING_OPTS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </C4>
          <C4>
            {form.factoringAccepted === "Conditional" ? (
              <><Label className="text-sm">Factoring Conditions</Label>
                <Textarea rows={2} value={form.factoringConditions} onChange={s("factoringConditions")} placeholder="Describe conditions…" /></>
            ) : <div />}
          </C4>
        </Row3>

        {err && <p className="text-sm text-destructive mt-2">Error: {(err as any)?.message ?? "Could not save."}</p>}

        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending || !form.companyName.trim()}>
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Broker"}
          </Button>
        </div>
      </form>
    </>
  );
}
