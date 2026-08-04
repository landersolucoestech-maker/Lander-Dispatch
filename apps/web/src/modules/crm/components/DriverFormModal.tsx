/**
 * DriverFormModal — 12-section driver form per spec sections 12.1–12.10
 * Uses tab groups to keep the massive form manageable.
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { X, ChevronLeft } from "lucide-react";
import { useCreateDriver, useUpdateDriver, type Driver } from "../hooks/useDrivers";

// ── Constants ──────────────────────────────────────────────────────────────────
const DRIVER_STATUSES = ["Active", "Inactive", "Suspended", "Disqualified", "On Leave", "Pending Documentation", "Terminated"];
const DRIVER_TYPES = ["Company Driver", "Owner-Operator", "Independent Contractor", "Team Driver", "Temporary Driver", "Other"];
const EMPLOYMENT_TYPES = ["Employee", "Contractor", "Owner-Operator", "Temporary", "Other"];
const DQ_FILE_STATUSES = ["Complete", "Incomplete", "Pending", "Expired", "Under Review"];
const MVR_STATUSES = ["Clear", "Minor Violations", "Major Violations", "Disqualified", "Pending"];
const BACKGROUND_STATUSES = ["Clear", "Flagged", "Disqualified", "Pending", "Expired"];
const DRUG_RESULTS = ["Negative", "Positive", "Dilute", "Refusal", "Cancelled", "Pending"];
const CLEARINGHOUSE_STATUSES = ["Clear", "Prohibited", "Pending Resolution", "Not Registered"];
const COMPLIANCE_STATUSES = ["Compliant", "Non-Compliant", "Pending Review", "Probation", "Disqualified"];
const CDL_CLASSES = ["A", "B", "C"];
const CDL_ENDORSEMENTS_OPTS = ["H — Hazardous Materials", "N — Tank Vehicle", "P — Passenger", "S — School Bus", "T — Double/Triple Trailers", "X — HazMat + Tank Combo"];
const LICENSE_CLASSES = ["A", "B", "C", "D", "E", "M", "Other"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const nt = (v: string) => v.trim() || null;
const ni = (v: string) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };

// ── Form components ───────────────────────────────────────────────────────────

function SH({ title }: { title: string }) {
  return (
    <div className="border-t border-border pt-4 mb-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
  );
}

function R3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-12 mb-4">{children}</div>;
}
function R2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-12 mb-4">{children}</div>;
}
function C4({ children }: { children?: React.ReactNode }) {
  return <div className="md:col-span-4 flex flex-col gap-1.5">{children}</div>;
}
function C6({ children }: { children?: React.ReactNode }) {
  return <div className="md:col-span-6 flex flex-col gap-1.5">{children}</div>;
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <><Label className="text-sm">{label}</Label>{children}</>;
}

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [inp, setInp] = useState("");
  const add = () => { const t = inp.trim(); if (t && !value.includes(t)) onChange([...value, t]); setInp(""); };
  return (
    <div className="flex flex-col gap-1.5">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map(t => (
            <Badge key={t} variant="secondary" className="gap-1">{t}
              <button type="button" onClick={() => onChange(value.filter(x => x !== t))}><X className="w-2.5 h-2.5" /></button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }}}
          placeholder="Type and press Enter" />
        <Button type="button" variant="outline" size="sm" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

function MultiSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex flex-wrap gap-1 min-h-[2.5rem] border border-border rounded-md px-3 py-2">
        {value.length === 0 && <span className="text-muted-foreground text-sm">None selected</span>}
        {value.map(v => (
          <Badge key={v} variant="secondary" className="gap-1 text-xs">{v.split("—")[0].trim()}
            <button type="button" onClick={() => toggle(v)}><X className="w-2.5 h-2.5" /></button>
          </Badge>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-0.5 border border-border rounded-md p-2 max-h-32 overflow-y-auto">
        {options.map(o => (
          <label key={o} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted rounded px-1 py-0.5">
            <input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} className="w-3 h-3" />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
type TabId = "personal" | "license" | "medical" | "tests" | "safety" | "assignments";
const TABS: { id: TabId; label: string }[] = [
  { id: "personal",     label: "Personal & Employment" },
  { id: "license",      label: "License & CDL" },
  { id: "medical",      label: "Medical & TWIC" },
  { id: "tests",        label: "MVR & Tests" },
  { id: "safety",       label: "Safety & History" },
  { id: "assignments",  label: "Assignments" },
];

// ── Form type ─────────────────────────────────────────────────────────────────
type DF = {
  fullName: string; status: string; dateOfBirth: string;
  phoneNumber: string; phoneNumber2: string; email: string;
  emergencyContactName: string; emergencyPhoneNumber: string; emergencyPhoneNumber2: string;
  streetAddress: string; city: string; state: string; zipCode: string;
  hireDate: string; driverType: string; employmentType: string; yearsOfExperience: string;
  driverLicenseNumber: string; driverLicenseState: string; driverLicenseClass: string; driverLicenseExpiration: string;
  cdlNumber: string; cdlState: string; cdlClass: string; cdlExpiration: string;
  cdlEndorsements: string[]; cdlRestrictions: string;
  hazmatEndorsement: boolean; hazmatEndorsementExpiration: string;
  medicalExaminerCertificateNumber: string; medicalCardIssueDate: string; medicalCardExpiration: string;
  medicalExaminerName: string; nationalRegistryNumber: string; twicCardNumber: string;
  twicCardExpiration: string; driverQualificationFileStatus: string;
  mvrCheckDate: string; mvrNextReviewDate: string; mvrStatus: string;
  backgroundCheckDate: string; backgroundCheckStatus: string;
  drugTestDate: string; drugTestResult: string; alcoholTestDate: string; alcoholTestResult: string;
  clearinghouseStatus: string; clearinghouseLastQueryDate: string; clearinghouseNextQueryDate: string;
  accidentHistory: string; violationHistory: string;
  notes: string; tags: string[];
};

const empty = (): DF => ({
  fullName: "", status: "Active", dateOfBirth: "",
  phoneNumber: "", phoneNumber2: "", email: "",
  emergencyContactName: "", emergencyPhoneNumber: "", emergencyPhoneNumber2: "",
  streetAddress: "", city: "", state: "", zipCode: "",
  hireDate: "", driverType: "", employmentType: "", yearsOfExperience: "",
  driverLicenseNumber: "", driverLicenseState: "", driverLicenseClass: "", driverLicenseExpiration: "",
  cdlNumber: "", cdlState: "", cdlClass: "", cdlExpiration: "",
  cdlEndorsements: [], cdlRestrictions: "",
  hazmatEndorsement: false, hazmatEndorsementExpiration: "",
  medicalExaminerCertificateNumber: "", medicalCardIssueDate: "", medicalCardExpiration: "",
  medicalExaminerName: "", nationalRegistryNumber: "", twicCardNumber: "",
  twicCardExpiration: "", driverQualificationFileStatus: "",
  mvrCheckDate: "", mvrNextReviewDate: "", mvrStatus: "",
  backgroundCheckDate: "", backgroundCheckStatus: "",
  drugTestDate: "", drugTestResult: "", alcoholTestDate: "", alcoholTestResult: "",
  clearinghouseStatus: "", clearinghouseLastQueryDate: "", clearinghouseNextQueryDate: "",
  accidentHistory: "", violationHistory: "",
  notes: "", tags: [],
});

function fromDriver(d: Driver): DF {
  const s = (v?: string | null) => v ?? "";
  return {
    fullName: d.fullName, status: d.status,
    dateOfBirth: s(d.dateOfBirth), phoneNumber: s(d.phoneNumber), phoneNumber2: s(d.phoneNumber2),
    email: s(d.email), emergencyContactName: s(d.emergencyContactName),
    emergencyPhoneNumber: s(d.emergencyPhoneNumber), emergencyPhoneNumber2: s(d.emergencyPhoneNumber2),
    streetAddress: s(d.streetAddress), city: s(d.city), state: s(d.state), zipCode: s(d.zipCode),
    hireDate: s(d.hireDate), driverType: s(d.driverType), employmentType: s(d.employmentType),
    yearsOfExperience: d.yearsOfExperience != null ? String(d.yearsOfExperience) : "",
    driverLicenseNumber: s(d.driverLicenseNumber), driverLicenseState: s(d.driverLicenseState),
    driverLicenseClass: s(d.driverLicenseClass), driverLicenseExpiration: s(d.driverLicenseExpiration),
    cdlNumber: s(d.cdlNumber), cdlState: s(d.cdlState), cdlClass: s(d.cdlClass), cdlExpiration: s(d.cdlExpiration),
    cdlEndorsements: Array.isArray(d.cdlEndorsements) ? d.cdlEndorsements : [],
    cdlRestrictions: s(d.cdlRestrictions), hazmatEndorsement: d.hazmatEndorsement ?? false,
    hazmatEndorsementExpiration: s(d.hazmatEndorsementExpiration),
    medicalExaminerCertificateNumber: s(d.medicalExaminerCertificateNumber),
    medicalCardIssueDate: s(d.medicalCardIssueDate), medicalCardExpiration: s(d.medicalCardExpiration),
    medicalExaminerName: s(d.medicalExaminerName), nationalRegistryNumber: s(d.nationalRegistryNumber),
    twicCardNumber: s(d.twicCardNumber), twicCardExpiration: s(d.twicCardExpiration),
    driverQualificationFileStatus: s(d.driverQualificationFileStatus),
    mvrCheckDate: s(d.mvrCheckDate), mvrNextReviewDate: s(d.mvrNextReviewDate), mvrStatus: s(d.mvrStatus),
    backgroundCheckDate: s(d.backgroundCheckDate), backgroundCheckStatus: s(d.backgroundCheckStatus),
    drugTestDate: s(d.drugTestDate), drugTestResult: s(d.drugTestResult),
    alcoholTestDate: s(d.alcoholTestDate), alcoholTestResult: s(d.alcoholTestResult),
    clearinghouseStatus: s(d.clearinghouseStatus),
    clearinghouseLastQueryDate: s(d.clearinghouseLastQueryDate),
    clearinghouseNextQueryDate: s(d.clearinghouseNextQueryDate),
    accidentHistory: s(d.accidentHistory), violationHistory: s(d.violationHistory),
    notes: s(d.notes), tags: Array.isArray(d.tags) ? d.tags : [],
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Driver;
  onBack?: () => void;
}

export function DriverFormModal({ open, onClose, initialData, onBack }: Props) {
  const isEdit = !!initialData?.id;
  const createMut = useCreateDriver();
  const updateMut = useUpdateDriver();
  const [tab, setTab] = useState<TabId>("personal");
  const [form, setForm] = useState<DF>(initialData ? fromDriver(initialData) : empty());

  useEffect(() => {
    setForm(initialData ? fromDriver(initialData) : empty());
    setTab("personal");
  }, [initialData, open]);

  const s = (k: keyof DF) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));
  const sel = (k: keyof DF) => (v: string) =>
    setForm(p => ({ ...p, [k]: v === "__none__" ? "" : v }));
  const up = (v: string) => v.toUpperCase();

  const toPayload = (): Partial<Driver> => ({
    fullName: form.fullName.trim(),
    status: form.status,
    dateOfBirth: nt(form.dateOfBirth),
    phoneNumber: nt(form.phoneNumber), phoneNumber2: nt(form.phoneNumber2),
    email: nt(form.email),
    emergencyContactName: nt(form.emergencyContactName),
    emergencyPhoneNumber: nt(form.emergencyPhoneNumber),
    emergencyPhoneNumber2: nt(form.emergencyPhoneNumber2),
    streetAddress: nt(form.streetAddress), city: nt(form.city),
    state: nt(form.state), zipCode: nt(form.zipCode),
    hireDate: nt(form.hireDate), driverType: nt(form.driverType),
    employmentType: nt(form.employmentType),
    yearsOfExperience: ni(form.yearsOfExperience) ?? undefined,
    driverLicenseNumber: nt(form.driverLicenseNumber),
    driverLicenseState: nt(form.driverLicenseState),
    driverLicenseClass: nt(form.driverLicenseClass),
    driverLicenseExpiration: nt(form.driverLicenseExpiration),
    cdlNumber: nt(form.cdlNumber), cdlState: nt(form.cdlState),
    cdlClass: nt(form.cdlClass), cdlExpiration: nt(form.cdlExpiration),
    cdlEndorsements: form.cdlEndorsements, cdlRestrictions: nt(form.cdlRestrictions),
    hazmatEndorsement: form.hazmatEndorsement,
    hazmatEndorsementExpiration: nt(form.hazmatEndorsementExpiration),
    medicalExaminerCertificateNumber: nt(form.medicalExaminerCertificateNumber),
    medicalCardIssueDate: nt(form.medicalCardIssueDate),
    medicalCardExpiration: nt(form.medicalCardExpiration),
    medicalExaminerName: nt(form.medicalExaminerName),
    nationalRegistryNumber: nt(form.nationalRegistryNumber),
    twicCardNumber: nt(form.twicCardNumber), twicCardExpiration: nt(form.twicCardExpiration),
    driverQualificationFileStatus: nt(form.driverQualificationFileStatus),
    mvrCheckDate: nt(form.mvrCheckDate), mvrNextReviewDate: nt(form.mvrNextReviewDate),
    mvrStatus: nt(form.mvrStatus),
    backgroundCheckDate: nt(form.backgroundCheckDate),
    backgroundCheckStatus: nt(form.backgroundCheckStatus),
    drugTestDate: nt(form.drugTestDate), drugTestResult: nt(form.drugTestResult),
    alcoholTestDate: nt(form.alcoholTestDate), alcoholTestResult: nt(form.alcoholTestResult),
    clearinghouseStatus: nt(form.clearinghouseStatus),
    clearinghouseLastQueryDate: nt(form.clearinghouseLastQueryDate),
    clearinghouseNextQueryDate: nt(form.clearinghouseNextQueryDate),
    accidentHistory: nt(form.accidentHistory),
    violationHistory: nt(form.violationHistory),
    notes: nt(form.notes), tags: form.tags,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = toPayload();
    if (isEdit) {
      updateMut.mutate({ id: initialData!.id, data: payload }, { onSuccess: onClose });
    } else {
      createMut.mutate(payload, { onSuccess: onClose });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;
  const err = createMut.error || updateMut.error;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {onBack && (
              <button type="button" onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <DialogTitle>{isEdit ? `Edit Driver — ${initialData?.fullName}` : "Add Driver"}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto flex-shrink-0">
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-1 py-2 space-y-0">

          {/* ── TAB: Personal & Employment ──────────────────────────────── */}
          {tab === "personal" && (
            <>
              <SH title="12.1 — Driver Information" />
              <R3>
                <C4><F label="Full Name *"><Input required value={form.fullName} onChange={s("fullName")} placeholder="John Doe" /></F></C4>
                <C4><F label="Status *">
                  <Select value={form.status} onValueChange={sel("status")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DRIVER_STATUSES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </F></C4>
                <C4><F label="Date of Birth"><Input type="date" value={form.dateOfBirth} onChange={s("dateOfBirth")} /></F></C4>
              </R3>
              <R3>
                <C4><F label="Phone Number"><Input type="tel" value={form.phoneNumber} onChange={s("phoneNumber")} /></F></C4>
                <C4><F label="Phone Number 2"><Input type="tel" value={form.phoneNumber2} onChange={s("phoneNumber2")} /></F></C4>
                <C4><F label="Email"><Input type="email" value={form.email} onChange={s("email")} /></F></C4>
              </R3>
              <R3>
                <C4><F label="Emergency Contact Name"><Input value={form.emergencyContactName} onChange={s("emergencyContactName")} /></F></C4>
                <C4><F label="Emergency Phone"><Input type="tel" value={form.emergencyPhoneNumber} onChange={s("emergencyPhoneNumber")} /></F></C4>
                <C4><F label="Emergency Phone Number 2"><Input type="tel" value={form.emergencyPhoneNumber2} onChange={s("emergencyPhoneNumber2")} /></F></C4>
              </R3>

              <SH title="12.2 — Address and Employment" />
              <R3>
                <C4><F label="Street Address"><Input value={form.streetAddress} onChange={s("streetAddress")} /></F></C4>
                <C4><F label="City"><Input value={form.city} onChange={s("city")} /></F></C4>
                <C4><F label="State"><Input value={form.state} maxLength={2}
                  onChange={e => setForm(p => ({ ...p, state: up(e.target.value).slice(0, 2) }))} placeholder="TX" /></F></C4>
              </R3>
              <R3>
                <C4><F label="ZIP Code"><Input value={form.zipCode} onChange={s("zipCode")} /></F></C4>
                <C4><F label="Hire Date"><Input type="date" value={form.hireDate} onChange={s("hireDate")} /></F></C4>
                <C4><F label="Driver Type">
                  <Select value={form.driverType || "__none__"} onValueChange={sel("driverType")}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none__">—</SelectItem>
                      {DRIVER_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </F></C4>
              </R3>
              <R3>
                <C4><F label="Employment Type">
                  <Select value={form.employmentType || "__none__"} onValueChange={sel("employmentType")}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none__">—</SelectItem>
                      {EMPLOYMENT_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </F></C4>
                <C4><F label="Years of Experience"><Input type="number" min="0" step="1" value={form.yearsOfExperience} onChange={s("yearsOfExperience")} placeholder="0" /></F></C4>
                <C4></C4>
              </R3>
            </>
          )}

          {/* ── TAB: License & CDL ──────────────────────────────────────── */}
          {tab === "license" && (
            <>
              <SH title="12.3 — Driver License" />
              <R3>
                <C4><F label="License Number"><Input value={form.driverLicenseNumber}
                  onChange={e => setForm(p => ({ ...p, driverLicenseNumber: up(e.target.value) }))} /></F></C4>
                <C4><F label="License State"><Input value={form.driverLicenseState} maxLength={2}
                  onChange={e => setForm(p => ({ ...p, driverLicenseState: up(e.target.value).slice(0, 2) }))} placeholder="TX" /></F></C4>
                <C4><F label="License Class">
                  <Select value={form.driverLicenseClass || "__none__"} onValueChange={sel("driverLicenseClass")}>
                    <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none__">—</SelectItem>
                      {LICENSE_CLASSES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </F></C4>
              </R3>
              <R3>
                <C4><F label="License Expiration"><Input type="date" value={form.driverLicenseExpiration} onChange={s("driverLicenseExpiration")} /></F></C4>
                <C4><F label="CDL Number"><Input value={form.cdlNumber}
                  onChange={e => setForm(p => ({ ...p, cdlNumber: up(e.target.value) }))} /></F></C4>
                <C4><F label="CDL State"><Input value={form.cdlState} maxLength={2}
                  onChange={e => setForm(p => ({ ...p, cdlState: up(e.target.value).slice(0, 2) }))} placeholder="TX" /></F></C4>
              </R3>
              <R3>
                <C4><F label="CDL Class">
                  <Select value={form.cdlClass || "__none__"} onValueChange={sel("cdlClass")}>
                    <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none__">—</SelectItem>
                      {CDL_CLASSES.map(o => <SelectItem key={o} value={o}>Class {o}</SelectItem>)}</SelectContent>
                  </Select>
                </F></C4>
                <C4><F label="CDL Expiration"><Input type="date" value={form.cdlExpiration} onChange={s("cdlExpiration")} /></F></C4>
                <C4><F label="CDL Restrictions"><Input value={form.cdlRestrictions} onChange={s("cdlRestrictions")} placeholder="L, Z, etc." /></F></C4>
              </R3>
              <div className="mb-4">
                <MultiSelect label="CDL Endorsements" options={CDL_ENDORSEMENTS_OPTS}
                  value={form.cdlEndorsements}
                  onChange={v => setForm(p => ({ ...p, cdlEndorsements: v }))} />
              </div>
              <R3>
                <C4><F label="Hazmat Endorsement">
                  <Select value={form.hazmatEndorsement ? "Yes" : "No"}
                    onValueChange={v => setForm(p => ({ ...p, hazmatEndorsement: v === "Yes" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                  </Select>
                </F></C4>
                {form.hazmatEndorsement && (
                  <C4><F label="Hazmat Expiration"><Input type="date" value={form.hazmatEndorsementExpiration} onChange={s("hazmatEndorsementExpiration")} /></F></C4>
                )}
                <C4></C4>
              </R3>
            </>
          )}

          {/* ── TAB: Medical & TWIC ─────────────────────────────────────── */}
          {tab === "medical" && (
            <>
              <SH title="12.4 — Medical, TWIC and Registry" />
              <R3>
                <C4><F label="Medical Cert. Number"><Input value={form.medicalExaminerCertificateNumber} onChange={s("medicalExaminerCertificateNumber")} /></F></C4>
                <C4><F label="Medical Card Issue Date"><Input type="date" value={form.medicalCardIssueDate} onChange={s("medicalCardIssueDate")} /></F></C4>
                <C4><F label="Medical Card Expiration"><Input type="date" value={form.medicalCardExpiration} onChange={s("medicalCardExpiration")} /></F></C4>
              </R3>
              <R3>
                <C4><F label="Medical Examiner Name"><Input value={form.medicalExaminerName} onChange={s("medicalExaminerName")} /></F></C4>
                <C4><F label="National Registry Number"><Input value={form.nationalRegistryNumber} onChange={s("nationalRegistryNumber")} /></F></C4>
                <C4><F label="TWIC Card Number"><Input value={form.twicCardNumber} onChange={s("twicCardNumber")} placeholder="Sensitive" /></F></C4>
              </R3>
              <R2>
                <C6><F label="TWIC Card Expiration"><Input type="date" value={form.twicCardExpiration} onChange={s("twicCardExpiration")} /></F></C6>
                <C6><F label="DQ File Status">
                  <Select value={form.driverQualificationFileStatus || "__none__"} onValueChange={sel("driverQualificationFileStatus")}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none__">—</SelectItem>
                      {DQ_FILE_STATUSES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </F></C6>
              </R2>
            </>
          )}

          {/* ── TAB: MVR & Tests ────────────────────────────────────────── */}
          {tab === "tests" && (
            <>
              <SH title="12.5 — MVR and Background Check" />
              <R3>
                <C4><F label="MVR Check Date"><Input type="date" value={form.mvrCheckDate} onChange={s("mvrCheckDate")} /></F></C4>
                <C4><F label="MVR Next Review Date"><Input type="date" value={form.mvrNextReviewDate} onChange={s("mvrNextReviewDate")} /></F></C4>
                <C4><F label="MVR Status">
                  <Select value={form.mvrStatus || "__none__"} onValueChange={sel("mvrStatus")}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none__">—</SelectItem>
                      {MVR_STATUSES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </F></C4>
              </R3>
              <R2>
                <C6><F label="Background Check Date"><Input type="date" value={form.backgroundCheckDate} onChange={s("backgroundCheckDate")} /></F></C6>
                <C6><F label="Background Check Status">
                  <Select value={form.backgroundCheckStatus || "__none__"} onValueChange={sel("backgroundCheckStatus")}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none__">—</SelectItem>
                      {BACKGROUND_STATUSES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </F></C6>
              </R2>

              <SH title="12.6 — Drug, Alcohol and Clearinghouse" />
              <R3>
                <C4><F label="Drug Test Date"><Input type="date" value={form.drugTestDate} onChange={s("drugTestDate")} /></F></C4>
                <C4><F label="Drug Test Result">
                  <Select value={form.drugTestResult || "__none__"} onValueChange={sel("drugTestResult")}>
                    <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none__">—</SelectItem>
                      {DRUG_RESULTS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </F></C4>
                <C4><F label="Alcohol Test Date"><Input type="date" value={form.alcoholTestDate} onChange={s("alcoholTestDate")} /></F></C4>
              </R3>
              <R3>
                <C4><F label="Alcohol Test Result">
                  <Select value={form.alcoholTestResult || "__none__"} onValueChange={sel("alcoholTestResult")}>
                    <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none__">—</SelectItem>
                      {DRUG_RESULTS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </F></C4>
                <C4><F label="Clearinghouse Status">
                  <Select value={form.clearinghouseStatus || "__none__"} onValueChange={sel("clearinghouseStatus")}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none__">—</SelectItem>
                      {CLEARINGHOUSE_STATUSES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </F></C4>
                <C4><F label="Clearinghouse Last Query"><Input type="date" value={form.clearinghouseLastQueryDate} onChange={s("clearinghouseLastQueryDate")} /></F></C4>
              </R3>
              <R2>
                <C6><F label="Clearinghouse Next Query"><Input type="date" value={form.clearinghouseNextQueryDate} onChange={s("clearinghouseNextQueryDate")} /></F></C6>
                <C6></C6>
              </R2>
            </>
          )}

          {/* ── TAB: Safety & History ────────────────────────────────────── */}
          {tab === "safety" && (
            <>
              <SH title="12.7 — Safety History" />
              <R2>
                <C6><F label="Accident History"><Textarea rows={4} value={form.accidentHistory} onChange={s("accidentHistory")} placeholder="Describe any accidents…" /></F></C6>
                <C6><F label="Violation History"><Textarea rows={4} value={form.violationHistory} onChange={s("violationHistory")} placeholder="Describe any violations…" /></F></C6>
              </R2>

              <SH title="Notes and Tags" />
              <R2>
                <C6><F label="Notes"><Textarea rows={3} value={form.notes} onChange={s("notes")} /></F></C6>
                <C6>
                  <Label className="text-sm">Tags</Label>
                  <TagInput value={form.tags} onChange={tags => setForm(p => ({ ...p, tags }))} />
                </C6>
              </R2>
            </>
          )}

          {/* ── TAB: Assignments ─────────────────────────────────────────── */}
          {tab === "assignments" && (
            <>
              <SH title="12.9 — Assignments" />
              <p className="text-xs text-muted-foreground mb-4">Assign this driver to carrier, truck, and trailer records.</p>
              <R3>
                <C4><F label="Assigned Carrier ID"><Input value={(initialData as any)?.assignedCarrierId ?? ""} readOnly placeholder="Carrier ID (set via Carrier module)" className="bg-muted" /></F></C4>
                <C4><F label="Assigned Truck ID"><Input value={(initialData as any)?.assignedTruckId ?? ""} readOnly placeholder="Truck ID" className="bg-muted" /></F></C4>
                <C4><F label="Assigned Trailer ID"><Input value={(initialData as any)?.assignedTrailerId ?? ""} readOnly placeholder="Trailer ID" className="bg-muted" /></F></C4>
              </R3>
              <R3>
                <C4><F label="Last Load">
                  <div className="h-10 px-3 flex items-center text-sm border rounded-md bg-muted text-muted-foreground">
                    {initialData?.lastLoad ? String(initialData.lastLoad).slice(0, 10) : "No loads"}
                  </div>
                </F></C4>
                <C4><F label="Total Loads">
                  <div className="h-10 px-3 flex items-center text-sm border rounded-md bg-muted text-muted-foreground">
                    {initialData?.totalLoads ?? 0}
                  </div>
                </F></C4>
                <C4><F label="Last Assignment Date">
                  <div className="h-10 px-3 flex items-center text-sm border rounded-md bg-muted text-muted-foreground">
                    {initialData?.lastAssignmentDate ? String(initialData.lastAssignmentDate).slice(0, 10) : "—"}
                  </div>
                </F></C4>
              </R3>

              <SH title="12.10 — System Information" />
              <R2>
                <C6><F label="Created At">
                  <div className="h-10 px-3 flex items-center text-sm border rounded-md bg-muted text-muted-foreground">
                    {initialData?.createdAt ? new Date(initialData.createdAt).toLocaleString() : "—"}
                  </div>
                </F></C6>
                <C6><F label="Updated At">
                  <div className="h-10 px-3 flex items-center text-sm border rounded-md bg-muted text-muted-foreground">
                    {initialData?.updatedAt ? new Date(initialData.updatedAt).toLocaleString() : "—"}
                  </div>
                </F></C6>
              </R2>
            </>
          )}

          {err && <p className="text-sm text-destructive mt-2">Error: {err.message}</p>}

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4 sticky bottom-0 bg-background pb-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending || !form.fullName.trim()}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
