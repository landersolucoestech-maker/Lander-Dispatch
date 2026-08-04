import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateInvoice,
  useUpdateInvoice,
  useListCarriers,
  useListLoads,
} from "@workspace/api-client-react";
import { buildInvoiceDescription } from "@/shared/lib/invoice-utils";
import type { Invoice } from "@workspace/api-client-react";
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
  initialData?: Invoice;
}

const STATUS_OPTIONS = ["Draft", "Sent", "Paid", "Overdue", "Void"];

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// ── Load row in the selector table ─────────────────────────────────────────
function LoadSelectorRow({
  load,
  checked,
  onToggle,
}: {
  load: any;
  checked: boolean;
  onToggle: () => void;
}) {
  const vehicles: any[] = load.vehicles ?? [];
  const rate = parseFloat(String(load.rate ?? "0")) || 0;
  const rows = vehicles.length > 0 ? vehicles : [null];
  const dispatchDate: string | null = (load as any).dispatchDate ?? null;

  return (
    <>
      {rows.map((v: any, i: number) => (
        <label
          key={i}
          className={`grid items-center gap-x-3 px-3 py-1.5 cursor-pointer font-mono text-[11px] hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 ${
            checked ? "bg-muted" : ""
          }`}
          style={{ gridTemplateColumns: "24px 5rem 3fr 1fr" }}
          onClick={(e) => {
            e.preventDefault();
            onToggle();
          }}
        >
          {/* Checkbox — only on first row */}
          {i === 0 ? (
            <input
              type="checkbox"
              checked={checked}
              onChange={onToggle}
              className="h-4 w-4 rounded border-border"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span />
          )}

          {/* Date — only on first row */}
          <span className={`text-muted-foreground ${i > 0 ? "opacity-0 select-none" : ""}`}>
            {i === 0 ? (dispatchDate ? dispatchDate.slice(0, 10) : "—") : ""}
          </span>

          {/* Description */}
          <span className="truncate text-foreground">
            {buildInvoiceDescription({
              loadId: load.loadId,
              year: v?.year,
              make: v?.make,
              model: v?.model,
            })}
          </span>

          {/* Rate — only on first row */}
          <span className={`font-semibold text-foreground ${i > 0 ? "opacity-0 select-none" : ""}`}>
            {i === 0 ? fmt(rate) : ""}
          </span>
        </label>
      ))}
    </>
  );
}

