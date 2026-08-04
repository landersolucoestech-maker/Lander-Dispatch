import { useGetLoad } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { ArrowLeft, Edit, MapPin, FileText, ArrowRight } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/shared/lib/utils";

export default function LoadDetailPage() {
  const params = useParams();
  const id = params.loadId!;

  const { data: load, isLoading } = useGetLoad(id, {
    query: {
      queryKey: ["load", id],
      enabled: !!id
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-8 text-center font-mono text-sm text-muted-foreground">
        LOADING.LOAD...
      </div>
    );
  }

  if (!load) {
    return (
      <div className="flex-1 p-8 text-center font-mono text-sm text-destructive">
        LOAD.NOT.FOUND
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/loads">
          <Button variant="outline" size="icon" className="w-8 h-8 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight uppercase truncate">Load {load.loadId}</h1>
            <StatusBadge status={load.status} />
          </div>
          <p className="text-sm font-mono text-muted-foreground">
            Dispatched: {formatDate(load.dispatchDate)}
          </p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Edit className="w-4 h-4" /> Edit Load
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-card border border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mt-16 -mr-16 rounded-full pointer-events-none blur-3xl" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-6 border-b border-border pb-2">Route</h2>
            
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
              <div className="flex-1 w-full space-y-2">
                <span className="text-[10px] font-mono text-chart-3 border border-chart-3/20 bg-chart-3/10 px-1 inline-block">PICKUP</span>
                <p className="font-mono font-medium text-lg">{load.pickupCity}, {load.pickupState}</p>
                <p className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                  <span className="text-primary">►</span> {load.pickupEstimated ? formatDateTime(load.pickupEstimated) : 'TBD'}
                </p>
              </div>

              <ArrowRight className="hidden md:block w-6 h-6 text-muted-foreground shrink-0 mt-4" />

              <div className="flex-1 w-full space-y-2 md:text-right">
                <span className="text-[10px] font-mono text-primary border border-primary/20 bg-primary/10 px-1 inline-block">DELIVERY</span>
                <p className="font-mono font-medium text-lg">{load.deliveryCity}, {load.deliveryState}</p>
                <p className="text-xs font-mono text-muted-foreground flex items-center md:justify-end gap-1">
                  <span className="text-primary">►</span> {load.deliveryEstimated ? formatDateTime(load.deliveryEstimated) : 'TBD'}
                </p>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between font-mono text-xs">
              <span className="text-muted-foreground">DISTANCE</span>
              <span className="font-medium text-primary">{load.miles || '--'} MILES</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-card border border-border space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Carrier</h2>
              {load.carrierId ? (
                <div className="space-y-2">
                  <p className="font-medium uppercase">{load.carrierName}</p>
                  <Link href={`/carriers/${load.carrierId}`} className="text-xs font-mono text-primary hover:underline">
                    VIEW.PROFILE
                  </Link>
                </div>
              ) : (
                <p className="text-sm font-mono text-muted-foreground">UNASSIGNED</p>
              )}
            </div>
            
            <div className="p-6 bg-card border border-border space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Broker</h2>
              {load.brokerId ? (
                <div className="space-y-2">
                  <p className="font-medium uppercase">{load.brokerName}</p>
                  <Link href={`/brokers/${load.brokerId}`} className="text-xs font-mono text-primary hover:underline">
                    VIEW.PROFILE
                  </Link>
                </div>
              ) : (
                <p className="text-sm font-mono text-muted-foreground">UNASSIGNED</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-primary/10 border border-primary/20 space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Financials</h2>
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs text-primary/80">GROSS RATE</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(load.rate)}</span>
            </div>
            <div className="flex items-center justify-between font-mono pt-2 border-t border-primary/20">
              <span className="text-xs text-primary/80">RATE / MILE</span>
              <span className="text-sm text-primary">{formatCurrency(load.ratePerMile)}</span>
            </div>
          </div>

          <div className="p-4 bg-card border border-border flex flex-col gap-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText className="w-3 h-3" /> Dispatch Instructions
            </h3>
            <p className="text-xs font-mono whitespace-pre-wrap text-muted-foreground mt-2">
              {load.dispatchInstructions || "No instructions provided."}
            </p>
          </div>
          
          <div className="p-4 bg-card border border-border flex flex-col gap-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Facility Notes
            </h3>
            <div className="mt-2 space-y-3">
              <div>
                <span className="text-[10px] font-mono text-chart-3">PICKUP:</span>
                <p className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                  {load.pickupInstructions || "--"}
                </p>
              </div>
              <div className="border-t border-border/50 pt-2">
                <span className="text-[10px] font-mono text-primary">DELIVERY:</span>
                <p className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                  {load.deliveryInstructions || "--"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
