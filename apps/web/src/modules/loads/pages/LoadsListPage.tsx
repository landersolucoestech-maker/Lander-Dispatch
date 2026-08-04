import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListLoads, useDeleteLoad } from "@workspace/api-client-react";
import type { Load } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { Search, Plus, FileText, ArrowRight, MoreHorizontal } from "lucide-react";
import { LoadFormModal } from "../components/LoadFormModal";
import { LoadViewModal } from "../components/LoadViewModal";
import { LoadImportPdfModal } from "../components/LoadImportPdfModal";

export default function LoadsListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [viewLoad, setViewLoad] = useState<Load | null>(null);
  const [editLoad, setEditLoad] = useState<Load | null>(null);

  const qc = useQueryClient();
  const deleteMutation = useDeleteLoad({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ["loads"] }) },
  });
  const handleDelete = (load: Load) => {
    if (!window.confirm(`Excluir load ${load.loadId}?`)) return;
    deleteMutation.mutate({ loadId: load.id });
  };

  const { data, isLoading } = useListLoads({ search: search || undefined, status: status !== "all" ? status : undefined, page, pageSize: 50 }, { query: { queryKey: ["loads", search, status, page] } });

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Loads</h1>
          <p className="text-sm font-mono text-muted-foreground">Active & Historical Freight</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
            <FileText className="w-4 h-4" /> Import PDF
          </Button>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Create Load
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Load ID, City, State..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-48">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL STATUSES</SelectItem>
              <SelectItem value="New">NEW</SelectItem>
              <SelectItem value="Dispatched">DISPATCHED</SelectItem>
              <SelectItem value="Picked Up">PICKED UP</SelectItem>
              <SelectItem value="In Route">IN ROUTE</SelectItem>
              <SelectItem value="Delivered">DELIVERED</SelectItem>
              <SelectItem value="Canceled">CANCELED</SelectItem>
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
              <TableHead>Load ID</TableHead>
              <TableHead>Dispatch Date</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Carrier / Broker</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((load) => (
              <TableRow key={load.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewLoad(load)}>
                <TableCell className="font-mono text-xs font-bold">{load.loadId}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatDate(load.dispatchDate)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate max-w-[120px]" title={`${load.pickupCity}, ${load.pickupState}`}>
                      {load.pickupCity}, {load.pickupState}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[120px]" title={`${load.deliveryCity}, ${load.deliveryState}`}>
                      {load.deliveryCity}, {load.deliveryState}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs font-mono">
                    <span className="text-foreground">{load.carrierName || "UNASSIGNED"}</span>
                    <span className="text-muted-foreground">B: {load.brokerName || "UNKNOWN"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatCurrency(load.rate)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={load.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewLoad(load)}>Ver</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditLoad(load)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(load)}>Excluir</DropdownMenuItem>
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

      <LoadFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <LoadFormModal open={!!editLoad} onClose={() => setEditLoad(null)} initialData={editLoad ?? undefined} />
      <LoadViewModal load={viewLoad} onClose={() => setViewLoad(null)} />
      <LoadImportPdfModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
