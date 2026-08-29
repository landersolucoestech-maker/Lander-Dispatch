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
  GENERIC_CONTACT_TYPES,
  type GenericContactInput,
  type GenericContactType,
} from "../api/contacts";
import { CONTACT_TYPE_CONFIG } from "../config/contactTypes";

interface Props {
  open: boolean;
  onClose: () => void;
}

type ContactStatus = "Active" | "Inactive" | "Blocked";

interface ContactFormState {
  companyName: string;
  contactType: GenericContactType;
  status: ContactStatus;
  priority: string;
  rating: string;
  primaryContactName: string;
  primaryPhoneNumber: string;
  primaryPhoneNumber2: string;
  email: string;
  website: string;
  emergencyContactName: string;
  emergencyPhoneNumber: string;
  emergencyPhoneNumber2: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  coverageArea: string;
  businessHours: string;
  emergencyService: boolean;
  services: string;
  lastContact: string;
  tags: string;
  notes: string;
}

const EMPTY_FORM: ContactFormState = {
  companyName: "",
  contactType: "Other",
  status: "Active",
  priority: "",
  rating: "",
  primaryContactName: "",
  primaryPhoneNumber: "",
  primaryPhoneNumber2: "",
  email: "",
  website: "",
  emergencyContactName: "",
  emergencyPhoneNumber: "",
  emergencyPhoneNumber2: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  coverageArea: "",
  businessHours: "",
  emergencyService: false,
  services: "",
  lastContact: "",
  tags: "",
  notes: "",
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border border-border bg-card p-4 sm:p-5">
      <div className="border-b border-border pb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function optionalText(value: string): string | null {
  return value.trim() || null;
}

function optionalRating(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(5, Math.max(0, Math.round(parsed * 10) / 10));
}

