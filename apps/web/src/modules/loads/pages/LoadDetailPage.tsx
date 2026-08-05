import { useState } from "react";
import { useGetLoad } from "@workspace/api-client-react";
import type { LoadVehicle } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  CarFront,
  CircleDollarSign,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Scale,
  Truck,
  WalletCards,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate, formatDateTime } from "@/shared/lib/utils";
import { LoadFormModal } from "../components/LoadFormModal";

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

function locationLabel(
  address?: string | null,
  city?: string | null,
  state?: string | null,
  zip?: string | null,
) {
  return [address, city, state, zip].filter(Boolean).join(", ");
}

function VehicleCard({ vehicle }: { vehicle: LoadVehicle }) {
  const title = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Vehicle #{vehicle.vehicleNumber}
          </p>
          <h3 className="mt-1 text-sm font-semibold">
            {title || "Vehicle details not configured"}
          </h3>
        </div>
        <CarFront className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Type" value={vehicle.type} />
        <Field label="Color" value={vehicle.color} />
        <Field label="Plate" value={vehicle.plate} />
        <Field label="VIN" value={vehicle.vin} />
        <Field label="Lot Number" value={vehicle.lotNumber} />
        <Field label="Buyer Number" value={vehicle.buyerNumber} />
      </div>

      {vehicle.additionalInfo ? (
        <p className="mt-4 border-t border-border pt-3 text-sm leading-6 text-muted-foreground">
          {vehicle.additionalInfo}
        </p>
      ) : null}
    </article>
  );
}

