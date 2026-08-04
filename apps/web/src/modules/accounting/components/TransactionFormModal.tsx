import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateTransaction, useUpdateTransaction, useListCarriers } from "@workspace/api-client-react";
import type { Transaction } from "@workspace/api-client-react";
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
  initialData?: Transaction;
}

const EXPENSE_CATEGORIES = [
  "Fuel", "Maintenance", "Insurance", "Driver Pay", "Permits & Licenses",
  "Tolls", "Office & Admin", "Equipment", "Other Expense",
];
const INCOME_CATEGORIES = [
  "Freight Revenue", "Fuel Surcharge", "Detention Pay",
  "Accessorial", "Other Income",
];

export function TransactionFormModal({ open, onClose, initialData }: Props) {
  const qc = useQueryClient();
  const isEdit = !!initialData;
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const { data: carriersData } = useListCarriers({ pageSize: 200 } as any);

  const [form, setForm] = useState({
    type: "Expense",
    category: "",
    description: "",
    amount: "",
    date: "",
    dueDate: "",
    carrierId: "",
    invoiceId: "",
    paymentMethod: "",
    status: "Pending",
    referenceNumber: "",
    notes: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        type: initialData.type ?? "Expense",
        category: initialData.category ?? "",
        description: initialData.description ?? "",
        amount: initialData.amount?.toString() ?? "",
        date: initialData.date?.slice(0, 10) ?? "",
        dueDate: initialData.dueDate?.slice(0, 10) ?? "",
        carrierId: initialData.carrierId ?? "",
        invoiceId: initialData.invoiceId ?? "",
        paymentMethod: initialData.paymentMethod ?? "",
        status: initialData.status ?? "Pending",
        referenceNumber: initialData.referenceNumber ?? "",
        notes: initialData.notes ?? "",
      });
    } else {
      setForm({
        type: "Expense", category: "", description: "", amount: "",
        date: "", dueDate: "", carrierId: "", invoiceId: "",
        paymentMethod: "", status: "Pending", referenceNumber: "", notes: "",
      });
    }
  }, [initialData, open]);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const categories = form.type === "Expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      type: form.type,
      category: form.category,
      description: form.description || undefined,
      amount: parseFloat(form.amount),
      date: form.date || undefined,
      dueDate: form.dueDate || undefined,
      carrierId: form.carrierId || undefined,
      invoiceId: form.invoiceId || undefined,
      paymentMethod: form.paymentMethod || undefined,
      status: form.status || undefined,
      referenceNumber: form.referenceNumber || undefined,
      notes: form.notes || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(
        { transactionId: initialData!.id, data: payload },
        { onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); onClose(); } }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        { onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); onClose(); } }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-widest text-sm">
            {isEdit ? `Edit Transaction — ${initialData?.transactionId}` : "Create Transaction"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Type *</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((p) => ({ ...p, type: v, category: "" }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Expense">EXPENSE</SelectItem>
                <SelectItem value="Income">INCOME</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Category *</Label>
            <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Description</Label>
            <Input value={form.description} onChange={f("description")} placeholder="Brief description..." />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Amount ($) *</Label>
            <Input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={f("amount")}
              placeholder="0.00"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">PENDING</SelectItem>
                <SelectItem value="Cleared">CLEARED</SelectItem>
                <SelectItem value="Reconciled">RECONCILED</SelectItem>
                <SelectItem value="Void">VOID</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Date</Label>
            <Input type="date" value={form.date} onChange={f("date")} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Due Date</Label>
            <Input type="date" value={form.dueDate} onChange={f("dueDate")} />
          </div>

          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Carrier</Label>
            <Select
              value={form.carrierId || "__none__"}
              onValueChange={(v) => setForm((p) => ({ ...p, carrierId: v === "__none__" ? "" : v }))}
            >
              <SelectTrigger><SelectValue placeholder="Link carrier (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {carriersData?.data.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Invoice ID <span className="text-muted-foreground">(link invoice)</span></Label>
            <Input
              value={form.invoiceId}
              onChange={(e) => setForm((p) => ({ ...p, invoiceId: e.target.value }))}
              placeholder="Invoice UUID or leave blank"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Payment Method</Label>
            <Select
              value={form.paymentMethod || "__none__"}
              onValueChange={(v) => setForm((p) => ({ ...p, paymentMethod: v === "__none__" ? "" : v }))}
            >
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="ACH">ACH</SelectItem>
                <SelectItem value="Wire">Wire</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="QuickPay">QuickPay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-xs">Reference #</Label>
            <Input value={form.referenceNumber} onChange={f("referenceNumber")} placeholder="CHK-1234" />
          </div>

          <div className="col-span-2 flex flex-col gap-1">
            <Label className="font-mono text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={f("notes")} rows={3} />
          </div>

          <div className="col-span-2 flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending || !form.category || !form.amount}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
