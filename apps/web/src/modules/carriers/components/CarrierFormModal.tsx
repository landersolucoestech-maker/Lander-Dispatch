import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateCarrier, useUpdateCarrier, useListCrmContacts } from "@workspace/api-client-react";
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

type FleetEntry = {
  truck: { year: string; make: string; model: string; vin: string; color: string; plateNumber: string };
  trailer: { year: string; make: string; model: string; vin: string; color: string; plateNumber: string };
  driver: { name: string; phone: string; email: string };
};

const emptyFleet = (): FleetEntry => ({
  truck: { year: "", make: "", model: "", vin: "", color: "", plateNumber: "" },
  trailer: { year: "", make: "", model: "", vin: "", color: "", plateNumber: "" },
  driver: { name: "", phone: "", email: "" },
});

export function CarrierFormModal({ open, onClose, initialData }: Props) {
  const qc = useQueryClient();
  const isEdit = !!initialData;
  const createMutation = useCreateCarrier();
  const updateMutation = useUpdateCarrier();

  const [form, setForm] = useState({
    companyName: "",
    carrierType: "",
    status: "Active",
    priority: "",
    website: "",
    email: "",
    mcNumber: "",
    usdotNumber: "",
    einNumber: "",
    authorityStatus: "",
    insuranceExpiration: "",
    ratePerMile: "",
    primaryContact: "",
    phone: "",
    companyAddress: "",
    companyCity: "",
    companyState: "",
    companyZip: "",
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
    rating: "",
    notes: "",
    operatingStates: "",
    lastLoadDate: "",
    tags: "",
  });

  const [fleet, setFleet] = useState<FleetEntry[]>([]);

  useEffect(() => {
    if (initialData) {
      setForm({
        companyName: initialData.companyName ?? "",
        carrierType: initialData.carrierType ?? "",
        status: initialData.status ?? "Active",
        priority: initialData.priority ?? "",
        website: initialData.website ?? "",
        email: initialData.email ?? "",
        mcNumber: initialData.mcNumber ?? "",
        usdotNumber: initialData.usdotNumber ?? "",
        einNumber: initialData.einNumber ?? "",
        authorityStatus: initialData.authorityStatus ?? "",
        insuranceExpiration: initialData.insuranceExpiration?.slice(0, 10) ?? "",
        ratePerMile: initialData.ratePerMile?.toString() ?? "",
        primaryContact: initialData.primaryContact ?? "",
        phone: initialData.phone ?? "",
        companyAddress: initialData.companyAddress ?? "",
        companyCity: initialData.companyCity ?? "",
        companyState: initialData.companyState ?? "",
        companyZip: initialData.companyZip ?? "",
        factoringCompany: initialData.factoringCompany ?? "",
        factoringFee: initialData.factoringFee?.toString() ?? "",
        bankName: initialData.bankName ?? "",
        accountHolder: initialData.accountHolder ?? "",
        accountNumber: initialData.accountNumber ?? "",
        routingNumber: initialData.routingNumber ?? "",
        bankAddress: initialData.bankAddress ?? "",
        bankCity: initialData.bankCity ?? "",
        bankState: initialData.bankState ?? "",
        bankZip: initialData.bankZip ?? "",
        zelleAccount: initialData.zelleAccount ?? "",
        cashAppAccount: initialData.cashAppAccount ?? "",
        rating: initialData.rating?.toString() ?? "",
        notes: initialData.notes ?? "",
        operatingStates: initialData.operatingStates?.join(", ") ?? "",
        lastLoadDate: initialData.lastLoadDate?.toString().slice(0, 10) ?? "",
        tags: initialData.tags?.join(", ") ?? "",
      });
      setFleet((initialData as any).fleetData?.length ? (initialData as any).fleetData : []);
    } else {
      setForm({
        companyName: "", carrierType: "", status: "Active", priority: "", website: "", email: "",
        mcNumber: "", usdotNumber: "", einNumber: "", authorityStatus: "", insuranceExpiration: "",
        ratePerMile: "",
        primaryContact: "", phone: "",
        companyAddress: "", companyCity: "", companyState: "", companyZip: "",
        factoringCompany: "", factoringFee: "",
        bankName: "", accountHolder: "", accountNumber: "", routingNumber: "",
        bankAddress: "", bankCity: "", bankState: "", bankZip: "",
        zelleAccount: "", cashAppAccount: "",
        rating: "", notes: "",
        operatingStates: "", lastLoadDate: "", tags: "",
      });
      setFleet([]);
    }
  }, [initialData, open]);

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const sel = (k: keyof typeof form) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v === "__none__" ? "" : v }));

  const updateFleet = (
    i: number,
    section: "truck" | "trailer" | "driver",
    field: string,
    value: string
  ) => {
    setFleet((p) => {
      const next = [...p];
      next[i] = { ...next[i], [section]: { ...next[i][section], [field]: value } };
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = (v: string) => (v ? parseFloat(v) : undefined);
    const s = (v: string) => v || undefined;

    const payload = {
      companyName: form.companyName,
      carrierType: s(form.carrierType),
      status: s(form.status),
      priority: s(form.priority),
      website: s(form.website),
      email: s(form.email),
      mcNumber: s(form.mcNumber),
      usdotNumber: s(form.usdotNumber),
      einNumber: s(form.einNumber),
      authorityStatus: s(form.authorityStatus),
      insuranceExpiration: s(form.insuranceExpiration),
      ratePerMile: n(form.ratePerMile),
      primaryContact: s(form.primaryContact),
      phone: s(form.phone),
      companyAddress: s(form.companyAddress),
      companyCity: s(form.companyCity),
      companyState: s(form.companyState),
      companyZip: s(form.companyZip),
      fleetData: fleet,
      factoringCompany: s(form.factoringCompany),
      factoringFee: n(form.factoringFee),
      bankName: s(form.bankName),
      accountHolder: s(form.accountHolder),
      accountNumber: s(form.accountNumber),
      routingNumber: s(form.routingNumber),
      bankAddress: s(form.bankAddress),
      bankCity: s(form.bankCity),
      bankState: s(form.bankState),
      bankZip: s(form.bankZip),
      zelleAccount: s(form.zelleAccount),
      cashAppAccount: s(form.cashAppAccount),
      rating: n(form.rating),
      notes: s(form.notes),
      operatingStates: form.operatingStates.trim() ? form.operatingStates.split(",").map((v) => v.trim()).filter(Boolean) : undefined,
      lastLoadDate: s(form.lastLoadDate),
      tags: form.tags.trim() ? form.tags.split(",").map((v) => v.trim()).filter(Boolean) : undefined,
    };

    if (isEdit) {
      updateMutation.mutate(
        { carrierId: initialData!.id, data: payload },
        { onSuccess: () => { qc.invalidateQueries({ queryKey: ["carriers"] }); onClose(); } }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        { onSuccess: () => { qc.invalidateQueries({ queryKey: ["carriers"] }); onClose(); } }
      );
    }
  };

  const { data: contactsData } = useListCrmContacts({ query: { pageSize: 200 } as any });
  const contacts = contactsData?.contacts ?? [];

  const isPending = createMutation.isPending || updateMutation.isPending;

  const Section = ({ title }: { title: string }) => (
    <div className="col-span-2 border-t border-border pt-3">
      <p className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-widest">{title}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-widest text-sm">
            {isEdit ? `Edit Carrier — ${initialData?.companyName}` : "Add Carrier"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mt-2">

          {/* ── Identity ── */}
          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Company Name *</Label>
            <Input required value={form.companyName} onChange={f("companyName")} placeholder="ACME Trucking LLC" />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Carrier Type</Label>
            <Select value={form.carrierType || "__none__"} onValueChange={sel("carrierType")}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                <SelectItem value="Open Trailer">Open Trailer</SelectItem>
                <SelectItem value="Enclosed Trailer">Enclosed Trailer</SelectItem>
                <SelectItem value="Hotshot">Hotshot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">ACTIVE</SelectItem>
                <SelectItem value="Inactive">INACTIVE</SelectItem>
                <SelectItem value="Pending">PENDING</SelectItem>
                <SelectItem value="Blacklisted">BLACKLISTED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Priority</Label>
            <Select value={form.priority || "__none__"} onValueChange={sel("priority")}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Rating (0–5)</Label>
            <Input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={f("rating")} placeholder="0.0" />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Website</Label>
            <Input value={form.website} onChange={f("website")} placeholder="https://..." />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Email</Label>
            <Input type="email" value={form.email} onChange={f("email")} placeholder="contact@company.com" />
          </div>

          {/* ── Identifiers ── */}
          <Section title="Identifiers & Authority" />

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">MC Number</Label>
            <Input value={form.mcNumber} onChange={f("mcNumber")} placeholder="MC-123456" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">USDOT Number</Label>
            <Input value={form.usdotNumber} onChange={f("usdotNumber")} placeholder="DOT-1234567" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">EIN Number</Label>
            <Input value={form.einNumber} onChange={f("einNumber")} placeholder="12-3456789" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Authority Status</Label>
            <Select value={form.authorityStatus || "__none__"} onValueChange={sel("authorityStatus")}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unknown</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Insurance Expiration</Label>
            <Input type="date" value={form.insuranceExpiration} onChange={f("insuranceExpiration")} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Rate / Mile ($)</Label>
            <Input type="number" step="0.01" min="0" value={form.ratePerMile} onChange={f("ratePerMile")} placeholder="0.00" />
          </div>

          {/* ── Contact ── */}
          <Section title="Contact" />

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Primary Contact</Label>
            <Input value={form.primaryContact} onChange={f("primaryContact")} placeholder="John Doe" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Phone</Label>
            <Input value={form.phone} onChange={f("phone")} placeholder="(555) 555-5555" />
          </div>

          {/* ── Address ── */}
          <Section title="Address" />

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Street Address</Label>
            <Input value={form.companyAddress} onChange={f("companyAddress")} placeholder="123 Main St" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">City</Label>
            <Input value={form.companyCity} onChange={f("companyCity")} placeholder="Chicago" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">State</Label>
            <Input value={form.companyState} onChange={f("companyState")} maxLength={2} placeholder="IL" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">ZIP</Label>
            <Input value={form.companyZip} onChange={f("companyZip")} placeholder="60601" />
          </div>

          {/* ── Fleet ── */}
          <Section title="Fleet" />

          <div className="col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] text-muted-foreground">Each entry groups one truck, one trailer and one driver.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 font-mono text-[10px] gap-1"
                onClick={() => setFleet((p) => [...p, emptyFleet()])}
              >
                <Plus className="w-3 h-3" /> Add Fleet
              </Button>
            </div>

            {fleet.map((entry, i) => (
              <div key={i} className="border border-border rounded p-3 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">Fleet #{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setFleet((p) => p.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Truck */}
                <div>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-2">Truck</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">Year</Label>
                      <Input value={entry.truck.year} onChange={(e) => updateFleet(i, "truck", "year", e.target.value)} placeholder="2022" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">Make</Label>
                      <Input value={entry.truck.make} onChange={(e) => updateFleet(i, "truck", "make", e.target.value)} placeholder="Kenworth" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">Model</Label>
                      <Input value={entry.truck.model} onChange={(e) => updateFleet(i, "truck", "model", e.target.value)} placeholder="T680" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">VIN</Label>
                      <Input value={entry.truck.vin} onChange={(e) => updateFleet(i, "truck", "vin", e.target.value)} placeholder="1XKWD49X0NJ123456" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">Color</Label>
                      <Input value={entry.truck.color} onChange={(e) => updateFleet(i, "truck", "color", e.target.value)} placeholder="White" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">Plate Number</Label>
                      <Input value={entry.truck.plateNumber} onChange={(e) => updateFleet(i, "truck", "plateNumber", e.target.value)} placeholder="ABC-1234" />
                    </div>
                  </div>
                </div>

                {/* Trailer */}
                <div>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-2">Trailer</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">Year</Label>
                      <Input value={entry.trailer.year} onChange={(e) => updateFleet(i, "trailer", "year", e.target.value)} placeholder="2021" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">Make</Label>
                      <Input value={entry.trailer.make} onChange={(e) => updateFleet(i, "trailer", "make", e.target.value)} placeholder="Wabash" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">Model</Label>
                      <Input value={entry.trailer.model} onChange={(e) => updateFleet(i, "trailer", "model", e.target.value)} placeholder="National" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">VIN</Label>
                      <Input value={entry.trailer.vin} onChange={(e) => updateFleet(i, "trailer", "vin", e.target.value)} placeholder="1JJV532W5ML123456" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">Color</Label>
                      <Input value={entry.trailer.color} onChange={(e) => updateFleet(i, "trailer", "color", e.target.value)} placeholder="White" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">Plate Number</Label>
                      <Input value={entry.trailer.plateNumber} onChange={(e) => updateFleet(i, "trailer", "plateNumber", e.target.value)} placeholder="TRL-5678" />
                    </div>
                  </div>
                </div>

                {/* Driver */}
                <div>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-2">Driver</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">Name</Label>
                      <Input value={entry.driver.name} onChange={(e) => updateFleet(i, "driver", "name", e.target.value)} placeholder="John Doe" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">Phone</Label>
                      <Input value={entry.driver.phone} onChange={(e) => updateFleet(i, "driver", "phone", e.target.value)} placeholder="(555) 000-0000" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-mono text-xs">Email</Label>
                      <Input type="email" value={entry.driver.email} onChange={(e) => updateFleet(i, "driver", "email", e.target.value)} placeholder="driver@email.com" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {fleet.length === 0 && (
              <p className="font-mono text-[10px] text-muted-foreground italic">No fleet entries added.</p>
            )}
          </div>

          {/* ── Payment ── */}
          <Section title="Payment" />

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Factoring Company</Label>
            <Select value={form.factoringCompany || "__none__"} onValueChange={sel("factoringCompany")}>
              <SelectTrigger><SelectValue placeholder="Select contact..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {contacts.map((c: any) => (
                  <SelectItem key={c.id} value={c.companyName}>{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Factoring Fee (%)</Label>
            <Input type="number" step="0.01" min="0" value={form.factoringFee} onChange={f("factoringFee")} placeholder="0.00" />
          </div>

          {/* ── Banking ── */}
          <Section title="Banking" />

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Bank Name</Label>
            <Input value={form.bankName} onChange={f("bankName")} placeholder="Wells Fargo" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Account Holder</Label>
            <Input value={form.accountHolder} onChange={f("accountHolder")} placeholder="John Doe" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Account Number</Label>
            <Input value={form.accountNumber} onChange={f("accountNumber")} placeholder="••••••••" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Routing Number</Label>
            <Input value={form.routingNumber} onChange={f("routingNumber")} placeholder="123456789" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Bank Address</Label>
            <Input value={form.bankAddress} onChange={f("bankAddress")} placeholder="123 Bank St" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Bank City</Label>
            <Input value={form.bankCity} onChange={f("bankCity")} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Bank State</Label>
            <Input value={form.bankState} onChange={f("bankState")} maxLength={2} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Bank ZIP</Label>
            <Input value={form.bankZip} onChange={f("bankZip")} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Zelle Account</Label>
            <Input value={form.zelleAccount} onChange={f("zelleAccount")} placeholder="phone or email" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Cash App Account</Label>
            <Input value={form.cashAppAccount} onChange={f("cashAppAccount")} placeholder="$cashtag" />
          </div>

          {/* ── Operations ── */}
          <Section title="Operations" />

          <div className="col-span-2 grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="font-mono text-xs">Operating States</Label>
              <Input value={form.operatingStates} onChange={f("operatingStates")} placeholder="IL, TX, CA" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="font-mono text-xs">Last Load Date</Label>
              <Input type="date" value={form.lastLoadDate} onChange={f("lastLoadDate")} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="font-mono text-xs">Tags</Label>
              <Input value={form.tags} onChange={f("tags")} placeholder="flatbed, reefer" />
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={f("notes")} rows={3} />
          </div>

          <div className="col-span-2 flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Carrier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
