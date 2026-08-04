import { useGetBroker } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { ArrowLeft, Edit, Phone, Mail, FileText, Star, CreditCard } from "lucide-react";
import { formatDate } from "@/shared/lib/utils";

export default function BrokerDetailPage() {
  const params = useParams();
  const id = params.brokerId!;

  const { data: broker, isLoading } = useGetBroker(id, {
    query: {
      queryKey: ["broker", id],
      enabled: !!id
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-8 text-center font-mono text-sm text-muted-foreground">
        LOADING.BROKER...
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="flex-1 p-8 text-center font-mono text-sm text-destructive">
        BROKER.NOT.FOUND
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/brokers">
          <Button variant="outline" size="icon" className="w-8 h-8 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight uppercase truncate">{broker.companyName}</h1>
            <StatusBadge status={broker.status} />
          </div>
          <p className="text-sm font-mono text-muted-foreground">
            MC: {broker.mcNumber || "N/A"} | DOT: {broker.usdotNumber || "N/A"}
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
                <span className="text-chart-3">►</span> {broker.primaryContact || "Unassigned"}
              </div>
            </div>
            <div className="p-4 bg-card border border-border flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Rating</span>
              <div className="font-mono text-sm flex items-center gap-2">
                <Star className="w-3 h-3 text-chart-3 fill-chart-3" /> {broker.rating?.toFixed(1) || "NR"} / 5.0
              </div>
            </div>
            <div className="p-4 bg-card border border-border flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Phone</span>
              <div className="font-mono text-sm flex items-center gap-2">
                <Phone className="w-3 h-3 text-muted-foreground" /> {broker.phone || "--"}
              </div>
            </div>
            <div className="p-4 bg-card border border-border flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Email</span>
              <div className="font-mono text-sm flex items-center gap-2 truncate">
                <Mail className="w-3 h-3 text-muted-foreground shrink-0" /> {broker.email || "--"}
              </div>
            </div>
          </div>

          <div className="p-6 bg-card border border-border">
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Payment Profile
            </h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm font-mono">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Payment Terms</span>
                <span>{broker.paymentTerms || "Standard"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Avg Payment Days</span>
                <span>{broker.paymentDays ? `${broker.paymentDays} Days` : "--"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">QuickPay Available</span>
                <span>{broker.quickPay ? `Yes (${broker.quickPayFee || 0}%)` : "No"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Factoring</span>
                <span>{broker.factoringAccepted || "--"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-card border border-border flex flex-col gap-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText className="w-3 h-3" /> System Notes
            </h3>
            <p className="text-xs font-mono whitespace-pre-wrap text-muted-foreground mt-2">
              {broker.notes || "No notes available."}
            </p>
          </div>

          <div className="flex flex-col gap-2 font-mono text-[10px] text-muted-foreground border-t border-border pt-4">
            <div className="flex justify-between">
              <span>CREATED</span>
              <span>{formatDate(broker.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>LAST LOAD</span>
              <span>{formatDate(broker.lastLoadDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
