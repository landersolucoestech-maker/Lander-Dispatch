import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Database, Download, FileSpreadsheet, Upload } from "lucide-react";
import {
  useListBrokers,
  useListCarriers,
  useListCrmContacts,
  useListCrmLeads,
  useListInvoices,
  useListLoads,
  useListTransactions,
} from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { listAuditLogs, listDocuments } from "@/modules/documents/api";
import { ImportDialog, type ReportEntityDefinition } from "../components/ImportDialog";

const ENTITIES: ReportEntityDefinition[] = [
  { key: "loads", label: "Loads", description: "Freight operations, routes, rates, status and dispatch dates.", fields: ["loadId","status","carrierName","brokerName","pickupCity","deliveryCity","rate"] },
  { key: "carriers", label: "Carriers", description: "Carrier network and operational status.", fields: ["companyName","usdotNumber","mcNumber","status","phone","email"] },
  { key: "brokers", label: "Brokers", description: "Broker partners, contact, payment and status data.", fields: ["companyName","mcNumber","usdotNumber","status","phone","email"] },
  { key: "contacts", label: "CRM Contacts", description: "CRM contacts and related operational relationships.", fields: ["companyName","contactType","status","phone","email","city","state"] },
  { key: "leads", label: "CRM Leads", description: "Prospects, stages, source and follow-up information.", fields: ["companyName","pipelineStage","status","phone","email","leadSource"] },
  { key: "invoices", label: "Invoices", description: "Commission receivables, balances and payment status.", fields: ["invoiceNumber","carrierName","issueDate","dueDate","total","balance","status"] },
  { key: "transactions", label: "Transactions", description: "Income, expenses and general-ledger activity.", fields: ["transactionId","date","type","category","description","amount","status"] },
  { key: "documents", label: "Documents", description: "Operational document metadata stored by the platform.", fields: ["name","category","entityType","entityId","contentType","size"] },
  { key: "audit", label: "Audit Log", description: "Read-only operational history and mutation events.", fields: ["createdAt","actorEmail","action","entityType","entityId","summary"] },
];

function csvValue(value: unknown) { const text = value == null ? "" : String(value); return `"${text.replaceAll('"','""')}"`; }
function downloadCsv(name: string, rows: Array<Record<string, unknown>>) { const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))); const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => csvValue(row[key])).join(","))].join("\n"); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${name}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

export default function ReportsPage() {
  const [importEntity, setImportEntity] = useState<ReportEntityDefinition | null>(null);
  const loads = useListLoads({ page: 1, pageSize: 500 });
  const carriers = useListCarriers({ page: 1, pageSize: 500 });
  const brokers = useListBrokers({ page: 1, pageSize: 500 });
  const contacts = useListCrmContacts({ page: 1, pageSize: 500 });
  const leads = useListCrmLeads({ page: 1, pageSize: 500 });
  const invoices = useListInvoices({ page: 1, pageSize: 500 });
  const transactions = useListTransactions({ page: 1, pageSize: 500 });
  const documents = useQuery({queryKey:["reports","documents"],queryFn:()=>listDocuments({page:1,pageSize:500})});
  const audit = useQuery({queryKey:["reports","audit"],queryFn:()=>listAuditLogs({page:1,pageSize:500})});

  const data = useMemo<Record<string, Array<Record<string, unknown>>>>(() => ({
    loads:(loads.data?.data??[]) as unknown as Array<Record<string,unknown>>,
    carriers:(carriers.data?.data??[]) as unknown as Array<Record<string,unknown>>,
    brokers:(brokers.data?.data??[]) as unknown as Array<Record<string,unknown>>,
    contacts:(contacts.data?.data??[]) as unknown as Array<Record<string,unknown>>,
    leads:(leads.data?.data??[]) as unknown as Array<Record<string,unknown>>,
    invoices:(invoices.data?.data??[]) as unknown as Array<Record<string,unknown>>,
    transactions:(transactions.data?.data??[]) as unknown as Array<Record<string,unknown>>,
    documents:(documents.data?.data??[]) as unknown as Array<Record<string,unknown>>,
    audit:(audit.data?.data??[]) as unknown as Array<Record<string,unknown>>,
  }), [loads.data,carriers.data,brokers.data,contacts.data,leads.data,invoices.data,transactions.data,documents.data,audit.data]);

  const exportEntity = (entity: ReportEntityDefinition) => downloadCsv(`lander-dispatch-${entity.key}`, data[entity.key] ?? []);

  return <div className="space-y-6 p-4 sm:p-6 lg:p-8">
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-[#0B1E36]">Reportable Entities</h2><p className="mt-1 text-xs text-slate-500">Import or export operational entities using their defined report schema.</p></div>
      <div className="divide-y divide-slate-200">{ENTITIES.map(entity=>{const rows=data[entity.key]??[];return <div key={entity.key} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1E3D7A]"><Database className="h-4 w-4"/></span><div><div className="flex items-center gap-2"><p className="text-sm font-semibold text-[#0B1E36]">{entity.label}</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{rows.length} records</span></div><p className="mt-1 text-xs text-slate-500">{entity.description}</p></div></div><div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" className="gap-2" onClick={()=>setImportEntity(entity)}><Upload className="h-3.5 w-3.5"/>Import</Button><Button variant="outline" size="sm" className="gap-2" disabled={!rows.length} onClick={()=>exportEntity(entity)}><Download className="h-3.5 w-3.5"/>Export</Button></div></div>})}</div>
    </section>
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500"><FileSpreadsheet className="mr-2 inline h-4 w-4 text-[#1E3D7A]"/>All report sources now use their real frontend API paths; mockup mode supplies the same response contracts for preview.</div>
    <ImportDialog entity={importEntity} open={Boolean(importEntity)} onOpenChange={open=>!open&&setImportEntity(null)}/>
  </div>;
}
