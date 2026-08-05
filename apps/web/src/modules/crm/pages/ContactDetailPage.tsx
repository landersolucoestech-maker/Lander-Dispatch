import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  ContactRound,
  MapPin,
  Pencil,
  PhoneCall,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatDate } from "@/shared/lib/utils";
import { getGenericContact } from "../api/contacts";
import { ContactFormModal } from "../components/ContactFormModal";

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium">
        {value == null || value === "" ? "—" : value}
      </p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Building2;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="text-xs font-semibold uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function ContactDetailPage() {
  const params = useParams<{ contactId: string }>();
  const contactId = params.contactId;
  const [editing, setEditing] = useState(false);

  const query = useQuery({
    queryKey: ["crm", "contact", contactId],
    queryFn: () => getGenericContact(contactId),
    enabled: Boolean(contactId),
  });

  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading contact…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <section className="w-full max-w-lg border border-destructive/40 bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Contact not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {query.error instanceof Error
              ? query.error.message
              : "The requested CRM contact could not be loaded."}
          </p>
          <Link href="/crm">
            <Button variant="outline" className="mt-5">
              Return to CRM
            </Button>
          </Link>
        </section>
      </div>
    );
  }

  const contact = query.data;
  const address = [
    contact.streetAddress,
    contact.city,
    contact.state,
    contact.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link href="/crm">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Return to CRM"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
                {contact.companyName}
              </h1>
              <StatusBadge status={contact.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {contact.contactType || "Generic Contact"} · CRM relationship record
            </p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
          Edit Contact
        </Button>
      </header>

      <section
        aria-label="Contact summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="border border-border bg-card p-4">
          <Field label="Contact Type" value={contact.contactType} />
        </div>
        <div className="border border-border bg-card p-4">
          <Field label="Priority" value={contact.priority} />
        </div>
        <div className="border border-border bg-card p-4">
          <Field
            label="Rating"
            value={
              contact.rating == null
                ? "Not rated"
                : `${Number(contact.rating).toFixed(1)} / 5.0`
            }
          />
        </div>
        <div className="border border-border bg-card p-4">
          <Field label="Last Contact" value={formatDate(contact.lastContact)} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Primary Contact" icon={ContactRound}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Name"
              value={contact.primaryContactName || contact.primaryContact}
            />
            <Field label="Email" value={contact.email} />
            <Field
              label="Phone"
              value={contact.primaryPhoneNumber || contact.phone}
            />
            <Field
              label="Phone 2"
              value={contact.primaryPhoneNumber2 || contact.phone2}
            />
            <Field label="Website" value={contact.website} />
          </div>
        </Section>

        <Section title="Emergency Contact" icon={ShieldAlert}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" value={contact.emergencyContactName} />
            <Field label="Phone" value={contact.emergencyPhoneNumber} />
            <Field label="Phone 2" value={contact.emergencyPhoneNumber2} />
            <Field
              label="Emergency Service"
              value={contact.emergencyService ? "Available" : "Not available"}
            />
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Location and Coverage" icon={MapPin}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Address" value={address} />
            <Field label="Coverage Area" value={contact.coverageArea} />
            <Field label="Business Hours" value={contact.businessHours} />
          </div>
        </Section>

        <Section title="Services" icon={PhoneCall}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {contact.services || "No services configured."}
          </p>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Tags" icon={CalendarClock}>
          {contact.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-border bg-muted/30 px-2 py-1 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tags configured.</p>
          )}
        </Section>

        <Section title="Notes" icon={Building2}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {contact.notes || "No notes available."}
          </p>
        </Section>
      </div>

      <ContactFormModal
        open={editing}
        initialData={contact}
        onClose={() => {
          setEditing(false);
          void query.refetch();
        }}
      />
    </div>
  );
}
