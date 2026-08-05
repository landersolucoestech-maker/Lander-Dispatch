import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Activity,
  FileClock,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { listAuditLogs, type AuditLogRecord } from "../api";

const ACTION_OPTIONS = [
  "carrier.created",
  "carrier.updated",
  "carrier.deleted",
  "broker.created",
  "broker.updated",
  "broker.deleted",
  "load.created",
  "load.updated",
  "load.deleted",
  "contact.created",
  "contact.updated",
  "contact.deleted",
  "lead.created",
  "lead.updated",
  "lead.converted",
  "lead.deleted",
  "driver.created",
  "driver.updated",
  "driver.deleted",
  "invoice.created",
  "invoice.updated",
  "invoice.payment.recorded",
  "invoice.deleted",
  "transaction.created",
  "transaction.updated",
  "transaction.deleted",
  "company_profile.updated",
  "document.created",
  "document.updated",
  "document.deleted",
  "development.seed.completed",
] as const;

const ENTITY_TYPES = [
  ["carrier", "Carrier"],
  ["broker", "Broker"],
  ["load", "Load"],
  ["contact", "Contact"],
  ["lead", "Lead"],
  ["driver", "Driver"],
  ["invoice", "Invoice"],
  ["transaction", "Transaction"],
  ["company_profile", "Company Profile"],
  ["document", "Document"],
  ["development_dataset", "Development Dataset"],
] as const;

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function ActionBadge({ action }: { action: string }) {
  const tone = action.endsWith(".deleted")
    ? "border-destructive/40 bg-destructive/5 text-destructive"
    : action.endsWith(".created") || action.endsWith(".completed")
      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700"
      : action.endsWith(".converted") || action.includes("payment")
        ? "border-violet-500/40 bg-violet-500/5 text-violet-700"
        : "border-blue-500/40 bg-blue-500/5 text-blue-700";

  return (
    <span
      className={`inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {action.replaceAll(".", " ")}
    </span>
  );
}

function Metadata({ entry }: { entry: AuditLogRecord }) {
  if (!entry.metadata || Object.keys(entry.metadata).length === 0) return null;

  return (
    <details className="mt-3 border-t border-border pt-3">
      <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
        View metadata
      </summary>
      <pre className="mt-2 max-h-48 overflow-auto bg-slate-950 p-3 text-[11px] leading-5 text-slate-200">
        {JSON.stringify(entry.metadata, null, 2)}
      </pre>
    </details>
  );
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [entityType, setEntityType] = useState("all");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["audit-logs", search, action, entityType, page],
    queryFn: () =>
      listAuditLogs({
        search: search || undefined,
        action: action === "all" ? undefined : action,
        entityType: entityType === "all" ? undefined : entityType,
        page,
        pageSize: 50,
      }),
  });

  const entries = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">AUDIT LOG</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Read-only operational history for security, accountability and troubleshooting.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Recorded Events
            </p>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold">{meta?.total ?? 0}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Audit Mode
            </p>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-sm font-semibold text-emerald-600">
            Read-only history
          </p>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Current Coverage
            </p>
            <FileClock className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-sm font-semibold">
            Operational and financial mutations
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 border border-border bg-card p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search summary or actor email"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={action}
          onValueChange={(value) => {
            setAction(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTION_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={entityType}
          onValueChange={(value) => {
            setEntityType(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entity types</SelectItem>
            {ENTITY_TYPES.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {query.isError ? (
        <div className="border border-destructive/40 bg-card p-10 text-center">
          <p className="font-semibold">Audit events could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {query.error instanceof Error
              ? query.error.message
              : "Unknown API error."}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : query.isLoading ? (
        <div className="border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Loading audit history…
        </div>
      ) : entries.length === 0 ? (
        <div className="border border-dashed border-border bg-card p-12 text-center">
          <FileClock className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-3 font-semibold">No audit events found.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Events will appear after audited operations are executed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <article key={entry.id} className="border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <ActionBadge action={entry.action} />
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold">{entry.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5" />
                      {entry.actorEmail || "Local development user"}
                    </span>
                    <span>
                      {entry.entityType}
                      {entry.entityId ? ` · ${entry.entityId}` : ""}
                    </span>
                  </div>
                </div>
              </div>
              <Metadata entry={entry} />
            </article>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} events
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
