import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  ClipboardCheck,
  ContactRound,
  FileCheck2,
  FileText,
  HeartPulse,
  IdCard,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Stethoscope,
  Tags,
  Truck,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatDate } from "@/shared/lib/utils";
import { DriverFormModal } from "../components/DriverFormModal";
import { useGetDriver } from "../hooks/useDrivers";

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
  icon: typeof Truck;
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

export default function DriverDetailPage() {
  const params = useParams<{ driverId: string }>();
  const driverId = params.driverId;
  const [editing, setEditing] = useState(false);
  const query = useGetDriver(driverId);

  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading Driver…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <section className="w-full max-w-lg border border-destructive/40 bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Driver not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {query.error instanceof Error
              ? query.error.message
              : "The requested Driver could not be loaded."}
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

  const driver = query.data;
  const address = [
    driver.streetAddress,
    driver.city,
    driver.state,
    driver.zipCode,
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
                {driver.fullName}
              </h1>
              <StatusBadge status={driver.status} />
              {driver.complianceStatus ? (
                <StatusBadge status={driver.complianceStatus} />
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {driver.driverType || "Driver type not configured"} · {driver.employmentType || "Employment type not configured"}
            </p>
          </div>
        </div>

        <Button className="gap-2" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
          Edit Driver
        </Button>
      </header>

      <section
        aria-label="Driver summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <div className="border border-border bg-card p-4">
          <Field label="Driver Type" value={driver.driverType} />
        </div>
        <div className="border border-border bg-card p-4">
          <Field label="Employment" value={driver.employmentType} />
        </div>
        <div className="border border-border bg-card p-4">
          <Field
            label="Experience"
            value={
              driver.yearsOfExperience == null
                ? null
                : `${driver.yearsOfExperience} years`
            }
          />
        </div>
        <div className="border border-border bg-card p-4">
          <Field label="Total Loads" value={driver.totalLoads ?? 0} />
        </div>
        <div className="border border-border bg-card p-4">
          <Field label="DQ File" value={driver.driverQualificationFileStatus} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Personal and Contact" icon={ContactRound}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date of Birth" value={formatDate(driver.dateOfBirth)} />
            <Field label="Email" value={driver.email} />
            <Field label="Phone" value={driver.phoneNumber} />
            <Field label="Phone 2" value={driver.phoneNumber2} />
            <Field label="Address" value={address} />
            <Field label="Hire Date" value={formatDate(driver.hireDate)} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {driver.phoneNumber ? (
              <a href={`tel:${driver.phoneNumber}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call Driver
                </Button>
              </a>
            ) : null}
          </div>
        </Section>

        <Section title="Emergency Contact" icon={AlertTriangle}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" value={driver.emergencyContactName} />
            <Field label="Phone" value={driver.emergencyPhoneNumber} />
            <Field label="Phone 2" value={driver.emergencyPhoneNumber2} />
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Driver License" icon={IdCard}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Number" value={driver.driverLicenseNumber} />
            <Field label="State" value={driver.driverLicenseState} />
            <Field label="Class" value={driver.driverLicenseClass} />
            <Field
              label="Expiration"
              value={formatDate(driver.driverLicenseExpiration)}
            />
          </div>
        </Section>

        <Section title="Commercial Driver License" icon={BadgeCheck}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="CDL Number" value={driver.cdlNumber} />
            <Field label="State" value={driver.cdlState} />
            <Field label="Class" value={driver.cdlClass} />
            <Field label="Expiration" value={formatDate(driver.cdlExpiration)} />
            <Field label="Restrictions" value={driver.cdlRestrictions} />
            <Field label="HazMat" value={driver.hazmatEndorsement} />
            <Field
              label="HazMat Expiration"
              value={formatDate(driver.hazmatEndorsementExpiration)}
            />
          </div>
          <div className="mt-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Endorsements
            </p>
            <Tokens values={driver.cdlEndorsements} />
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Medical Qualification" icon={Stethoscope}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Certificate Number"
              value={driver.medicalExaminerCertificateNumber}
            />
            <Field label="Examiner" value={driver.medicalExaminerName} />
            <Field
              label="National Registry"
              value={driver.nationalRegistryNumber}
            />
            <Field
              label="Issue Date"
              value={formatDate(driver.medicalCardIssueDate)}
            />
            <Field
              label="Expiration"
              value={formatDate(driver.medicalCardExpiration)}
            />
          </div>
        </Section>

        <Section title="TWIC and Qualification File" icon={FileCheck2}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="TWIC Number" value={driver.twicCardNumber} />
            <Field
              label="TWIC Expiration"
              value={formatDate(driver.twicCardExpiration)}
            />
            <Field
              label="DQ File Status"
              value={driver.driverQualificationFileStatus}
            />
            <Field label="Compliance" value={driver.complianceStatus} />
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="MVR and Background" icon={ClipboardCheck}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="MVR Status" value={driver.mvrStatus} />
            <Field label="MVR Check" value={formatDate(driver.mvrCheckDate)} />
            <Field
              label="Next MVR Review"
              value={formatDate(driver.mvrNextReviewDate)}
            />
            <Field
              label="Background Status"
              value={driver.backgroundCheckStatus}
            />
            <Field
              label="Background Check"
              value={formatDate(driver.backgroundCheckDate)}
            />
          </div>
        </Section>

        <Section title="Drug, Alcohol and Clearinghouse" icon={HeartPulse}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Drug Test" value={formatDate(driver.drugTestDate)} />
            <Field label="Drug Result" value={driver.drugTestResult} />
            <Field
              label="Alcohol Test"
              value={formatDate(driver.alcoholTestDate)}
            />
            <Field label="Alcohol Result" value={driver.alcoholTestResult} />
            <Field
              label="Clearinghouse Status"
              value={driver.clearinghouseStatus}
            />
            <Field
              label="Last Query"
              value={formatDate(driver.clearinghouseLastQueryDate)}
            />
            <Field
              label="Next Query"
              value={formatDate(driver.clearinghouseNextQueryDate)}
            />
          </div>
        </Section>
      </div>

      <Section title="Assignments" icon={Truck}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Carrier ID" value={driver.assignedCarrierId} />
          <Field label="Truck ID" value={driver.assignedTruckId} />
          <Field label="Trailer ID" value={driver.assignedTrailerId} />
          <Field label="Equipment ID" value={driver.assignedEquipmentId} />
          <Field label="Last Load" value={formatDate(driver.lastLoad)} />
          <Field
            label="Last Assignment"
            value={formatDate(driver.lastAssignmentDate)}
          />
          <Field label="Total Loads" value={driver.totalLoads ?? 0} />
        </div>

        {driver.assignedCarrierId ? (
          <div className="mt-4">
            <Link href={`/carriers/${driver.assignedCarrierId}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Building2 className="h-4 w-4" />
                Open Assigned Carrier
              </Button>
            </Link>
          </div>
        ) : null}
      </Section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Safety History" icon={ShieldCheck}>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Accident History
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {driver.accidentHistory || "No accident history recorded."}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Violation History
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {driver.violationHistory || "No violation history recorded."}
              </p>
            </div>
          </div>
        </Section>

        <Section title="Notes" icon={FileText}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {driver.notes || "No notes available."}
          </p>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Tags" icon={Tags}>
          <Tokens values={driver.tags} />
        </Section>

        <Section title="Timeline" icon={CalendarClock}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Created" value={formatDate(driver.createdAt)} />
            <Field label="Last Updated" value={formatDate(driver.updatedAt)} />
          </div>
        </Section>
      </div>

      <Section title="Compliance Snapshot" icon={Activity}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Compliance" value={driver.complianceStatus} />
          <Field label="MVR" value={driver.mvrStatus} />
          <Field label="Background" value={driver.backgroundCheckStatus} />
          <Field label="Clearinghouse" value={driver.clearinghouseStatus} />
        </div>
      </Section>

      <DriverFormModal
        open={editing}
        initialData={driver}
        onClose={() => {
          setEditing(false);
          void query.refetch();
        }}
      />
    </div>
  );
}
