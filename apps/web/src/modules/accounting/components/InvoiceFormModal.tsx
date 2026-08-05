import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateInvoice,
  useGetCompanyProfile,
  useListCarriers,
  useListLoads,
  useUpdateInvoice,
} from "@workspace/api-client-react";
import type {
  Carrier,
  Invoice,
  Load,
  LoadVehicle,
} from "@workspace/api-client-react";
import { buildInvoiceDescription } from "@/shared/lib/invoice-utils";
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

type InvoiceWithCommission = Invoice & {
  subtotal?: number;
  commissionRate?: number;
};

type InvoiceFormState = {
  carrierId: string;
  issueDate: string;
  dueDate: string;
  commissionRate: string;
  status: string;
  notes: string;
};

const STATUS_OPTIONS = [
  "Pending",
  "Partially Paid",
  "Fully Paid",
  "Overdue",
  "Canceled",
];

const EMPTY_FORM: InvoiceFormState = {
  carrierId: "",
  issueDate: "",
  dueDate: "",
  commissionRate: "",
  status: "Pending",
  notes: "",
};

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatAddress(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(", ") || "Address not configured";
}

function LoadSelectorRow({
  load,
  checked,
  onToggle,
}: {
  load: Load;
  checked: boolean;
  onToggle: () => void;
}) {
  const vehicles: Array<LoadVehicle | null> = load.vehicles?.length
    ? load.vehicles
    : [null];
  const rate = load.rate ?? 0;

  return (
    <div className={checked ? "bg-muted/60" : "bg-background"}>
      {vehicles.map((vehicle, index) => (
        <label
          key={`${load.id}-${vehicle?.vehicleNumber ?? index}`}
          className="grid cursor-pointer items-center gap-x-3 border-b border-border px-3 py-2 text-[11px] transition-colors last:border-b-0 hover:bg-muted/50"
          style={{ gridTemplateColumns: "24px 6rem minmax(0, 3fr) minmax(5rem, 1fr)" }}
          onClick={(event) => {
            event.preventDefault();
            onToggle();
          }}
        >
          {index === 0 ? (
            <input
              type="checkbox"
              checked={checked}
              onChange={onToggle}
              onClick={(event) => event.stopPropagation()}
              className="h-4 w-4 rounded border-border"
              aria-label={`Select load ${load.loadId}`}
            />
          ) : (
            <span />
          )}

          <span className={index > 0 ? "select-none opacity-0" : "text-muted-foreground"}>
            {index === 0 && load.dispatchDate ? load.dispatchDate.slice(0, 10) : "—"}
          </span>

          <span className="truncate font-medium text-foreground">
            {buildInvoiceDescription({
              loadId: load.loadId,
              year: vehicle?.year,
              make: vehicle?.make,
              model: vehicle?.model,
            })}
          </span>

          <span className={index > 0 ? "select-none opacity-0" : "text-right font-semibold"}>
            {index === 0 ? formatCurrency(rate) : ""}
          </span>
        </label>
      ))}
    </div>
  );
}

