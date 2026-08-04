import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListCrmLeads, useDeleteCrmLead } from "@workspace/api-client-react";
import type { CrmLead } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { LeadFormModal } from "../components/LeadFormModal";
import { LeadViewModal } from "../components/LeadViewModal";

export default function LeadsListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewLead, setViewLead] = useState<CrmLead | null>(null);
  const [editLead, setEditLead] = useState<CrmLead | null>(null);

  const qc = useQueryClient();
  const deleteMutation = useDeleteCrmLead({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }) },
  });
  const handleDelete = (lead: CrmLead) => {
    if (!window.confirm(`Excluir lead ${lead.companyName}?`)) return;
    deleteMutation.mutate({ leadId: lead.id });
  };

  const { data, isLoading } = useListCrmLeads({
    query: {
      search: search || undefined,
      status: status !== "all" ? status : undefined,
      page,
      pageSize: 50,
      queryKey: ["leads", search, status, page]
    }
  });

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Leads</h1>
          <p className="text-sm font-mono text-muted-foreground">CRM Pipeline</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Add Lead
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Company, Contact..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-48">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Pipeline Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL STAGES</SelectItem>
              <SelectItem value="New">NEW</SelectItem>
              <SelectItem value="Contacted">CONTACTED</SelectItem>
              <SelectItem value="Qualified">QUALIFIED</SelectItem>
              <SelectItem value="Proposal">PROPOSAL</SelectItem>
              <SelectItem value="Won">WON</SelectItem>
              <SelectItem value="Lost">LOST</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center font-mono text-sm text-muted-foreground border border-border bg-card">
          LOADING.RECORDS...
        </div>
      ) : !data?.data.length ? (
        <div className="p-12 text-center border border-border bg-card flex flex-col items-center justify-center gap-2">
          <p className="font-mono text-sm text-muted-foreground">NO.RECORDS.FOUND</p>
          {search || status !== "all" ? (
            <Button variant="link" onClick={() => { setSearch(""); setStatus("all"); }} className="font-mono text-xs">
              CLEAR.FILTERS
            </Button>
          ) : null}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Est. Weekly Rev</TableHead>
              <TableHead>Next Follow-Up</TableHead>
              <TableHead className="w-14"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((lead) => (
              <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewLead(lead)}>
                <TableCell className="font-medium uppercase text-xs">{lead.companyName}</TableCell>
                <TableCell className="font-mono text-xs">
                  <div className="flex flex-col">
                    <span className="text-foreground">{lead.primaryContact || "--"}</span>
                    <span className="text-muted-foreground">{lead.phone || "--"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={lead.pipelineStage} />
                </TableCell>
                <TableCell className="text-right font-mono font-medium text-primary">
                  {formatCurrency(lead.estimatedWeeklyRevenue)}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatDate(lead.nextFollowUp)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewLead(lead)}>Ver</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditLead(lead)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(lead)}>Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="font-mono text-xs text-muted-foreground">
            PAGE {data.meta.page} OF {data.meta.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>PREV</Button>
            <Button variant="outline" size="sm" disabled={page === data.meta.totalPages} onClick={() => setPage(p => p + 1)}>NEXT</Button>
          </div>
        </div>
      )}

      <LeadFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <LeadFormModal open={!!editLead} onClose={() => setEditLead(null)} initialData={editLead ?? undefined} />
      <LeadViewModal lead={viewLead} onClose={() => setViewLead(null)} />
    </div>
  );
}
