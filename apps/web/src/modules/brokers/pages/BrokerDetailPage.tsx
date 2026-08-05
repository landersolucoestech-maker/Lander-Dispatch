import { useState } from "react";
import { useGetBroker } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CreditCard,
  FileText,
  Globe2,
  Mail,
  MapPinned,
  Pencil,
  Phone,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatDate } from "@/shared/lib/utils";
import { BrokerFormModal } from "../components/BrokerFormModal";

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value;

  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium">
        {display == null || display === "" ? "—" : display}
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

function Tokens({ values }: { values?: string[] | null }) {
  if (!values?.length) {
    return <p className="text-sm text-muted-foreground">Not configured.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className="border border-border bg-muted/30 px-2 py-1 text-xs"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

export default function BrokerDetailPage() {
  const params = useParams<{ brokerId: string }>();
  const brokerId = params.brokerId;
  const [editing, setEditing] = useState(false);

  const query = useGetBroker(brokerId, {
    query: {
      queryKey: ["broker", brokerId],
      enabled: Boolean(brokerId),
    },
  });

  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading broker…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <section className="w-full max-w-lg border border-destructive/40 bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Broker not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {query.error instanceof Error
              ? query.error.message
              : "The requested Broker could not be loaded."}
          </p>
          <Link href="/brokers">
            <Button variant="outline" className="mt-5">
              Return to Brokers
            </Button>
          </Link>
        </section>
      </div>
    );
  }

  const broker = query.data;
  const quickPayDisplay = broker.quickPay
    ? broker.quickPayFee == null
      ? "Available"
      : `Available · ${Number(broker.quickPayFee).toFixed(2)}% fee`
    : "Not available";

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link href="/brokers">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Return to Brokers"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
                {broker.companyName}
              </h1>
              <StatusBadge status={broker.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {broker.brokerType || "Broker type not configured"} · MC {broker.mcNumber || "not configured"}
            </p>
          </div>
        </div>

        <Button className="gap-2" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
          Edit Broker
        </Button>
      </header>

      <section
        aria-label="Broker summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="border border-border bg-card p-4">
          <Field label="Broker Type" value={broker.brokerType} />
        </div>
        <div className="border border-border bg-card p-4">
          <Field label="Priority" value={broker.priority} />
        </div>
        <div className="border border-border bg-card p-4">
          <Field
            label="Rating"
            value={
              broker.rating == null
                ? "Not rated"
                : `${Number(broker.rating).toFixed(1)} / 5.0`
            }
          />
        </div>
        <div className="border border-border bg-card p-4">
          <Field label="Onboarding Status" value={broker.onboardingStatus} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Company and Contact" icon={Building2}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Primary Contact" value={broker.primaryContact} />
            <Field label="Phone" value={broker.phone} />
            <Field label="Email" value={broker.email} />
            <Field label="Website" value={broker.website} />
            <Field label="Last Contact" value={formatDate(broker.lastContact)} />
            <Field label="Last Load" value={formatDate(broker.lastLoadDate)} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {broker.phone ? (
              <a href={`tel:${broker.phone}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
              </a>
            ) : null}
            {broker.email ? (
              <a href={`mailto:${broker.email}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </a>
            ) : null}
            {broker.website ? (
              <a href={broker.website} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Globe2 className="h-4 w-4" />
                  Website
                </Button>
              </a>
            ) : null}
          </div>
        </Section>

        <Section title="Authority" icon={ShieldCheck}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="MC Number" value={broker.mcNumber} />
            <Field label="USDOT Number" value={broker.usdotNumber} />
            <Field label="Operational Status" value={broker.status} />
            <Field label="Internal Priority" value={broker.priority} />
          </div>
        </Section>
      </div>

      <Section title="Coverage" icon={MapPinned}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Field label="Coverage Area" value={broker.coverage} />
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Freight Types
            </p>
            <Tokens values={broker.freightTypes} />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Selected States
            </p>
            <Tokens values={broker.selectedStates} />
          </div>
        </div>
      </Section>

      <Section title="Payment Profile" icon={CreditCard}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Field label="Payment Terms" value={broker.paymentTerms} />
          <Field
            label="Average Payment Days"
            value={broker.paymentDays == null ? null : `${broker.paymentDays} days`}
          />
          <Field label="QuickPay" value={quickPayDisplay} />
          <Field label="Factoring Accepted" value={broker.factoringAccepted} />
          <Field label="Onboarding" value={broker.onboardingStatus} />
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Tags" icon={Tags}>
          <Tokens values={broker.tags} />
        </Section>

        <Section title="Timeline" icon={CalendarClock}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Created" value={formatDate(broker.createdAt)} />
            <Field label="Last Updated" value={formatDate(broker.updatedAt)} />
          </div>
        </Section>
      </div>

      <Section title="Notes" icon={FileText}>
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {broker.notes || "No notes available."}
        </p>
      </Section>

      <BrokerFormModal
        open={editing}
        initialData={broker}
        onClose={() => {
          setEditing(false);
          void query.refetch();
        }}
      />
    </div>
  );
}
