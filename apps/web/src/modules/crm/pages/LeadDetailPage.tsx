import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  ArrowRightCircle,
  Building2,
  CalendarClock,
  MapPin,
  Pencil,
  Target,
  UserRound,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { convertLead, getLead } from "../api/leads";
import { LeadFormModal } from "../components/LeadFormModal";

function Field({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value?: string | number | null;
  emphasized?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={
          emphasized
            ? "mt-1 break-words text-sm font-bold text-primary"
            : "mt-1 break-words text-sm font-medium"
        }
      >
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

export default function LeadDetailPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const query = useQuery({
    queryKey: ["crm", "lead", leadId],
    queryFn: () => getLead(leadId),
    enabled: Boolean(leadId),
  });

  const conversion = useMutation({
    mutationFn: () => convertLead(leadId),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["crm", "leads"] });
      await queryClient.invalidateQueries({ queryKey: ["crm", "lead", leadId] });
      navigate(
        result.convertedEntityType === "Broker"
          ? `/brokers/${result.convertedEntityId}`
          : `/crm/contacts/${result.convertedEntityId}`,
      );
    },
  });

  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading lead…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <section className="w-full max-w-lg border border-destructive/40 bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Lead not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {query.error instanceof Error
              ? query.error.message
              : "The requested Lead could not be loaded."}
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

  const lead = query.data;
  const isBroker = lead.leadType === "Broker";
  const isConverted =
    lead.status === "Converted" || Boolean(lead.convertedEntityId);

  const handleConvert = () => {
    const destination = isBroker ? "Broker" : "Contact";
    if (
      !window.confirm(
        `Convert ${lead.companyName} into a ${destination}? The operational record will be created and this Lead will be closed as Won.`,
      )
    ) {
      return;
    }
    conversion.mutate();
  };

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
                {lead.companyName}
              </h1>
              <StatusBadge status={lead.pipelineStage} />
              <StatusBadge status={lead.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {lead.leadType || "Lead type not configured"} · Demand prospect
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="gap-2"
            disabled={isConverted}
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit Lead
          </Button>
          <Button
            className="gap-2"
            disabled={
              isConverted || conversion.isPending || !lead.leadType
            }
            onClick={handleConvert}
          >
            <ArrowRightCircle className="h-4 w-4" />
            {conversion.isPending
              ? "Converting…"
              : isConverted
                ? "Converted"
                : `Convert to ${isBroker ? "Broker" : "Contact"}`}
          </Button>
        </div>
      </header>

      {conversion.isError ? (
        <div className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {conversion.error instanceof Error
            ? conversion.error.message
            : "Lead conversion failed."}
        </div>
      ) : null}

      {isConverted ? (
        <div className="border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm">
          <p className="font-semibold text-emerald-700">Lead converted</p>
          <p className="mt-1 text-muted-foreground">
            Destination: {lead.convertedEntityType || "Operational record"}
            {lead.convertedEntityId ? ` · ${lead.convertedEntityId}` : ""}
          </p>
        </div>
      ) : null}

      <section
        aria-label="Lead summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="border border-border bg-card p-4">
          <Field label="Priority" value={lead.priority} />
        </div>
        <div className="border border-border bg-card p-4">
          <Field label="Lead Source" value={lead.leadSource} />
        </div>
        <div className="border border-border bg-card p-4">
          <Field
            label="Estimated Weekly Loads"
            value={lead.estimatedWeeklyLoads}
          />
        </div>
        <div className="border border-border bg-card p-4">
          <Field
            label="Estimated Weekly Revenue"
            value={
              lead.estimatedWeeklyRevenue == null
                ? null
                : formatCurrency(lead.estimatedWeeklyRevenue)
            }
            emphasized
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Primary Contact" icon={UserRound}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" value={lead.primaryContact} />
            <Field label="Phone" value={lead.phone} />
            <Field label="Email" value={lead.email} />
            <Field label="Website" value={lead.website} />
            <Field label="Last Contact" value={formatDate(lead.lastContact)} />
          </div>
        </Section>

        <Section title="Follow-Up" icon={CalendarClock}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Next Follow-Up Date"
              value={formatDate(lead.nextFollowUpDate)}
            />
            <Field label="Next Follow-Up Time" value={lead.nextFollowUpTime} />
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {lead.followUpNotes || "No follow-up notes configured."}
          </p>
        </Section>
      </div>

      <Section title="Location" icon={MapPin}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Street Address" value={lead.streetAddress} />
          <Field label="City" value={lead.city} />
          <Field label="State" value={lead.state} />
          <Field label="ZIP Code" value={lead.zipCode} />
        </div>
      </Section>

      {isBroker ? (
        <Section title="Broker Prospect" icon={Building2}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Broker Type" value={lead.brokerType} />
            <Field label="MC Number" value={lead.mcNumber} />
            <Field label="USDOT Number" value={lead.usdotNumber} />
            <Field label="Coverage" value={lead.coverage} />
            <Field label="Freight Types" value={lead.freightTypes} />
            <Field label="Selected States" value={lead.selectedStates} />
          </div>
        </Section>
      ) : null}

      <Section title="Demand Profile" icon={Target}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Service Types
            </p>
            <Tokens values={lead.serviceTypes} />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Operating States
            </p>
            <Tokens values={lead.operatingStates} />
          </div>
        </div>
      </Section>

      <Section title="Notes" icon={Building2}>
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {lead.notes || "No notes available."}
        </p>
      </Section>

      <LeadFormModal
        open={editing}
        initialData={lead}
        onClose={() => {
          setEditing(false);
          void query.refetch();
        }}
      />
    </div>
  );
}
