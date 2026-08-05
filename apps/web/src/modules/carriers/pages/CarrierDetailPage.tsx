import { useState } from "react";
import { Link, useParams } from "wouter";
import { useGetCarrier } from "@workspace/api-client-react";
import type { Carrier } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { CarrierFormModal } from "../components/CarrierFormModal";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Edit,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Star,
  Truck,
  UserRound,
} from "lucide-react";

type Equipment = {
  year: string;
  make: string;
  model: string;
  vin: string;
  color: string;
  plateNumber: string;
};

type AssignedDriver = {
  name: string;
  phone: string;
  phone2: string;
  emergencyContactName: string;
  emergencyPhone: string;
  emergencyPhone2: string;
  email: string;
  licenseType: string;
  cdlNumber: string;
  twicCard: boolean;
};

type FleetEntry = {
  id?: string;
  truck: Equipment;
  trailer: Equipment;
  driver: AssignedDriver;
};

type CarrierWithDetails = Carrier & {
  phone2?: string | null;
  emergencyContactName?: string | null;
  emergencyPhone?: string | null;
  emergencyPhone2?: string | null;
  weeklyMinimumAmount?: number | null;
  totalTripsPerWeek?: number | null;
  fleetData?: FleetEntry[];
};

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
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DataField({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div
        className={
          emphasized
            ? "mt-1 break-words text-sm font-bold text-primary"
            : "mt-1 break-words text-sm font-medium"
        }
      >
        {value || "—"}
      </div>
    </div>
  );
}

function EquipmentSummary({ title, equipment }: { title: string; equipment: Equipment }) {
  const identity = [equipment.year, equipment.make, equipment.model].filter(Boolean).join(" ");

  return (
    <div className="border border-border bg-background p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold">{identity || "Not configured"}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
        <DataField label="VIN" value={equipment.vin} />
        <DataField label="Color" value={equipment.color} />
        <DataField label="Plate" value={equipment.plateNumber} />
      </div>
    </div>
  );
}