export function InvoiceFormModal({ open, onClose, initialData }: Props) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(initialData);

  const carriersQuery = useListCarriers({ page: 1, pageSize: 200 });
  const loadsQuery = useListLoads({ page: 1, pageSize: 500 });
  const companyProfileQuery = useGetCompanyProfile();
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const [form, setForm] = useState<InvoiceFormState>(EMPTY_FORM);
  const [selectedLoadIds, setSelectedLoadIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (initialData) {
      const invoice = initialData as InvoiceWithCommission;
      setForm({
        carrierId: invoice.carrierId ?? "",
        issueDate: invoice.issueDate?.slice(0, 10) ?? "",
        dueDate: invoice.dueDate?.slice(0, 10) ?? "",
        commissionRate:
          invoice.commissionRate == null ? "" : String(invoice.commissionRate),
        status: invoice.status || "Pending",
        notes: invoice.notes ?? "",
      });
      setSelectedLoadIds(invoice.loadIds ?? []);
    } else {
      setForm({
        ...EMPTY_FORM,
        issueDate: new Date().toISOString().slice(0, 10),
      });
      setSelectedLoadIds([]);
    }

    setDateFrom("");
    setDateTo("");
  }, [initialData, open]);

  const carriers: Carrier[] = carriersQuery.data?.data ?? [];
  const loads: Load[] = loadsQuery.data?.data ?? [];
  const selectedCarrier = carriers.find((carrier) => carrier.id === form.carrierId);
  const companyProfile = companyProfileQuery.data;

  const filteredLoads = useMemo(() => {
    if (!form.carrierId) return [];

    return loads.filter((load) => {
      if (load.carrierId !== form.carrierId) return false;

      const rawDate = load.dispatchDate ?? load.pickupEstimated ?? null;
      const loadDate = rawDate?.slice(0, 10) ?? null;

      if (dateFrom && loadDate && loadDate < dateFrom) return false;
      if (dateTo && loadDate && loadDate > dateTo) return false;
      return true;
    });
  }, [dateFrom, dateTo, form.carrierId, loads]);

  const selectedLoads = useMemo(
    () => loads.filter((load) => selectedLoadIds.includes(load.id)),
    [loads, selectedLoadIds],
  );

  const subtotal = useMemo(
    () => selectedLoads.reduce((total, load) => total + (load.rate ?? 0), 0),
    [selectedLoads],
  );

  const commissionRate = Number.parseFloat(form.commissionRate) || 0;
  const commissionAmount = subtotal * (commissionRate / 100);
  const isPending = createMutation.isPending || updateMutation.isPending;
  const canSubmit =
    Boolean(form.carrierId) &&
    selectedLoadIds.length > 0 &&
    commissionRate > 0 &&
    commissionRate <= 100;

  const updateForm = (field: keyof InvoiceFormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const toggleLoad = (loadId: string) => {
    setSelectedLoadIds((previous) =>
      previous.includes(loadId)
        ? previous.filter((id) => id !== loadId)
        : [...previous, loadId],
    );
  };

  const handleCarrierChange = (value: string) => {
    updateForm("carrierId", value === "__none__" ? "" : value);
    setSelectedLoadIds([]);
    setDateFrom("");
    setDateTo("");
  };

  const setThisWeek = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    setDateFrom(monday.toISOString().slice(0, 10));
    setDateTo(sunday.toISOString().slice(0, 10));
    setSelectedLoadIds([]);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const optional = (value: string) => value || undefined;
    const payload = {
      carrierId: form.carrierId,
      issueDate: optional(form.issueDate),
      dueDate: optional(form.dueDate),
      subtotal: Math.round(subtotal * 100) / 100,
      commissionRate: Math.round(commissionRate * 100) / 100,
      total: Math.round(commissionAmount * 100) / 100,
      loadIds: selectedLoadIds,
      notes: optional(form.notes),
    };

    const onSuccess = () => {
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onClose();
    };

    if (initialData) {
      updateMutation.mutate(
        {
          invoiceId: initialData.id,
          data: { ...payload, status: form.status },
        },
        { onSuccess },
      );
      return;
    }

    createMutation.mutate({ data: payload }, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isEdit ? `Edit Invoice — ${initialData?.invoiceNumber}` : "Create Invoice"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Carrier *</Label>
              <Select value={form.carrierId || "__none__"} onValueChange={handleCarrierChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select carrier…</SelectItem>
                  {carriers.map((carrier) => (
                    <SelectItem key={carrier.id} value={carrier.id}>
                      {carrier.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={form.issueDate}
                  onChange={(event) => updateForm("issueDate", event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => updateForm("dueDate", event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="border border-border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Bill To
              </p>
              <p className="font-semibold">
                {selectedCarrier?.companyName ?? "Select a carrier"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedCarrier?.primaryContact ?? "Primary contact not configured"}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedCarrier?.email ?? selectedCarrier?.phone ?? "Contact details not configured"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatAddress([
                  selectedCarrier?.companyAddress,
                  selectedCarrier?.companyCity,
                  selectedCarrier?.companyState,
                  selectedCarrier?.companyZip,
                ])}
              </p>
            </div>

            <div className="border border-border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Pay To
              </p>
              <p className="font-semibold">
                {companyProfile?.legalCompanyName ||
                  companyProfile?.companyName ||
                  "Lander Dispatch"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {companyProfile?.companyEmail ?? "Company email not configured"}
              </p>
              <p className="text-sm text-muted-foreground">
                {companyProfile?.companyPhone ?? "Company phone not configured"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatAddress([
                  companyProfile?.streetAddress,
                  companyProfile?.city,
                  companyProfile?.state,
                  companyProfile?.zipCode,
                  companyProfile?.country,
                ])}
              </p>
            </div>
          </section>

          <section className="border-t border-border pt-5">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Load Period
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select completed work to include in this commission invoice.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    disabled={!form.carrierId}
                    onChange={(event) => {
                      setDateFrom(event.target.value);
                      setSelectedLoadIds([]);
                    }}
                    className="w-40"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    disabled={!form.carrierId}
                    onChange={(event) => {
                      setDateTo(event.target.value);
                      setSelectedLoadIds([]);
                    }}
                    className="w-40"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!form.carrierId}
                  onClick={setThisWeek}
                >
                  This Week
                </Button>
              </div>
            </div>

            {!form.carrierId ? (
              <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Select a carrier to load eligible records.
              </div>
            ) : !dateFrom && !dateTo ? (
              <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Select a date range to filter loads.
              </div>
            ) : filteredLoads.length === 0 ? (
              <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No loads were found for this carrier in the selected period.
              </div>
            ) : (
              <div className="overflow-hidden border border-border">
                <div
                  className="grid gap-x-3 border-b border-border bg-muted/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                  style={{ gridTemplateColumns: "24px 6rem minmax(0, 3fr) minmax(5rem, 1fr)" }}
                >
                  <span />
                  <span>Date</span>
                  <span>Description</span>
                  <span className="text-right">Rate</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredLoads.map((load) => (
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
          </section>

          <section className="grid grid-cols-1 gap-4 border border-border bg-muted/20 p-4 md:grid-cols-3">
            <div>
              <Label>Subtotal ({selectedLoadIds.length} loads)</Label>
              <div className="mt-1 flex h-10 items-center border border-border bg-background px-3 font-semibold">
                {formatCurrency(subtotal)}
              </div>
            </div>
            <div>
              <Label>Commission % *</Label>
              <Input
                className="mt-1"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={form.commissionRate}
                onChange={(event) => updateForm("commissionRate", event.target.value)}
                placeholder="5.00"
              />
            </div>
            <div>
              <Label>Total Commission</Label>
              <div className="mt-1 flex h-10 items-center border border-primary/30 bg-primary/5 px-3 text-lg font-bold text-primary">
                {formatCurrency(commissionAmount)}
              </div>
            </div>
          </section>

          {isEdit ? (
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => updateForm("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