export default function LoadDetailPage() {
  const params = useParams<{ loadId: string }>();
  const loadId = params.loadId;
  const [editing, setEditing] = useState(false);

  const query = useGetLoad(loadId, {
    query: {
      queryKey: ["load", loadId],
      enabled: Boolean(loadId),
    },
  });

  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading Load…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <section className="w-full max-w-lg border border-destructive/40 bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Load not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {query.error instanceof Error
              ? query.error.message
              : "The requested Load could not be loaded."}
          </p>
          <Link href="/loads">
            <Button variant="outline" className="mt-5">
              Return to Loads
            </Button>
          </Link>
        </section>
      </div>
    );
  }

  const load = query.data;
  const pickupLocation = locationLabel(
    load.pickupAddress,
    load.pickupCity,
    load.pickupState,
    load.pickupZip,
  );
  const deliveryLocation = locationLabel(
    load.deliveryAddress,
    load.deliveryCity,
    load.deliveryState,
    load.deliveryZip,
  );

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link href="/loads">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Return to Loads"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
                Load {load.loadId}
              </h1>
              <StatusBadge status={load.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Dispatch Date: {formatDate(load.dispatchDate)} · {load.freightType || "Freight type not configured"}
            </p>
          </div>
        </div>

        <Button className="gap-2" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
          Edit Load
        </Button>
      </header>

      <section
        aria-label="Load summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <div className="border border-border bg-card p-4">
          <Field label="Miles" value={load.miles == null ? null : `${load.miles} mi`} />
        </div>
        <div className="border border-border bg-card p-4">
          <Field label="Gross Rate" value={formatCurrency(load.rate)} />
        </div>
        <div className="border border-border bg-card p-4">
          <Field label="Carrier Pay" value={formatCurrency(load.carrierPay)} />
        </div>
        <div className="border border-border bg-card p-4">
          <Field label="Payment Status" value={load.paymentStatus} />
        </div>
        <div className="border border-border bg-card p-4">
          <Field label="Vehicles" value={load.vehicles?.length ?? 0} />
        </div>
      </section>

      <Section title="Route" icon={MapPin}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="border border-border bg-muted/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Pickup
            </p>
            <p className="mt-2 text-lg font-semibold">
              {[load.pickupCity, load.pickupState].filter(Boolean).join(", ") || "Not configured"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {load.pickupEstimated ? formatDateTime(load.pickupEstimated) : "Schedule not configured"}
            </p>
          </div>

          <ArrowRight className="hidden h-5 w-5 text-muted-foreground lg:block" aria-hidden="true" />

          <div className="border border-border bg-muted/10 p-4 lg:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Delivery
            </p>
            <p className="mt-2 text-lg font-semibold">
              {[load.deliveryCity, load.deliveryState].filter(Boolean).join(", ") || "Not configured"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {load.deliveryEstimated ? formatDateTime(load.deliveryEstimated) : "Schedule not configured"}
            </p>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Pickup Facility" icon={MapPin}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Facility" value={load.pickupName} />
            <Field label="Contact" value={load.pickupContactName} />
            <Field label="Phone" value={load.pickupPhone} />
            <Field label="Email" value={load.pickupEmail} />
            <Field label="Address" value={pickupLocation} />
            <Field label="Estimated" value={formatDateTime(load.pickupEstimated)} />
            <Field label="Deadline" value={formatDateTime(load.pickupDeadline)} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {load.pickupPhone ? (
              <a href={`tel:${load.pickupPhone}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="h-4 w-4" /> Call Pickup
                </Button>
              </a>
            ) : null}
            {load.pickupEmail ? (
              <a href={`mailto:${load.pickupEmail}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="h-4 w-4" /> Email Pickup
                </Button>
              </a>
            ) : null}
          </div>

          <p className="mt-4 border-t border-border pt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {load.pickupInstructions || "No pickup instructions provided."}
          </p>
        </Section>

        <Section title="Delivery Facility" icon={MapPin}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Facility" value={load.deliveryName} />
            <Field label="Contact" value={load.deliveryContactName} />
            <Field label="Phone" value={load.deliveryPhone} />
            <Field label="Email" value={load.deliveryEmail} />
            <Field label="Address" value={deliveryLocation} />
            <Field label="Estimated" value={formatDateTime(load.deliveryEstimated)} />
            <Field label="Deadline" value={formatDateTime(load.deliveryDeadline)} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {load.deliveryPhone ? (
              <a href={`tel:${load.deliveryPhone}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="h-4 w-4" /> Call Delivery
                </Button>
              </a>
            ) : null}
            {load.deliveryEmail ? (
              <a href={`mailto:${load.deliveryEmail}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="h-4 w-4" /> Email Delivery
                </Button>
              </a>
            ) : null}
          </div>

          <p className="mt-4 border-t border-border pt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {load.deliveryInstructions || "No delivery instructions provided."}
          </p>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Carrier" icon={Truck}>
          {load.carrierId ? (
            <div className="space-y-4">
              <Field label="Assigned Carrier" value={load.carrierName} />
              <Link href={`/carriers/${load.carrierId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Truck className="h-4 w-4" /> Open Carrier
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No Carrier assigned.</p>
          )}
        </Section>

        <Section title="Broker" icon={Building2}>
          {load.brokerId ? (
            <div className="space-y-4">
              <Field label="Assigned Broker" value={load.brokerName} />
              <Link href={`/brokers/${load.brokerId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Building2 className="h-4 w-4" /> Open Broker
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No Broker assigned.</p>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Financials" icon={CircleDollarSign}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Gross Rate" value={formatCurrency(load.rate)} />
            <Field label="Carrier Pay" value={formatCurrency(load.carrierPay)} />
            <Field label="Fuel Surcharge" value={formatCurrency(load.fuelSurcharge)} />
            <Field label="Rate per Mile" value={formatCurrency(load.ratePerMile)} />
            <Field label="Payment Method" value={load.paymentMethod} />
            <Field label="Payment Status" value={load.paymentStatus} />
          </div>
        </Section>

        <Section title="Equipment" icon={Scale}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Freight Type" value={load.freightType} />
            <Field label="Equipment Type" value={load.equipmentType} />
            <Field label="Weight" value={load.weight == null ? null : `${load.weight} lb`} />
            <Field label="Miles" value={load.miles == null ? null : `${load.miles} mi`} />
          </div>
        </Section>
      </div>

      <Section title={`Vehicles (${load.vehicles?.length ?? 0})`} icon={CarFront}>
        {load.vehicles?.length ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {load.vehicles.map((vehicle, index) => (
              <VehicleCard key={`${vehicle.vehicleNumber}-${index}`} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No vehicles configured.</p>
        )}
      </Section>

      <Section title="Dispatch Instructions" icon={FileText}>
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {load.dispatchInstructions || "No dispatch instructions provided."}
        </p>
      </Section>

      <Section title="Timeline" icon={CalendarClock}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Dispatch Date" value={formatDate(load.dispatchDate)} />
          <Field label="Pickup Estimate" value={formatDateTime(load.pickupEstimated)} />
          <Field label="Delivery Estimate" value={formatDateTime(load.deliveryEstimated)} />
          <Field label="Created" value={formatDate(load.createdAt)} />
        </div>
      </Section>

      <section className="sr-only" aria-label="Load payment classification">
        <WalletCards aria-hidden="true" />
      </section>

      <LoadFormModal
        open={editing}
        initialData={load}
        onClose={() => {
          setEditing(false);
          void query.refetch();
        }}
      />
    </div>
  );
}