export default function CarrierDetailPage() {
  const params = useParams<{ carrierId: string }>();
  const carrierId = params.carrierId;
  const [editing, setEditing] = useState(false);

  const carrierQuery = useGetCarrier(carrierId, {
    query: {
      queryKey: ["carrier", carrierId],
      enabled: Boolean(carrierId),
    },
  });

  if (carrierQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading carrier…
      </div>
    );
  }

  if (!carrierQuery.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-destructive">
        Carrier not found.
      </div>
    );
  }

  const carrier = carrierQuery.data as CarrierWithDetails;
  const fleet = carrier.fleetData ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link href="/carriers">
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Back to carriers">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-2xl font-bold tracking-tight">{carrier.companyName}</h1>
              <StatusBadge status={carrier.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              MC {carrier.mcNumber || "not configured"} · USDOT {carrier.usdotNumber || "not configured"}
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}>
          <Edit className="h-4 w-4" />
          Edit Carrier
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Primary Contact</p>
            <UserRound className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-sm font-semibold">{carrier.primaryContact || "Unassigned"}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Rating</p>
            <Star className="h-4 w-4 fill-primary text-primary" />
          </div>
          <p className="mt-2 text-sm font-semibold">
            {carrier.rating == null ? "Not rated" : `${carrier.rating.toFixed(1)} / 5.0`}
          </p>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Fleet Entries</p>
            <Truck className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-sm font-semibold">{fleet.length}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Last Load</p>
            <FileCheck2 className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-sm font-semibold">{formatDate(carrier.lastLoadDate)}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Section title="Contacts" icon={Phone}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DataField label="Primary Contact" value={carrier.primaryContact} />
              <DataField label="Phone Number" value={carrier.phone} />
              <DataField label="Phone Number 2" value={carrier.phone2} />
              <DataField label="Email" value={carrier.email} />
              <DataField label="Website" value={carrier.website} />
              <DataField label="24/7 Emergency Contact" value={carrier.emergencyContactName} emphasized />
              <DataField label="Emergency Phone" value={carrier.emergencyPhone} />
              <DataField label="Emergency Phone 2" value={carrier.emergencyPhone2} />
            </div>
          </Section>

          <Section title="Authority & Compliance" icon={ShieldAlert}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DataField label="Carrier Type" value={carrier.carrierType} />
              <DataField label="USDOT Number" value={carrier.usdotNumber} />
              <DataField label="MC Number" value={carrier.mcNumber} />
              <DataField label="EIN Number" value={carrier.einNumber} />
              <DataField label="Authority Status" value={carrier.authorityStatus} />
              <DataField label="Insurance Expiration" value={formatDate(carrier.insuranceExpiration)} />
            </div>
          </Section>

          <Section title="Operations" icon={Truck}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DataField label="Operating States" value={carrier.operatingStates?.join(", ")} />
              <DataField
                label="Weekly Minimum Amount"
                value={carrier.weeklyMinimumAmount == null ? "—" : formatCurrency(carrier.weeklyMinimumAmount)}
              />
              <DataField label="Total Trips per Week" value={carrier.totalTripsPerWeek} />
              <DataField
                label="Rate per Mile"
                value={carrier.ratePerMile == null ? "—" : formatCurrency(carrier.ratePerMile)}
              />
              <DataField label="Last Load" value={formatDate(carrier.lastLoadDate)} />
            </div>
          </Section>

          <Section title="Fleet Equipment" icon={Truck}>
            {fleet.length ? (
              <div className="space-y-4">
                {fleet.map((entry, index) => (
                  <div key={entry.id ?? index} className="space-y-4 border border-border bg-muted/10 p-4">
                    <p className="text-sm font-semibold">Equipment #{index + 1}</p>
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <EquipmentSummary title="Truck" equipment={entry.truck} />
                      <EquipmentSummary title="Trailer" equipment={entry.trailer} />
                    </div>
                    <div className="border border-border bg-background p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Assigned Driver
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <DataField label="Name" value={entry.driver.name} emphasized />
                        <DataField label="Phone" value={entry.driver.phone} />
                        <DataField label="Phone 2" value={entry.driver.phone2} />
                        <DataField label="Email" value={entry.driver.email} />
                        <DataField label="24/7 Emergency Contact" value={entry.driver.emergencyContactName} />
                        <DataField label="Emergency Phone" value={entry.driver.emergencyPhone} />
                        <DataField label="Emergency Phone 2" value={entry.driver.emergencyPhone2} />
                        <DataField label="License Type" value={entry.driver.licenseType} />
                        <DataField label="CDL Number" value={entry.driver.cdlNumber} />
                        <DataField label="TWIC Card" value={entry.driver.twicCard ? "Verified" : "Not verified"} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No fleet equipment registered.</p>
            )}
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title="Company Address" icon={MapPin}>
            <p className="text-sm leading-6">
              {carrier.companyAddress || "Address not configured"}
              <br />
              {[carrier.companyCity, carrier.companyState, carrier.companyZip].filter(Boolean).join(", ") || "—"}
            </p>
          </Section>

          <Section title="Payment & Factoring" icon={CreditCard}>
            <div className="space-y-4">
              <DataField label="Payment Terms" value={carrier.paymentTerms} />
              <DataField label="Factoring Company" value={carrier.factoringCompany || "None"} />
              <DataField
                label="Factoring Fee"
                value={carrier.factoringFee == null ? "—" : `${carrier.factoringFee.toFixed(2)}%`}
              />
            </div>
          </Section>

          <Section title="Banking" icon={CreditCard}>
            <div className="space-y-4">
              <DataField label="Bank Name" value={carrier.bankName} />
              <DataField label="Account Holder" value={carrier.accountHolder} />
              <DataField
                label="Account Number"
                value={carrier.accountNumberLast4 ? `•••• ${carrier.accountNumberLast4}` : "Not configured"}
              />
              <DataField
                label="Routing Number"
                value={carrier.routingNumberLast4 ? `•••• ${carrier.routingNumberLast4}` : "Not configured"}
              />
              <DataField
                label="Bank Address"
                value={[
                  carrier.bankAddress,
                  carrier.bankCity,
                  carrier.bankState,
                  carrier.bankZip,
                ].filter(Boolean).join(", ")}
              />
              <DataField label="Zelle" value={carrier.zelleAccount} />
              <DataField label="Cash App" value={carrier.cashAppAccount} />
            </div>
          </Section>

          <Section title="Notes" icon={Mail}>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {carrier.notes || "No notes available."}
            </p>
          </Section>

          <div className="border-t border-border pt-4 text-xs text-muted-foreground">
            <div className="flex justify-between gap-3">
              <span>Created</span>
              <span>{formatDate(carrier.createdAt)}</span>
            </div>
            <div className="mt-2 flex justify-between gap-3">
              <span>Updated</span>
              <span>{formatDate(carrier.updatedAt)}</span>
            </div>
          </div>
        </aside>
      </div>

      <CarrierFormModal
        open={editing}
        initialData={carrier}
        onClose={() => {
          setEditing(false);
          void carrierQuery.refetch();
        }}
      />
    </div>
  );
}
