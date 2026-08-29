import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getListCrmContactsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  createGenericContact,
  type GenericContactInput,
  type GenericContactType,
} from "../api/contacts";

interface Props {
  open: boolean;
  onClose: () => void;
}

const contactTypes: GenericContactType[] = [
  "Direct Customer",
  "Dealer",
  "Shipper",
  "Auction",
  "Manufacturer",
  "Fleet / Rental Company",
  "Other",
];

export function DirectContactFormModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = useState("");
  const [contactType, setContactType] = useState<GenericContactType>("Other");
  const [primaryContactName, setPrimaryContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive" | "Blocked">("Active");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: createGenericContact,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: getListCrmContactsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: ["crm", "contacts"] });
      setCompanyName("");
      setContactType("Other");
      setPrimaryContactName("");
      setPhone("");
      setEmail("");
      setStatus("Active");
      setNotes("");
      onClose();
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyName.trim()) return;

    const payload: GenericContactInput = {
      companyName: companyName.trim(),
      contactType,
      status,
      priority: null,
      rating: null,
      primaryContactName: primaryContactName.trim() || null,
      primaryPhoneNumber: phone.trim() || null,
      primaryPhoneNumber2: null,
      email: email.trim() || null,
      website: null,
      emergencyContactName: null,
      emergencyPhoneNumber: null,
      emergencyPhoneNumber2: null,
      streetAddress: null,
      city: null,
      state: null,
      zipCode: null,
      coverageArea: null,
      businessHours: null,
      emergencyService: false,
      services: null,
      lastContact: null,
      tags: [],
      notes: notes.trim() || null,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Contact</DialogTitle>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Company / Contact Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoFocus />
            </div>

            <div className="space-y-1.5">
              <Label>Contact Type</Label>
              <Select value={contactType} onValueChange={(value) => setContactType(value as GenericContactType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contactTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Primary Contact</Label>
              <Input value={primaryContactName} onChange={(e) => setPrimaryContactName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
            </div>
          </div>

          {mutation.isError ? (
            <p className="text-sm text-destructive">Unable to create contact.</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!companyName.trim() || mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
