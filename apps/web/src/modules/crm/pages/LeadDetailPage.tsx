import { useGetCrmLead } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { ArrowLeft, Edit, MapPin, Phone, Mail, FileText, BarChart } from "lucide-react";
import { formatCurrency, formatDate } from "@/shared/lib/utils";

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.leadId!;

  const { data: lead, isLoading } = useGetCrmLead(id, {
    query: {
      queryKey: ["lead", id],
      enabled: !!id
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-8 text-center font-mono text-sm text-muted-foreground">
        LOADING.LEAD...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex-1 p-8 text-center font-mono text-sm text-destructive">
        LEAD.NOT.FOUND
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/crm/leads">
          <Button variant="outline" size="icon" className="w-8 h-8 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight uppercase truncate">{lead.companyName}</h1>
            <StatusBadge status={lead.pipelineStage} />
            <StatusBadge status={lead.status} className="hidden sm:inline-flex" />
          </div>
          <p className="text-sm font-mono text-muted-foreground">
            Contact: {lead.primaryContact || "N/A"}
          </p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Edit className="w-4 h-4" /> Edit Lead
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-card border border-border flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Phone</span>
              <div className="font-mono text-sm flex items-center gap-2">
                <Phone className="w-3 h-3 text-muted-foreground" /> {lead.phone || "--"}
              </div>
            </div>
            <div className="p-4 bg-card border border-border flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Email</span>
              <div className="font-mono text-sm flex items-center gap-2 truncate">
                <Mail className="w-3 h-3 text-muted-foreground shrink-0" /> {lead.email || "--"}
              </div>
            </div>
            <div className="p-4 bg-card border border-border flex flex-col gap-1 col-span-2">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Address</span>
              <div className="font-mono text-sm flex items-center gap-2 truncate">
                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" /> 
                {lead.city && lead.state ? `${lead.city}, ${lead.state}` : "--"}
              </div>
            </div>
          </div>

          <div className="p-6 bg-card border border-border">
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2 flex items-center gap-2">
              <BarChart className="w-4 h-4" /> Opportunity Profile
            </h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm font-mono">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Est Weekly Revenue</span>
                <span className="text-primary font-medium">{formatCurrency(lead.estimatedWeeklyRevenue)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Est Weekly Loads</span>
                <span>{lead.estimatedWeeklyLoads || "--"} Loads</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Fleet Size</span>
                <span>{lead.fleetSize || "--"} Units</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Lead Source</span>
                <span>{lead.leadSource || "--"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-card border border-border flex flex-col gap-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Follow-up</h3>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-muted-foreground">NEXT ACTION DUE</span>
              <span className="font-mono text-sm font-medium text-chart-2">
                {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : "NOT SCHEDULED"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-muted-foreground">LAST CONTACT</span>
              <span className="font-mono text-sm">
                {lead.lastContact ? formatDate(lead.lastContact) : "--"}
              </span>
            </div>
          </div>

          <div className="p-4 bg-card border border-border flex flex-col gap-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText className="w-3 h-3" /> CRM Notes
            </h3>
            <p className="text-xs font-mono whitespace-pre-wrap text-muted-foreground mt-2">
              {lead.notes || "No notes available."}
            </p>
          </div>

          <div className="flex flex-col gap-2 font-mono text-[10px] text-muted-foreground border-t border-border pt-4">
            <div className="flex justify-between">
              <span>CREATED</span>
              <span>{formatDate(lead.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
