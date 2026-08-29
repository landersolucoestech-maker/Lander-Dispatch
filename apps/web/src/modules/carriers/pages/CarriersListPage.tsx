import { useEffect, useState } from "react";
import { useListCarriers } from "@workspace/api-client-react";
import type { Carrier } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatDate, formatDecimal } from "@/shared/lib/utils";
import { Search } from "lucide-react";
import { CarrierFormModal } from "../components/CarrierFormModal";
import { CarrierViewModal } from "../components/CarrierViewModal";

export default function CarriersListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewCarrier, setViewCarrier] = useState<Carrier | null>(null);

  useEffect(() => {
    const openCreate = () => setCreateOpen(true);
    window.addEventListener("lander:carriers-add", openCreate);
    return () => window.removeEventListener("lander:carriers-add", openCreate);
  }, []);

  const { data, isLoading } = useListCarriers({ search: search || undefined, status: status !== "all" ? status : undefined, page, pageSize: 50 }, { query: { queryKey: ["carriers", search, status, page] } });

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Carrier Network</h1>
          <p className="text-sm font-mono text-muted-foreground">Directory & Status</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Name, MC#, DOT#..."
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
              <SelectItem value="Active">ACTIVE</SelectItem>
              <SelectItem value="Inactive">INACTIVE</SelectItem>
              <SelectItem value="Pending">PENDING</SelectItem>
              <SelectItem value="Blacklisted">BLACKLISTED</SelectItem>
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
              <TableHead>Identifiers</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Last Load</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((carrier) => {
              const rating = formatDecimal(carrier.rating, 1);
              return (
                <TableRow key={carrier.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewCarrier(carrier)}>
                  <TableCell className="font-medium">{carrier.companyName}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <div className="flex flex-col">
                      <span>MC: {carrier.mcNumber || "--"}</span>
                      <span>DOT: {carrier.usdotNumber || "--"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <div className="flex flex-col">
                      <span className="text-foreground">{carrier.primaryContact || "--"}</span>
                      <span className="text-muted-foreground">{carrier.phone || "--"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      {rating ? (
                        <>
                          <span className="text-primary">{rating}</span>
                          <span className="text-muted-foreground">/5.0</span>
                        </>
                      ) : "--"}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatDate(carrier.lastLoadDate)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={carrier.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-mono text-[10px]"
                      onClick={(e) => { e.stopPropagation(); setViewCarrier(carrier); }}
                    >
                      VIEW
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
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

      <CarrierFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <CarrierViewModal carrier={viewCarrier} onClose={() => setViewCarrier(null)} />
    </div>
  );
}
