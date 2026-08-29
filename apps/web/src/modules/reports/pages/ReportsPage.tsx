import { useMemo, useState } from "react";
import { Database, Download, FileSpreadsheet, Upload } from "lucide-react";
import { useListCarriers, useListInvoices, useListLoads, useListTransactions } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { ImportDialog, type ReportEntityDefinition } from "../components/ImportDialog";

const ENTITIES: ReportEntityDefinition[] = [
  { key: "loads", label: "Loads", description: "Freight operations, routes, rates, status and dispatch dates.", fields: ["loadNumber","status","carrier","broker","pickup","delivery","rate"] },
  { key: "carriers", label: "Carriers", description: "Carrier network and operational status.", fields: ["companyName","usdotNumber","mcNumber","status","phone","email"] },
  { key: "brokers", label: "Brokers", description: "Broker partners, contact, payment and status data.", fields: ["companyName","mcNumber","usdotNumber","status","phone","email"] },
  { key: "contacts", label: "CRM Contacts", description: "CRM contacts and related operational relationships.", fields: ["name","type","status","phone","email","city","state"] },
  { key: "leads", label: "CRM Leads", description: "Prospects, stages, source and follow-up information.", fields: ["name","company","status","phone","email","source"] },
  { key: "invoices", label: "Invoices", description: "Commission receivables, balances and payment status.", fields: ["invoiceNumber","carrier","issueDate","dueDate","total","balance","status"] },
  { key: "transactions", label: "Transactions", description: "Income, expenses and general-ledger activity.", fields: ["transactionId","date","type","category","description","amount","status"] },
  { key: "documents", label: "Documents", description: "Operational document metadata stored by the platform.", fields: ["name","category","entityType","entityId","contentType","size"] },
  { key: "audit", label: "Audit Log", description: "Read-only operational history and mutation events.", fields: ["createdAt","actor","action","entityType","entityId","summary"] },
];

function csvValue(value: unknown) { const text = value == null ? "" : String(value); return `"${text.replaceAll('"','""')}"`; }
function downloadCsv(name: string, rows: Array<Record<string, unknown>>) { const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))); const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => csvValue(row[key])).join(","))].join("\n"); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${name}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

export default function ReportsPage() {
  const [importEntity, setImportEntity] = useState<ReportEntityDefinition | null>(null);
  const loads = useListLoads({ page: 1, pageSize: 500 });
  const carriers = useListCarriers({ page: 1, pageSize: 500 });
  const invoices = useListInvoices({ page: 1, pageSize: 500 });
  const transactions = useListTransactions({ page: 1, pageSize: 500 });
  const data = useMemo<Record<string, Array<Record<string, unknown>>>>(() => ({ loads: (loads.data?.data ?? []) as unknown as Array<Record<string, unknown>>, carriers: (carriers.data?.data ?? []) as unknown as Array<Record<string, unknown>>, invoices: (invoices.data?.data ?? []) as unknown as Array<Record<string, unknown>>, transactions: (transactions.data?.data ?? []) as unknown as Array<Record<string, unknown>> }), [loads.data, carriers.data, invoices.data, transactions.data]);
  const exportEntity = (entity: ReportEntityDefinition) => downloadCsv(`lander-dispatch-${entity.key}`, data[entity.key] ?? []);
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-[#0B1E36]">Reportable Entities</h2><p className="mt-1 text-xs text-slate-500">Import or export operational entities using their defined report schema.</p></div><div className="divide-y divide-slate-200">{ENTITIES.map((entity) => { const available = ["loads","carriers","invoices","transactions"].includes(entity.key); return <div key={entity.key} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1E3D7A]"><Database className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-[#0B1E36]">{entity.label}</p><p className="mt-1 text-xs text-slate-500">{entity.description}</p>{!available ? <p className="mt-1 text-[11px] text-amber-600">Export source is not exposed by the current frontend API client.</p> : null}</div></div><div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" className="gap-2" onClick={() => setImportEntity(entity)}><Upload className="h-3.5 w-3.5" />Import</Button><Button variant="outline" size="sm" className="gap-2" disabled={!available} onClick={() => exportEntity(entity)}><Download className="h-3.5 w-3.5" />Export</Button></div></div>; })}</div></section><div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500"><FileSpreadsheet className="mr-2 inline h-4 w-4 text-[#1E3D7A]" />Imports are validated before commit. This frontend does not fabricate a generic import backend where the project has no corresponding endpoint.</div><ImportDialog entity={importEntity} open={Boolean(importEntity)} onOpenChange={(open) => !open && setImportEntity(null)} /></div>;
}
