import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteLoad,
  useListLoads,
} from "@workspace/api-client-react";
import type { Load } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import {
  ArrowRight,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { LoadFormModal } from "../components/LoadFormModal";
import { LoadImportPdfModal } from "../components/LoadImportPdfModal";
import { LoadViewModal } from "../components/LoadViewModal";

function RouteSummary({ load }: { load: Load }) {
  const pickup = [load.pickupCity, load.pickupState].filter(Boolean).join(", ") || "Not configured";
  const delivery =
    [load.deliveryCity, load.deliveryState].filter(Boolean).join(", ") ||
    "Not configured";

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <span className="min-w-0 truncate" title={pickup}>{pickup}</span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate" title={delivery}>{delivery}</span>
    </div>
  );
}

function LoadActions({
  load,
  onView,
  onEdit,
  onDelete,
}: {
  load: Load;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8" aria-label={`Actions for ${load.loadId}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function LoadsListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [viewLoad, setViewLoad] = useState<Load | null>(null);
  const [editLoad, setEditLoad] = useState<Load | null>(null);

  useEffect(() => {
    const openCreate = () => setCreateOpen(true);
    const openImport = () => setImportOpen(true);
    window.addEventListener("lander:loads-create", openCreate);
    window.addEventListener("lander:loads-import-pdf", openImport);
    return () => {
      window.removeEventListener("lander:loads-create", openCreate);
      window.removeEventListener("lander:loads-import-pdf", openImport);
    };
  }, []);

  const queryClient = useQueryClient();
  const deleteMutation = useDeleteLoad({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["loads"] }),
    },
  });

  const loadsQuery = useListLoads(
    {
      search: search || undefined,
      status: status === "all" ? undefined : status,
      page,
      pageSize: 50,
    },
    { query: { queryKey: ["loads", search, status, page] } },
  );

  const handleDelete = (load: Load) => {
    if (!window.confirm(`Delete load ${load.loadId}?`)) return;
    deleteMutation.mutate({ loadId: load.id });
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  const loads = loadsQuery.data?.data ?? [];
  const meta = loadsQuery.data?.meta;

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">LOADS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Active and historical freight operations.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search load ID, city or state"
            className="pl-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-52">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Dispatched">Dispatched</SelectItem>
            <SelectItem value="Picked Up">Picked Up</SelectItem>
            <SelectItem value="In Route">In Route</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {loadsQuery.isLoading ? (
        <div className="border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Loading loads…
        </div>
      ) : loads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">No loads found.</p>
          {search || status !== "all" ? (
            <Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden border border-border bg-card lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Load ID</TableHead>
                  <TableHead>Dispatch Date</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Carrier / Broker</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads.map((load) => (
                  <TableRow
                    key={load.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setViewLoad(load)}
                  >
                    <TableCell className="font-mono text-xs font-bold">{load.loadId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(load.dispatchDate)}
                    </TableCell>
                    <TableCell className="max-w-[280px]"><RouteSummary load={load} /></TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-medium">{load.carrierName || "Unassigned"}</span>
                        <span className="text-muted-foreground">{load.brokerName || "Broker not assigned"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrency(load.rate)}
                    </TableCell>
                    <TableCell><StatusBadge status={load.status} /></TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <LoadActions
                        load={load}
                        onView={() => setViewLoad(load)}
                        onEdit={() => setEditLoad(load)}
                        onDelete={() => handleDelete(load)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {loads.map((load) => (
              <article
                key={load.id}
                className="cursor-pointer border border-border bg-card p-4"
                onClick={() => setViewLoad(load)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold">{load.loadId}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Dispatch Date: {formatDate(load.dispatchDate)}
                    </p>
                  </div>
                  <div onClick={(event) => event.stopPropagation()}>
                    <LoadActions
                      load={load}
                      onView={() => setViewLoad(load)}
                      onEdit={() => setEditLoad(load)}
                      onDelete={() => handleDelete(load)}
                    />
                  </div>
                </div>

                <div className="mt-4"><RouteSummary load={load} /></div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Carrier</p>
                    <p className="mt-1 font-medium">{load.carrierName || "Unassigned"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Broker</p>
                    <p className="mt-1 font-medium">{load.brokerName || "Not assigned"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rate</p>
                    <p className="mt-1 font-mono font-semibold">{formatCurrency(load.rate)}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Status</p>
                    <StatusBadge status={load.status} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} loads
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <LoadFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <LoadFormModal
        open={Boolean(editLoad)}
        onClose={() => setEditLoad(null)}
        initialData={editLoad ?? undefined}
      />
      <LoadViewModal load={viewLoad} onClose={() => setViewLoad(null)} />
      <LoadImportPdfModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