export function DirectContactFormModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ContactFormState>(EMPTY_FORM);
  const config = CONTACT_TYPE_CONFIG[form.contactType];

  const setField = <K extends keyof ContactFormState>(
    field: K,
    value: ContactFormState[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const reset = () => setForm(EMPTY_FORM);

  const mutation = useMutation({
    mutationFn: createGenericContact,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: getListCrmContactsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: ["crm", "contacts"] });
      reset();
      onClose();
    },
  });

  const handleClose = () => {
    if (!mutation.isPending) {
      reset();
      onClose();
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.companyName.trim()) return;

    const payload: GenericContactInput = {
      companyName: form.companyName.trim(),
      contactType: form.contactType,
      status: form.status,
      priority: optionalText(form.priority),
      rating: optionalRating(form.rating),
      primaryContactName: optionalText(form.primaryContactName),
      primaryPhoneNumber: optionalText(form.primaryPhoneNumber),
      primaryPhoneNumber2: optionalText(form.primaryPhoneNumber2),
      email: optionalText(form.email),
      website: optionalText(form.website),
      emergencyContactName: optionalText(form.emergencyContactName),
      emergencyPhoneNumber: optionalText(form.emergencyPhoneNumber),
      emergencyPhoneNumber2: optionalText(form.emergencyPhoneNumber2),
      streetAddress: config.showAddress ? optionalText(form.streetAddress) : null,
      city: config.showAddress ? optionalText(form.city) : null,
      state: config.showAddress ? optionalText(form.state.toUpperCase()) : null,
      zipCode: config.showAddress ? optionalText(form.zipCode) : null,
      coverageArea: config.showCoverageArea ? optionalText(form.coverageArea) : null,
      businessHours: config.showBusinessHours ? optionalText(form.businessHours) : null,
      emergencyService: config.showEmergencyService ? form.emergencyService : false,
      services: config.showServices ? optionalText(form.services) : null,
      lastContact: optionalText(form.lastContact),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      notes: optionalText(form.notes),
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && handleClose()}>
      <DialogContent className="max-h-[94vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Contact</DialogTitle>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Section
            title="Contact Profile"
            description="Identity, classification and relationship status."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Company / Contact Name" className="sm:col-span-2 lg:col-span-2">
                <Input
                  value={form.companyName}
                  onChange={(event) => setField("companyName", event.target.value)}
                  autoFocus
                  placeholder="Company or contact name"
                />
              </Field>

              <Field label="Contact Type">
                <Select
                  value={form.contactType}
                  onValueChange={(value) => setField("contactType", value as GenericContactType)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GENERIC_CONTACT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Status">
                <Select
                  value={form.status}
                  onValueChange={(value) => setField("status", value as ContactStatus)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Priority">
                <Select
                  value={form.priority || "none"}
                  onValueChange={(value) => setField("priority", value === "none" ? "" : value)}
                >
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No priority</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Rating">
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={(event) => setField("rating", event.target.value)}
                  placeholder="0.0 - 5.0"
                />
              </Field>

              <Field label="Last Contact">
                <Input
                  type="date"
                  value={form.lastContact}
                  onChange={(event) => setField("lastContact", event.target.value)}
                />
              </Field>

              <Field label="Tags">
                <Input
                  value={form.tags}
                  onChange={(event) => setField("tags", event.target.value)}
                  placeholder="vip, partner, follow-up"
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Primary Contact Information"
            description="Main person and communication channels for this contact."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Primary Contact Name">
                <Input
                  value={form.primaryContactName}
                  onChange={(event) => setField("primaryContactName", event.target.value)}
                />
              </Field>

              <Field label="Primary Phone">
                <Input
                  value={form.primaryPhoneNumber}
                  onChange={(event) => setField("primaryPhoneNumber", event.target.value)}
                  placeholder="Phone number"
                />
              </Field>

              <Field label="Secondary Phone">
                <Input
                  value={form.primaryPhoneNumber2}
                  onChange={(event) => setField("primaryPhoneNumber2", event.target.value)}
                  placeholder="Alternate phone"
                />
              </Field>

              <Field label="Email" className="lg:col-span-2">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  placeholder="contact@company.com"
                />
              </Field>

              <Field label="Website">
                <Input
                  value={form.website}
                  onChange={(event) => setField("website", event.target.value)}
                  placeholder="https://"
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Emergency Contact"
            description="Alternative contact details for urgent operational situations."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Emergency Contact Name">
                <Input
                  value={form.emergencyContactName}
                  onChange={(event) => setField("emergencyContactName", event.target.value)}
                />
              </Field>

              <Field label="Emergency Phone">
                <Input
                  value={form.emergencyPhoneNumber}
                  onChange={(event) => setField("emergencyPhoneNumber", event.target.value)}
                />
              </Field>

              <Field label="Secondary Emergency Phone">
                <Input
                  value={form.emergencyPhoneNumber2}
                  onChange={(event) => setField("emergencyPhoneNumber2", event.target.value)}
                />
              </Field>
            </div>
          </Section>

          {config.showAddress ? (
            <Section title="Address" description="Primary business or operating address.">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Street Address" className="sm:col-span-2 lg:col-span-4">
                  <Input
                    value={form.streetAddress}
                    onChange={(event) => setField("streetAddress", event.target.value)}
                  />
                </Field>

                <Field label="City" className="lg:col-span-2">
                  <Input
                    value={form.city}
                    onChange={(event) => setField("city", event.target.value)}
                  />
                </Field>

                <Field label="State">
                  <Input
                    value={form.state}
                    maxLength={2}
                    onChange={(event) => setField("state", event.target.value.toUpperCase())}
                    placeholder="FL"
                  />
                </Field>

                <Field label="ZIP Code">
                  <Input
                    value={form.zipCode}
                    onChange={(event) => setField("zipCode", event.target.value)}
                  />
                </Field>
              </div>
            </Section>
          ) : null}

          {(config.showCoverageArea || config.showBusinessHours || config.showServices || config.showEmergencyService) ? (
            <Section
              title="Operations & Services"
              description="Service coverage, availability and operational notes."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {config.showCoverageArea ? (
                  <Field label="Coverage Area">
                    <Input
                      value={form.coverageArea}
                      onChange={(event) => setField("coverageArea", event.target.value)}
                      placeholder="Cities, states or service radius"
                    />
                  </Field>
                ) : null}

                {config.showBusinessHours ? (
                  <Field label="Business Hours">
                    <Input
                      value={form.businessHours}
                      onChange={(event) => setField("businessHours", event.target.value)}
                      placeholder="Mon-Fri 08:00-18:00"
                    />
                  </Field>
                ) : null}

                {config.showServices ? (
                  <Field label="Services" className="sm:col-span-2">
                    <Textarea
                      rows={3}
                      value={form.services}
                      onChange={(event) => setField("services", event.target.value)}
                      placeholder="Services provided, specialties and operational capabilities"
                    />
                  </Field>
                ) : null}

                {config.showEmergencyService ? (
                  <label className="flex items-center gap-3 border border-border bg-muted/20 p-3 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={form.emergencyService}
                      onChange={(event) => setField("emergencyService", event.target.checked)}
                    />
                    24/7 emergency service available
                  </label>
                ) : null}
              </div>
            </Section>
          ) : null}

          <Section title="Notes" description="Internal context and relationship history.">
            <Textarea
              value={form.notes}
              onChange={(event) => setField("notes", event.target.value)}
              rows={5}
              placeholder="Add notes about this contact, preferences, follow-ups or relevant context"
            />
          </Section>

          {mutation.isError ? (
            <div className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              Unable to create contact. Review the fields and try again.
            </div>
          ) : null}

          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background py-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!form.companyName.trim() || mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
