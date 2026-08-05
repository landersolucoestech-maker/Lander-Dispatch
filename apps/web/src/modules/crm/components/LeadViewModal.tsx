import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  getGetCrmLeadQueryKey,
  getListCrmLeadsQueryKey,
} from "@workspace/api-client-react";
import type { CrmLead } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import {
  ArrowRightCircle,
  Building2,
  CalendarClock,
  MapPin,
  Pencil,
  Target,
  UserRound,
} from "lucide-react";
import {
  convertLead,
  type LeadRecord,
} from "../api/leads";
import { LeadFormModal } from "./LeadFormModal";

interface Props {
  lead: CrmLead | null;
  onClose: () => void;
}

function DataField({
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
    <section className="border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-xs font-semibold uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function TokenList({ values }: { values?: string[] | null }) {
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

export function LeadViewModal({ lead, onClose }: Props) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const conversionMutation = useMutation({ mutationFn: convertLead });

  if (!lead) return null;

  const record = lead as LeadRecord;
  const isBroker = record.leadType === "Broker";
  const isConverted =
    record.status === "Converted" || Boolean(record.convertedEntityId);

  const handleConvert = () => {
    const target = isBroker ? "Broker" : "Contact";
    if (
      !window.confirm(
        `Convert ${record.companyName} into a ${target}? This will create the operational record and close the Lead as Won.`,
      )
    ) {
      return;
    }

    conversionMutation.mutate(record.id, {
      onSuccess: async (result) => {
        await queryClient.invalidateQueries({
          queryKey: getListCrmLeadsQueryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: getGetCrmLeadQueryKey(record.id),
        });
        await queryClient.invalidateQueries({
          queryKey:
            result.convertedEntityType === "Broker"
              ? ["brokers"]
              : ["crm", "contacts"],
        });

        onClose();
        navigate(
          result.convertedEntityType === "Broker"
            ? `/brokers/${result.convertedEntityId}`
            : `/crm/contacts/${result.convertedEntityId}`,
        );
      },
    });
  };

  return (
    <>
      <Dialog open={!editing} onOpenChange={(value) => !value && onClose()}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold">
                  {record.companyName}
                </DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {record.leadType || "Lead type not configured"} · Demand prospect
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setEditing(true)}
                  disabled={isConverted}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Lead
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={handleConvert}
                  disabled={isConverted || conversionMutation.isPending || !record.leadType}
                >
                  <ArrowRightCircle className="h-4 w-4" />
                  {conversionMutation.isPending
                    ? "Converting…"
                    : isConverted
                      ? "Converted"
                      : `Convert to ${isBroker ? "Broker" : "Contact"}`}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-border bg-card p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Pipeline Stage
                </p>
                <div className="mt-2">
                  <StatusBadge status={record.pipelineStage} />
                </div>
              </div>
              <div className="border border-border bg-card p-4">
                <DataField label="Status" value={record.status} />
              </div>
              <div className="border border-border bg-card p-4">
                <DataField label="Priority" value={record.priority} />
              </div>
              <div className="border border-border bg-card p-4">
                <DataField
                  label="Rating"
                  value={
                    record.rating == null
                      ? "Not rated"
                      : `${Number(record.rating).toFixed(1)} / 5.0`
                  }
                />
              </div>
            </section>

            {isConverted ? (
              <div className="border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm">
                <p className="font-semibold text-emerald-700">
                  Lead converted successfully
                </p>
                <p className="mt-1 text-muted-foreground">
                  Destination: {record.convertedEntityType || "Operational record"}
                  {record.convertedEntityId
                    ? ` · ${record.convertedEntityId}`
                    : ""}
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Section title="Contact" icon={UserRound}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DataField label="Primary Contact" value={record.primaryContact} />
                  <DataField label="Phone" value={record.phone} />
                  <DataField label="Email" value={record.email} />
                  <DataField label="Website" value={record.website} />
                  <DataField label="Lead Source" value={record.leadSource} />
                  <DataField label="Last Contact" value={formatDate(record.lastContact)} />
                </div>
              </Section>

              <Section title="Follow-Up" icon={CalendarClock}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DataField
                    label="Next Follow-Up Date"
                    value={formatDate(record.nextFollowUpDate)}
                  />
                  <DataField
                    label="Next Follow-Up Time"
                    value={record.nextFollowUpTime}
                  />
                </div>
                {record.followUpNotes ? (
                  <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
                    {record.followUpNotes}
                  </p>
                ) : null}
              </Section>
            </div>

            <Section title="Location" icon={MapPin}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DataField label="Street Address" value={record.streetAddress} />
                <DataField label="City" value={record.city} />
                <DataField label="State" value={record.state} />
                <DataField label="ZIP Code" value={record.zipCode} />
              </div>
            </Section>

            {isBroker ? (
              <Section title="Broker Prospect Details" icon={Building2}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DataField label="Broker Type" value={record.brokerType} />
                  <DataField label="MC Number" value={record.mcNumber} />
                  <DataField label="USDOT Number" value={record.usdotNumber} />
                  <DataField label="Coverage" value={record.coverage} />
                  <DataField label="Freight Types" value={record.freightTypes} />
                  <DataField label="Selected States" value={record.selectedStates} />
                </div>
              </Section>
            ) : null}

            <Section title="Demand Profile" icon={Target}>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Service Types
                  </p>
                  <TokenList values={record.serviceTypes} />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Operating States
                  </p>
                  <TokenList values={record.operatingStates} />
                </div>
                <DataField
                  label="Estimated Weekly Loads"
                  value={record.estimatedWeeklyLoads}
                />
                <DataField
                  label="Estimated Weekly Revenue"
                  value={
                    record.estimatedWeeklyRevenue == null
                      ? null
                      : formatCurrency(record.estimatedWeeklyRevenue)
                  }
                  emphasized
                />
              </div>
            </Section>

            {record.tags?.length ? (
              <Section title="Tags" icon={Target}>
                <TokenList values={record.tags} />
              </Section>
            ) : null}

            <Section title="Notes" icon={Building2}>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {record.notes || "No notes available."}
              </p>
            </Section>

            {conversionMutation.isError ? (
              <div className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {conversionMutation.error instanceof Error
                  ? conversionMutation.error.message
                  : "Lead conversion failed."}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <LeadFormModal
        open={editing}
        onClose={() => {
          setEditing(false);
          onClose();
        }}
        initialData={lead}
      />
    </>
  );
}
