import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateBroker, useUpdateBroker } from "@workspace/api-client-react";
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

export function BrokerFormModal({ open, onClose, initialData }: Props) {
  const qc = useQueryClient();
  const isEdit = !!initialData;
  const createMutation = useCreateBroker();
  const updateMutation = useUpdateBroker();

  const [form, setForm] = useState({
    // Identity
    companyName: "",
    brokerType: "",
    status: "Active",
    priority: "",
    website: "",
    rating: "",
    // Identifiers
    mcNumber: "",
    usdotNumber: "",
    // Contact
    primaryContact: "",
    phone: "",
    email: "",
    lastContact: "",
    // Coverage
    coverage: "",
    // Payment
    paymentTerms: "",
    paymentDays: "",
    quickPay: false,
    quickPayFee: "",
    factoringAccepted: "",
    // Onboarding
    onboardingStatus: "",
    // Other
    notes: "",
  });

  // multi-value fields stored separately as comma-separated strings for easy editing
  const [freightTypes, setFreightTypes] = useState("");
  const [selectedStates, setSelectedStates] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        companyName: initialData.companyName ?? "",
        brokerType: initialData.brokerType ?? "",
        status: initialData.status ?? "Active",
        priority: initialData.priority ?? "",
        website: initialData.website ?? "",
        rating: initialData.rating?.toString() ?? "",
        mcNumber: initialData.mcNumber ?? "",
        usdotNumber: initialData.usdotNumber ?? "",
        primaryContact: initialData.primaryContact ?? "",
        phone: initialData.phone ?? "",
        email: initialData.email ?? "",
        lastContact: initialData.lastContact?.slice(0, 10) ?? "",
        coverage: initialData.coverage ?? "",
        paymentTerms: initialData.paymentTerms ?? "",
        paymentDays: initialData.paymentDays?.toString() ?? "",
        quickPay: initialData.quickPay ?? false,
        quickPayFee: initialData.quickPayFee?.toString() ?? "",
        factoringAccepted: initialData.factoringAccepted ?? "",
        onboardingStatus: initialData.onboardingStatus ?? "",
        notes: initialData.notes ?? "",
      });
      setFreightTypes((initialData.freightTypes ?? []).join(", "));
      setSelectedStates((initialData.selectedStates ?? []).join(", "));
      setTags((initialData.tags ?? []).join(", "));
    } else {
      setForm({
        companyName: "", brokerType: "", status: "Active", priority: "", website: "", rating: "",
        mcNumber: "", usdotNumber: "",
        primaryContact: "", phone: "", email: "", lastContact: "",
        coverage: "",
        paymentTerms: "", paymentDays: "", quickPay: false, quickPayFee: "", factoringAccepted: "",
        onboardingStatus: "",
        notes: "",
      });
      setFreightTypes("");
      setSelectedStates("");
      setTags("");
    }
  }, [initialData, open]);

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const sel = (k: keyof typeof form) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v === "__none__" ? "" : v }));

  const splitArr = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = (v: string) => v || undefined;

    const payload = {
      companyName: form.companyName,
      brokerType: s(form.brokerType),
      status: s(form.status),
      priority: s(form.priority),
      website: s(form.website),
      rating: form.rating ? parseFloat(form.rating) : undefined,
      mcNumber: s(form.mcNumber),
      usdotNumber: s(form.usdotNumber),
      primaryContact: s(form.primaryContact),
      phone: s(form.phone),
      email: s(form.email),
      lastContact: s(form.lastContact),
      coverage: s(form.coverage),
      freightTypes: freightTypes ? splitArr(freightTypes) : undefined,
      selectedStates: selectedStates ? splitArr(selectedStates) : undefined,
      tags: tags ? splitArr(tags) : undefined,
      paymentTerms: s(form.paymentTerms),
      paymentDays: form.paymentDays ? parseInt(form.paymentDays) : undefined,
      quickPay: form.quickPay,
      quickPayFee: form.quickPayFee ? parseFloat(form.quickPayFee) : undefined,
      factoringAccepted: s(form.factoringAccepted),
      onboardingStatus: s(form.onboardingStatus),
      notes: s(form.notes),
    };

    if (isEdit) {
      updateMutation.mutate(
        { brokerId: initialData!.id, data: payload },
        { onSuccess: () => { qc.invalidateQueries({ queryKey: ["brokers"] }); onClose(); } }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        { onSuccess: () => { qc.invalidateQueries({ queryKey: ["brokers"] }); onClose(); } }
      );
    }
  };

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
            {isEdit ? `Edit Broker — ${initialData?.companyName}` : "Add Broker"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mt-2">

          {/* ── Identity ── */}
          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Company Name *</Label>
            <Input required value={form.companyName} onChange={f("companyName")} placeholder="XYZ Logistics Inc." />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Broker Type</Label>
            <Select value={form.brokerType || "__none__"} onValueChange={sel("brokerType")}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                <SelectItem value="Freight Broker">Freight Broker</SelectItem>
                <SelectItem value="Freight Forwarder">Freight Forwarder</SelectItem>
                <SelectItem value="3PL">3PL</SelectItem>
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

          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Website</Label>
            <Input value={form.website} onChange={f("website")} placeholder="https://..." />
          </div>

          {/* ── Identifiers ── */}
          <Section title="Identifiers" />

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">MC Number</Label>
            <Input value={form.mcNumber} onChange={f("mcNumber")} placeholder="MC-123456" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">USDOT Number</Label>
            <Input value={form.usdotNumber} onChange={f("usdotNumber")} placeholder="DOT-1234567" />
          </div>

          {/* ── Contact ── */}
          <Section title="Contact" />

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Primary Contact</Label>
            <Input value={form.primaryContact} onChange={f("primaryContact")} placeholder="Jane Smith" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Phone</Label>
            <Input value={form.phone} onChange={f("phone")} placeholder="(555) 555-5555" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Email</Label>
            <Input type="email" value={form.email} onChange={f("email")} placeholder="contact@broker.com" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Last Contact</Label>
            <Input type="date" value={form.lastContact} onChange={f("lastContact")} />
          </div>

          {/* ── Coverage ── */}
          <Section title="Coverage" />

          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Coverage Area</Label>
            <Input value={form.coverage} onChange={f("coverage")} placeholder="Nationwide, Midwest, Southeast..." />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Freight Types <span className="text-muted-foreground">(comma-separated)</span></Label>
            <Input value={freightTypes} onChange={(e) => setFreightTypes(e.target.value)} placeholder="Dry Van, Flatbed, Reefer..." />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Selected States <span className="text-muted-foreground">(comma-separated, e.g. TX, FL, CA)</span></Label>
            <Input value={selectedStates} onChange={(e) => setSelectedStates(e.target.value)} placeholder="TX, FL, CA..." />
          </div>

          {/* ── Payment Terms ── */}
          <Section title="Payment Terms" />

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Payment Terms</Label>
            <Select value={form.paymentTerms || "__none__"} onValueChange={sel("paymentTerms")}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                <SelectItem value="Net 15">Net 15</SelectItem>
                <SelectItem value="Net 30">Net 30</SelectItem>
                <SelectItem value="Net 45">Net 45</SelectItem>
                <SelectItem value="Net 60">Net 60</SelectItem>
                <SelectItem value="QuickPay">QuickPay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Payment Days</Label>
            <Input type="number" min="0" value={form.paymentDays} onChange={f("paymentDays")} placeholder="30" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">QuickPay Fee (%)</Label>
            <Input type="number" step="0.01" min="0" value={form.quickPayFee} onChange={f("quickPayFee")} placeholder="2.5" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Factoring Accepted</Label>
            <Select value={form.factoringAccepted || "__none__"} onValueChange={sel("factoringAccepted")}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unknown</SelectItem>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="quickPayBroker"
              checked={form.quickPay}
              onChange={(e) => setForm((p) => ({ ...p, quickPay: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="quickPayBroker" className="font-mono text-xs cursor-pointer">QuickPay Available</Label>
          </div>

          {/* ── Onboarding ── */}
          <Section title="Onboarding" />

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Onboarding Status</Label>
            <Select value={form.onboardingStatus || "__none__"} onValueChange={sel("onboardingStatus")}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── Tags / Notes ── */}
          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Tags <span className="text-muted-foreground">(comma-separated)</span></Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="preferred, top-lane..." />
          </div>

          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={f("notes")} rows={3} />
          </div>

          <div className="col-span-2 flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Broker"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