export function InvoiceFormModal({ open, onClose, initialData }: Props) {
  const qc = useQueryClient();
  const isEdit = !!initialData;

  const { data: carriersData } = useListCarriers({ pageSize: 200 } as any);
  const { data: loadsData } = useListLoads({ pageSize: 500 } as any);

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const [form, setForm] = useState({
    carrierId: "",
    driverName: "",
    issueDate: "",
    dueDate: "",
    commissionRate: "",
    status: "Draft",
    notes: "",
  });

  const [selectedLoadIds, setSelectedLoadIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (initialData) {
      const d = initialData as any;
      setForm({
        carrierId: d.carrierId ?? "",
        driverName: d.driverName ?? "",
        issueDate: d.issueDate?.slice(0, 10) ?? "",
        dueDate: d.dueDate?.slice(0, 10) ?? "",
        commissionRate: d.commissionRate != null ? String(d.commissionRate) : "",
        status: d.status ?? "Draft",
        notes: d.notes ?? "",
      });
      setSelectedLoadIds(d.loadIds ?? []);
    } else {
      setForm({ carrierId: "", driverName: "", issueDate: "", dueDate: "", commissionRate: "", status: "Draft", notes: "" });
      setSelectedLoadIds([]);
    }
    setDateFrom("");
    setDateTo("");
  }, [initialData, open]);

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const toggleLoad = (loadId: string) =>
    setSelectedLoadIds((prev) =>
      prev.includes(loadId) ? prev.filter((id) => id !== loadId) : [...prev, loadId]
    );

  const handleCarrierChange = (value: string) => {
    const carrierId = value === "__none__" ? "" : value;
    const carrier = carriersData?.data.find((c: any) => c.id === carrierId);
    const driverName = carrier?.driver?.name ?? carrier?.driverName ?? "";
    setForm((previous) => ({ ...previous, carrierId, driverName }));
    setSelectedLoadIds([]);
    setDateFrom("");
    setDateTo("");
  };

  const setThisWeek = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setDateFrom(fmt(monday));
    setDateTo(fmt(sunday));
    // deselect loads that fall outside new range
    setSelectedLoadIds([]);
  };

  const allLoads = useMemo(
    () => loadsData?.data ?? [],
    [loadsData]
  );

  const filteredLoads = useMemo(() => {
    if (!form.carrierId) return [];
    return allLoads.filter((load: any) => {
      if (load.carrierId !== form.carrierId) return false;
      const rawLoadDate = load.dispatchDate ?? load.pickupEstimated ?? null;
      const loadDate = typeof rawLoadDate === "string" ? rawLoadDate.slice(0, 10) : null;
      if (dateFrom && loadDate && loadDate < dateFrom) return false;
      if (dateTo && loadDate && loadDate > dateTo) return false;
      return true;
    });
  }, [allLoads, form.carrierId, dateFrom, dateTo]);

  const selectedLoads = useMemo(
    () => allLoads.filter((load: any) => selectedLoadIds.includes(load.id)),
    [allLoads, selectedLoadIds]
  );

  const subtotal = useMemo(
    () => selectedLoads.reduce((acc: number, l: any) => acc + (parseFloat(String(l.rate ?? "0")) || 0), 0),
    [selectedLoads]
  );

  const commissionRate = parseFloat(form.commissionRate) || 0;
  const commissionAmount = subtotal * (commissionRate / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = (v: string) => v || undefined;

    const basePayload = {
      carrierId: form.carrierId,
      driverName: s(form.driverName),
      issueDate: s(form.issueDate),
      dueDate: s(form.dueDate),
      subtotal: Math.round(subtotal * 100) / 100,
      commissionRate: Math.round(commissionRate * 100) / 100,
      total: Math.round(commissionAmount * 100) / 100,
      loadIds: selectedLoadIds.length > 0 ? selectedLoadIds : undefined,
      notes: s(form.notes),
    };

    if (isEdit) {
      updateMutation.mutate(
        { invoiceId: initialData!.id, data: { ...basePayload, status: s(form.status) } },
        { onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); onClose(); } }
      );
    } else {
      createMutation.mutate(
        { data: basePayload },
        { onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); onClose(); } }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const canSubmit = !!form.carrierId && commissionRate > 0 && selectedLoadIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-widest text-sm">
            {isEdit ? `Edit Invoice — ${initialData?.invoiceNumber}` : "Create Invoice"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4 mt-2"
        >
          {/* 1. Carrier + Driver */}
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Carrier *</Label>
            <Select
              value={form.carrierId || "__none__"}
              onValueChange={handleCarrierChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select carrier...</SelectItem>
                {carriersData?.data.map((carrier: any) => (
                  <SelectItem key={carrier.id} value={carrier.id}>
                    {carrier.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Driver</Label>
            <Select
              value={form.driverName || "__none__"}
              onValueChange={(v) => setForm((p) => ({ ...p, driverName: v === "__none__" ? "" : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select driver...</SelectItem>
                {carriersData?.data
                  .filter((c: any) => c.driver?.name || c.driverName)
                  .map((c: any) => {
                    const name = c.driver?.name ?? c.driverName;
                    return (
                      <SelectItem key={c.id} value={name}>
                        {name}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Load period */}
          <div className="col-span-2 border-t border-border pt-4">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Load Period
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    setSelectedLoadIds([]);
                  }}
                  className="w-40 font-mono text-xs"
                  disabled={!form.carrierId}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    setSelectedLoadIds([]);
                  }}
                  className="w-40 font-mono text-xs"
                  disabled={!form.carrierId}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 font-mono text-xs"
                disabled={!form.carrierId}
                onClick={setThisWeek}
              >
                This Week
              </Button>
            </div>
          </div>

          {/* 3. Loads */}
          <div className="col-span-2">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Loads{selectedLoadIds.length > 0 ? ` — ${selectedLoadIds.length} selected` : ""}
            </p>
            {!form.carrierId ? (
              <p className="font-mono text-xs text-muted-foreground">
                Select a carrier to see their loads.
              </p>
            ) : !dateFrom && !dateTo ? (
              <p className="font-mono text-xs text-muted-foreground">
                Select a date range to filter loads.
              </p>
            ) : filteredLoads.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">
                No loads found for this carrier in the selected period.
              </p>
            ) : (
              <div className="overflow-hidden border border-border">
                <div
                  className="grid gap-x-3 border-b border-border bg-muted/50 px-3 py-1.5 font-mono text-[9px] uppercase text-muted-foreground"
                  style={{ gridTemplateColumns: "24px 5rem 3fr 1fr" }}
                >
                  <span />
                  <span>Date</span>
                  <span>Description</span>
                  <span>Rate</span>
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-border">
                  {filteredLoads.map((load: any) => (
                    <LoadSelectorRow
                      key={load.id}
                      load={load}
                      checked={selectedLoadIds.includes(load.id)}
                      onToggle={() => toggleLoad(load.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Commission */}
          <div className="col-span-2 rounded border border-border bg-muted/30 p-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Commission
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">
                  Subtotal ({selectedLoadIds.length}{" "}
                  {selectedLoadIds.length === 1 ? "load" : "loads"})
                </Label>
                <div className="flex h-10 items-center rounded border border-border bg-background px-3 font-mono text-sm">
                  {fmt(subtotal)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Commission %</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.commissionRate}
                  onChange={f("commissionRate")}
                  placeholder="5.00"
                  className="font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-xs">Total Commission</Label>
                <div className={`flex h-10 items-center rounded border border-border bg-background px-3 font-mono text-sm font-bold ${commissionAmount > 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {fmt(commissionAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Issue Date */}
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Issue Date</Label>
            <Input type="date" value={form.issueDate} onChange={f("issueDate")} />
          </div>

          {/* 6. Due Date */}
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Due Date</Label>
            <Input type="date" value={form.dueDate} onChange={f("dueDate")} />
          </div>

          {/* 7. Status — edit only */}
          {isEdit && (
            <div className="col-span-2 flex flex-col gap-1">
              <Label className="font-mono text-xs">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((previous) => ({ ...previous, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 8. Notes */}
          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={f("notes")} rows={3} />
          </div>

          {/* 9. Actions */}
          <div className="col-span-2 flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
