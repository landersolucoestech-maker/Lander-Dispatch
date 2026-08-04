import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ExtractedVehicle {
  vehicleNumber: number;
  year?: string;
  make?: string;
  model?: string;
  type?: string;
  color?: string;
  plate?: string;
  vin?: string;
  lotNumber?: string;
}

interface ExtractedLoad {
  documentType?: string;
  status?: string;
  dispatchDate?: string;
  carrierName?: string;
  brokerName?: string;
  pickupName?: string;
  pickupAddress?: string;
  pickupCity?: string;
  pickupState?: string;
  pickupZip?: string;
  pickupPhone?: string;
  pickupDate?: string;
  pickupDeadline?: string;
  pickupInstructions?: string;
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZip?: string;
  deliveryPhone?: string;
  deliveryDate?: string;
  deliveryDeadline?: string;
  deliveryInstructions?: string;
  miles?: number;
  rate?: number;
  paymentMethod?: string;
  dispatchInstructions?: string;
  vehicles?: ExtractedVehicle[];
  referenceNumbers?: string[];
  notes?: string;
}

type Step = "upload" | "extracting" | "review" | "saved";

const DOC_TYPE_LABEL: Record<string, string> = {
  dispatch_sheet: "Dispatch Sheet",
  rate_confirmation: "Rate Confirmation",
  bol: "Bill of Lading",
  unknown: "Document",
};

