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

  const { data: carriersData } = useListCarriers({ page: 1, pageSize: 200 });

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

  const pending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-widest text-sm">
            {isEdit ? "Edit Transaction" : "New Transaction"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v, category: "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={f("description")} placeholder="Transaction description" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Amount *</Label>
              <Input type="number" step="0.01" min="0" value={form.amount} onChange={f("amount")} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Cleared">Cleared</SelectItem>
                  <SelectItem value="Reconciled">Reconciled</SelectItem>
                  <SelectItem value="Voided">Voided</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={f("date")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={f("dueDate")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Carrier</Label>
              <Select value={form.carrierId || "none"} onValueChange={(v) => setForm((p) => ({ ...p, carrierId: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No carrier</SelectItem>
                  {carriersData?.data?.map((carrier) => (
                    <SelectItem key={carrier.id} value={carrier.id}>{carrier.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Invoice ID</Label>
              <Input value={form.invoiceId} onChange={f("invoiceId")} placeholder="Related invoice UUID" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Payment Method</Label>
              <Input value={form.paymentMethod} onChange={f("paymentMethod")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Reference Number</Label>
              <Input value={form.referenceNumber} onChange={f("referenceNumber")} />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.notes} onChange={f("notes")} />
            </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Transaction request failed."}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={pending || !form.category || !form.amount}>
              {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
