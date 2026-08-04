import { useGetCarrier } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { ArrowLeft, Edit, MapPin, Phone, Mail, FileText, Star } from "lucide-react";
import { formatDate } from "@/shared/lib/utils";

export default function CarrierDetailPage() {
  const params = useParams();
  const id = params.carrierId!;

  const { data: carrier, isLoading } = useGetCarrier(id, {
    query: {
      queryKey: ["carrier", id],
      enabled: !!id
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-8 text-center font-mono text-sm text-muted-foreground">
        LOADING.CARRIER...
      </div>
    );
  }

  if (!carrier) {
    return (
      <div className="flex-1 p-8 text-center font-mono text-sm text-destructive">
        CARRIER.NOT.FOUND
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/carriers">
          <Button variant="outline" size="icon" className="w-8 h-8 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight uppercase truncate">{carrier.companyName}</h1>
            <StatusBadge status={carrier.status} />
          </div>
          <p className="text-sm font-mono text-muted-foreground">
            MC: {carrier.mcNumber || "N/A"} | DOT: {carrier.usdotNumber || "N/A"}
          </p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Edit className="w-4 h-4" /> Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-card border border-border flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Primary Contact</span>
              <div className="font-mono text-sm flex items-center gap-2">
                <span className="text-primary">►</span> {carrier.primaryContact || "Unassigned"}
              </div>
            </div>
            <div className="p-4 bg-card border border-border flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Rating</span>
              <div className="font-mono text-sm flex items-center gap-2">
                <Star className="w-3 h-3 text-primary fill-primary" /> {carrier.rating?.toFixed(1) || "NR"} / 5.0
              </div>
            </div>
            <div className="p-4 bg-card border border-border flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Phone</span>
              <div className="font-mono text-sm flex items-center gap-2">
                <Phone className="w-3 h-3 text-muted-foreground" /> {carrier.phone || "--"}
              </div>
            </div>
            <div className="p-4 bg-card border border-border flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Email</span>
              <div className="font-mono text-sm flex items-center gap-2 truncate">
                <Mail className="w-3 h-3 text-muted-foreground shrink-0" /> {carrier.email || "--"}
              </div>
            </div>
          </div>

          <div className="p-6 bg-card border border-border">
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2">Operational Data</h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm font-mono">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Fleet Size</span>
                <span>{carrier.fleetSize || "--"} Units</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Service Types</span>
                <span>{carrier.serviceTypes?.join(", ") || "--"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Operating States</span>
                <span className="truncate" title={carrier.operatingStates?.join(", ")}>
                  {carrier.operatingStates?.join(", ") || "--"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Authority Status</span>
                <span>{carrier.authorityStatus || "--"}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-card border border-border">
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2">Financials</h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm font-mono">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Payment Terms</span>
                <span>{carrier.paymentTerms || "Standard"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Factoring</span>
                <span>{carrier.factoringCompany || "None"}</span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-[10px] text-muted-foreground">Bank Account</span>
                <span>{carrier.bankName ? `${carrier.bankName} (...${carrier.accountNumberLast4 || '****'})` : "--"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-primary/5 border border-primary/20 flex flex-col gap-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Location
            </h3>
            <p className="text-sm font-mono leading-relaxed">
              {carrier.companyAddress ? (
                <>
                  {carrier.companyAddress}<br/>
                  {carrier.companyCity}, {carrier.companyState} {carrier.companyZip}
                </>
              ) : "--"}
            </p>
          </div>

          <div className="p-4 bg-card border border-border flex flex-col gap-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText className="w-3 h-3" /> System Notes
            </h3>
            <p className="text-xs font-mono whitespace-pre-wrap text-muted-foreground mt-2">
              {carrier.notes || "No notes available."}
            </p>
          </div>

          <div className="flex flex-col gap-2 font-mono text-[10px] text-muted-foreground border-t border-border pt-4">
            <div className="flex justify-between">
              <span>CREATED</span>
              <span>{formatDate(carrier.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>LAST LOAD</span>
              <span>{formatDate(carrier.lastLoadDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