export function LoadImportPdfModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedLoad | null>(null);
  const [saving, setSaving] = useState(false);
  const [vehiclesExpanded, setVehiclesExpanded] = useState(true);

  // Editable form state mirroring extracted data
  const [form, setForm] = useState<ExtractedLoad>({});

  const reset = () => {
    setStep("upload");
    setError(null);
    setExtracted(null);
    setForm({});
    setSaving(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    setError(null);
    setStep("extracting");

    try {
      const fd = new FormData();
      fd.append("pdf", file);
      const res = await fetch("/api/loads/parse-pdf", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Extraction failed.");
        setStep("upload");
        return;
      }
      const data: ExtractedLoad = json.extracted ?? {};
      setExtracted(data);
      setForm({ ...data });
      setStep("review");
    } catch {
      setError("Network error — could not reach server.");
      setStep("upload");
    }
  };

  const f = (k: keyof ExtractedLoad) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value || undefined }));

  const updateVehicle = (idx: number, field: keyof ExtractedVehicle, value: string) =>
    setForm((p) => {
      const vehicles = [...(p.vehicles ?? [])];
      vehicles[idx] = { ...vehicles[idx], [field]: value || undefined };
      return { ...p, vehicles };
    });

  const removeVehicle = (idx: number) =>
    setForm((p) => ({
      ...p,
      vehicles: (p.vehicles ?? []).filter((_, i) => i !== idx).map((v, i) => ({ ...v, vehicleNumber: i + 1 })),
    }));

  const addVehicle = () =>
    setForm((p) => ({
      ...p,
      vehicles: [...(p.vehicles ?? []), { vehicleNumber: (p.vehicles?.length ?? 0) + 1 }],
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        status: form.status || "Dispatched",
        dispatchDate: form.dispatchDate || undefined,
        pickupCity: form.pickupCity || undefined,
        pickupState: form.pickupState || undefined,
        pickupZip: form.pickupZip || undefined,
        pickupEstimated: form.pickupDate || undefined,
        pickupDeadline: form.pickupDeadline || undefined,
        pickupInstructions: form.pickupInstructions || undefined,
        deliveryCity: form.deliveryCity || undefined,
        deliveryState: form.deliveryState || undefined,
        deliveryZip: form.deliveryZip || undefined,
        deliveryEstimated: form.deliveryDate || undefined,
        deliveryDeadline: form.deliveryDeadline || undefined,
        deliveryInstructions: form.deliveryInstructions || undefined,
        miles: form.miles ?? undefined,
        rate: form.rate ?? undefined,
        paymentMethod: form.paymentMethod || undefined,
        dispatchInstructions: form.dispatchInstructions || undefined,
        vehicles: form.vehicles && form.vehicles.length > 0 ? form.vehicles : undefined,
        notes: [
          form.notes,
          form.referenceNumbers?.length ? `Ref: ${form.referenceNumbers.join(", ")}` : null,
          form.carrierName ? `Carrier (from doc): ${form.carrierName}` : null,
          form.brokerName ? `Broker (from doc): ${form.brokerName}` : null,
        ].filter(Boolean).join("\n") || undefined,
      };

      const res = await fetch("/api/loads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to save load.");
        setSaving(false);
        return;
      }

      qc.invalidateQueries({ queryKey: ["loads"] });
      setStep("saved");
    } catch {
      setError("Network error.");
      setSaving(false);
    }
  };

  const docLabel = DOC_TYPE_LABEL[extracted?.documentType ?? ""] ?? "Document";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-widest text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Import Load from PDF
          </DialogTitle>
        </DialogHeader>

        {/* ── UPLOAD ── */}
        {step === "upload" && (
          <div className="mt-4 space-y-4">
            <div
              className="border border-dashed border-border p-10 flex flex-col items-center gap-3 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <FileText className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="font-mono text-sm font-medium">Click to upload a PDF document</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  Central Dispatch sheet · Rate Confirmation · Bill of Lading
                </p>
              </div>
              <Button variant="outline" className="font-mono text-xs gap-2" type="button">
                <Upload className="w-3 h-3" /> Choose PDF
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFile}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 border border-destructive bg-destructive/5 p-3 text-sm font-mono text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="border border-border p-4 space-y-1">
              <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-2">Supported Documents</p>
              <p className="font-mono text-xs text-muted-foreground">• Central Dispatch dispatch sheets (vehicles, pickup/delivery)</p>
              <p className="font-mono text-xs text-muted-foreground">• Rate confirmations (rate, terms, reference numbers)</p>
              <p className="font-mono text-xs text-muted-foreground">• Bills of Lading (BOL)</p>
              <p className="font-mono text-xs text-muted-foreground">• Max 20 MB · Must be digital PDF (not scanned image)</p>
            </div>
          </div>
        )}

        {/* ── EXTRACTING ── */}
        {step === "extracting" && (
          <div className="mt-8 flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="font-mono text-sm">Extracting data from PDF...</p>
            <p className="font-mono text-xs text-muted-foreground">AI is reading the document</p>
          </div>
        )}

        {/* ── REVIEW ── */}
        {step === "review" && form && (
          <div className="mt-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 border border-border bg-card p-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="font-mono text-sm font-bold">{docLabel} detected</p>
                <p className="font-mono text-xs text-muted-foreground">Review and correct any fields before saving</p>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto font-mono text-xs gap-1" onClick={() => { reset(); }}>
                ← Upload Different
              </Button>
            </div>

            {error && (
              <div className="flex items-start gap-2 border border-destructive bg-destructive/5 p-3 text-sm font-mono text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">

              {/* Status + Dispatch Date */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Status</Label>
                <Select
                  value={form.status || "Dispatched"}
                  onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["New","Dispatched","Picked Up","In Route","Delivered","Canceled"].map((s) => (
                      <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Dispatch Date</Label>
                <Input type="date" value={form.dispatchDate ?? ""} onChange={f("dispatchDate")} />
              </div>

              {/* Carrier / Broker (doc-extracted, read-only hint) */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Carrier (from doc)</Label>
                <Input value={form.carrierName ?? ""} onChange={f("carrierName")} placeholder="Will be matched on save" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Broker (from doc)</Label>
                <Input value={form.brokerName ?? ""} onChange={f("brokerName")} placeholder="Will be matched on save" />
              </div>

              {/* Pickup */}
              <div className="col-span-2 border-t border-border pt-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2 tracking-widest">Pickup</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">City</Label>
                    <Input value={form.pickupCity ?? ""} onChange={f("pickupCity")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">State</Label>
                    <Input value={form.pickupState ?? ""} onChange={f("pickupState")} maxLength={2} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">ZIP</Label>
                    <Input value={form.pickupZip ?? ""} onChange={f("pickupZip")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">Est. Pickup</Label>
                    <Input type="date" value={form.pickupDate ?? ""} onChange={f("pickupDate")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">Deadline</Label>
                    <Input type="date" value={form.pickupDeadline ?? ""} onChange={f("pickupDeadline")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">Phone</Label>
                    <Input value={form.pickupPhone ?? ""} onChange={f("pickupPhone")} />
                  </div>
                  <div className="col-span-3 flex flex-col gap-1">
                    <Label className="font-mono text-xs">Pickup Name / Address</Label>
                    <Input value={`${form.pickupName ?? ""} ${form.pickupAddress ?? ""}`.trim()} placeholder="Origin name & address" readOnly className="text-muted-foreground text-xs" />
                  </div>
                  {form.pickupInstructions && (
                    <div className="col-span-3 flex flex-col gap-1">
                      <Label className="font-mono text-xs">Pickup Instructions</Label>
                      <Textarea value={form.pickupInstructions ?? ""} onChange={f("pickupInstructions")} rows={2} />
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery */}
              <div className="col-span-2 border-t border-border pt-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2 tracking-widest">Delivery</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">City</Label>
                    <Input value={form.deliveryCity ?? ""} onChange={f("deliveryCity")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">State</Label>
                    <Input value={form.deliveryState ?? ""} onChange={f("deliveryState")} maxLength={2} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">ZIP</Label>
                    <Input value={form.deliveryZip ?? ""} onChange={f("deliveryZip")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">Est. Delivery</Label>
                    <Input type="date" value={form.deliveryDate ?? ""} onChange={f("deliveryDate")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">Deadline</Label>
                    <Input type="date" value={form.deliveryDeadline ?? ""} onChange={f("deliveryDeadline")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">Phone</Label>
                    <Input value={form.deliveryPhone ?? ""} onChange={f("deliveryPhone")} />
                  </div>
                  <div className="col-span-3 flex flex-col gap-1">
                    <Label className="font-mono text-xs">Delivery Name / Address</Label>
                    <Input value={`${form.deliveryName ?? ""} ${form.deliveryAddress ?? ""}`.trim()} placeholder="Destination name & address" readOnly className="text-muted-foreground text-xs" />
                  </div>
                  {form.deliveryInstructions && (
                    <div className="col-span-3 flex flex-col gap-1">
                      <Label className="font-mono text-xs">Delivery Instructions</Label>
                      <Textarea value={form.deliveryInstructions ?? ""} onChange={f("deliveryInstructions")} rows={2} />
                    </div>
                  )}
                </div>
              </div>

              {/* Financials */}
              <div className="col-span-2 border-t border-border pt-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2 tracking-widest">Financials</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">Rate ($)</Label>
                    <Input type="number" step="0.01" value={form.rate?.toString() ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value ? parseFloat(e.target.value) : undefined }))} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">Miles</Label>
                    <Input type="number" step="0.1" value={form.miles?.toString() ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, miles: e.target.value ? parseFloat(e.target.value) : undefined }))} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">Payment Method</Label>
                    <Input value={form.paymentMethod ?? ""} onChange={f("paymentMethod")} placeholder="Check, ACH..." />
                  </div>
                </div>
              </div>

              {/* Dispatch Instructions */}
              {(form.dispatchInstructions || form.notes) && (
                <div className="col-span-2 flex flex-col gap-1">
                  <Label className="font-mono text-xs">Instructions / Notes</Label>
                  <Textarea
                    value={[form.dispatchInstructions, form.notes].filter(Boolean).join("\n\n") ?? ""}
                    rows={3}
                    readOnly
                    className="text-xs text-muted-foreground"
                  />
                </div>
              )}

              {/* Reference Numbers */}
              {form.referenceNumbers && form.referenceNumbers.length > 0 && (
                <div className="col-span-2 flex flex-col gap-1">
                  <Label className="font-mono text-xs">Reference Numbers</Label>
                  <div className="flex flex-wrap gap-1">
                    {form.referenceNumbers.map((r, i) => (
                      <span key={i} className="font-mono text-[10px] border border-border px-2 py-0.5 bg-card">{r}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicles */}
              <div className="col-span-2 border-t border-border pt-3">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 font-mono text-[10px] uppercase text-muted-foreground tracking-widest"
                    onClick={() => setVehiclesExpanded((v) => !v)}
                  >
                    {vehiclesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Vehicles ({form.vehicles?.length ?? 0})
                  </button>
                  <Button type="button" variant="outline" size="sm" className="font-mono text-xs gap-1" onClick={addVehicle}>
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </div>
                {vehiclesExpanded && (
                  <div className="space-y-2">
                    {(form.vehicles ?? []).length === 0 && (
                      <p className="font-mono text-xs text-muted-foreground">No vehicles extracted — add manually.</p>
                    )}
                    {(form.vehicles ?? []).map((veh, idx) => (
                      <div key={idx} className="border border-border p-3 grid grid-cols-4 gap-2">
                        <div className="col-span-4 flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                            Vehicle #{veh.vehicleNumber}
                          </span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeVehicle(idx)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                        {(["year","make","model","type","color","plate","vin","lotNumber"] as (keyof ExtractedVehicle)[]).map((field) => (
                          <div key={field} className={`flex flex-col gap-1 ${field === "vin" || field === "lotNumber" ? "col-span-2" : ""}`}>
                            <Label className="font-mono text-[10px] uppercase">{field === "lotNumber" ? "Lot #" : field}</Label>
                            <Input
                              value={(veh[field] as string) ?? ""}
                              onChange={(e) => updateVehicle(idx, field, e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-border pt-4">
              <Button variant="outline" className="font-mono text-xs" onClick={reset}>
                ← Re-upload
              </Button>
              <Button className="font-mono text-xs gap-2" disabled={saving} onClick={handleSave}>
                {saving ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                ) : (
                  <><Pencil className="w-3 h-3" /> Save Load</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── SAVED ── */}
        {step === "saved" && (
          <div className="mt-8 flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <p className="font-mono text-sm font-bold">Load created successfully</p>
            <p className="font-mono text-xs text-muted-foreground">
              {extracted?.documentType === "dispatch_sheet" && "Dispatch sheet imported."}
              {extracted?.documentType === "rate_confirmation" && "Rate confirmation imported."}
              {extracted?.documentType === "bol" && "BOL imported."}
              {(!extracted?.documentType || extracted.documentType === "unknown") && "Document imported."}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="font-mono text-xs" onClick={reset}>
                Import Another
              </Button>
              <Button className="font-mono text-xs" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
