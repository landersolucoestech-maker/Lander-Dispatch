import { createMockApiState, type MockApiState } from "./api-data";
import { mockDate, mockDateTime } from "./date";

const API_STORE_KEY = "lander:mock-api-state";
const nativeFetch = typeof window !== "undefined" ? window.fetch.bind(window) : fetch;

function parseStored(): MockApiState | null {
  const raw = window.localStorage.getItem(API_STORE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as MockApiState; } catch { return null; }
}

function mergeById<T extends { id: string }>(base: T[], current?: T[] | null) {
  const currentItems = Array.isArray(current) ? current : [];
  const currentIds = new Set(currentItems.map((item) => item.id));
  return [...currentItems, ...base.filter((item) => !currentIds.has(item.id))];
}

function ensureState() {
  const base = createMockApiState();
  const current = parseStored();
  const next: MockApiState = {
    ...base,
    ...(current ?? {}),
    carriers: mergeById(base.carriers, current?.carriers),
    brokers: mergeById(base.brokers, current?.brokers),
    loads: mergeById(base.loads, current?.loads),
    contacts: mergeById(base.contacts, current?.contacts),
    leads: mergeById(base.leads, current?.leads),
    drivers: mergeById(base.drivers, current?.drivers),
    invoices: mergeById(base.invoices, current?.invoices),
    transactions: mergeById(base.transactions, current?.transactions),
    documents: mergeById(base.documents, current?.documents),
    auditLogs: mergeById(base.auditLogs, current?.auditLogs),
    companyProfile: { ...base.companyProfile, ...(current?.companyProfile ?? {}) },
  };
  window.localStorage.setItem(API_STORE_KEY, JSON.stringify(next));
  return next;
}

function saveState(state: MockApiState) {
  window.localStorage.setItem(API_STORE_KEY, JSON.stringify(state));
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

function noContent() {
  return new Response(null, { status: 204 });
}

async function requestBody(input: RequestInfo | URL, init?: RequestInit) {
  const body = init?.body ?? (typeof Request !== "undefined" && input instanceof Request ? input.body : null);
  if (!body) return {} as Record<string, unknown>;
  if (typeof body === "string") {
    try { return JSON.parse(body) as Record<string, unknown>; } catch { return {}; }
  }
  return {} as Record<string, unknown>;
}

function paginate<T>(items: T[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") ?? 25) || 25);
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), meta: { page, pageSize, total: items.length, totalPages: Math.max(1, Math.ceil(items.length / pageSize)) } };
}

function filtered<T extends Record<string, unknown>>(items: T[], url: URL) {
  const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
  const status = (url.searchParams.get("status") ?? "").trim().toLowerCase();
  return items.filter((item) => {
    if (status && String(item.status ?? "").toLowerCase() !== status) return false;
    if (!search) return true;
    return Object.values(item).some((value) => typeof value === "string" && value.toLowerCase().includes(search));
  });
}

function idFor(prefix: string) {
  return `mock-${prefix}-${crypto.randomUUID()}`;
}

function recordAudit(state: MockApiState, action: string, entityType: string, entityId: string | null, summary: string) {
  state.auditLogs.unshift({
    id:idFor("audit"),actorId:"frontend-preview",actorEmail:"preview@landerdispatch.local",action,entityType,entityId,summary,metadata:null,createdAt:new Date().toISOString()
  });
}

function listResponse<T extends Record<string, unknown>>(items: T[], url: URL) {
  return paginate(filtered(items, url), url);
}

function dashboardKpis(state: MockApiState) {
  const activeCarriers = state.carriers.filter((item) => item.status === "Active").length;
  const inactiveCarriers = state.carriers.length - activeCarriers;
  const loadsBooked = state.loads.filter((item) => item.status !== "Canceled").length;
  const monthlyRevenue = state.transactions.filter((item) => item.type === "Income" && item.status === "Completed").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return { activeCarriers, inactiveCarriers, loadsBooked, monthlyRevenue };
}

function dashboardActivity(state: MockApiState) {
  return state.auditLogs.slice(0, 8).map((item) => ({
    id:item.id,description:item.summary,entityType:item.entityType,entityId:item.entityId ?? "",createdAt:item.createdAt
  }));
}

function transactionKpis(state: MockApiState) {
  const completed = state.transactions.filter((item) => item.status === "Completed");
  const totalIncome = completed.filter((item) => item.type === "Income").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpenses = completed.filter((item) => item.type === "Expense").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses, pendingCount: state.transactions.filter((item) => item.status === "Pending").length };
}

function profitLoss(state: MockApiState, url: URL) {
  const kpis = transactionKpis(state);
  const byCategory = (type: string) => {
    const map = new Map<string, number>();
    state.transactions.filter((item) => item.type === type && item.status === "Completed").forEach((item) => map.set(item.category, (map.get(item.category) ?? 0) + Number(item.amount || 0)));
    return [...map].map(([category, amount]) => ({ category, amount }));
  };
  const totalRevenue = kpis.totalIncome;
  const totalExpenses = kpis.totalExpenses;
  const netProfit = totalRevenue - totalExpenses;
  return {
    period:url.searchParams.get("period") ?? "Current",
    startDate:url.searchParams.get("startDate") ?? mockDate(-30),
    endDate:url.searchParams.get("endDate") ?? mockDate(0),
    totalRevenue,totalExpenses,netProfit,netProfitMargin:totalRevenue ? (netProfit / totalRevenue) * 100 : 0,
    revenueLines:byCategory("Income"),expenseLines:byCategory("Expense"),
    previousPeriodRevenue:2780,previousPeriodExpenses:1180,previousPeriodNetProfit:1600
  };
}

async function handleApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(raw, window.location.origin);
  const method = (init?.method ?? (typeof Request !== "undefined" && input instanceof Request ? input.method : "GET")).toUpperCase();

  if (url.pathname.startsWith("/__mock_upload__/") && method === "PUT") return noContent();
  if (!url.pathname.startsWith("/api/")) return null;

  const state = ensureState();
  const path = url.pathname;

  if (method === "GET" && path === "/api/dashboard/kpis") return json(dashboardKpis(state));
  if (method === "GET" && path === "/api/dashboard/activity") return json(dashboardActivity(state));

  if (path === "/api/loads" && method === "GET") return json(listResponse(state.loads, url));
  if (path === "/api/loads" && method === "POST") {
    const body=await requestBody(input,init); const record={...body,id:idFor("load"),loadId:String(body.loadId ?? `LD-${Date.now().toString().slice(-5)}`),createdAt:new Date().toISOString(),updatedAt:null};
    state.loads.unshift(record as any); recordAudit(state,"CREATE","load",record.id,`Load ${record.loadId} created.`); saveState(state); return json(record,201);
  }
  if (path === "/api/loads/bulk" && method === "POST") {
    const body=await requestBody(input,init); const source=Array.isArray((body as any).loads)?(body as any).loads:Array.isArray(body)?body:[]; const created=source.map((item:any,index:number)=>({...item,id:idFor("load"),loadId:item.loadId ?? `LD-${Date.now().toString().slice(-5)}-${index+1}`,createdAt:new Date().toISOString(),updatedAt:null}));
    state.loads.unshift(...created); saveState(state); return json({data:created,count:created.length},201);
  }
  if (path === "/api/loads/parse-pdf" && method === "POST") return json({loads:[{loadId:"LD-PDF-001",status:"New",pickupCity:"Charlotte",pickupState:"NC",deliveryCity:"Raleigh",deliveryState:"NC",rate:950,vehicles:[{vehicleNumber:1,year:"2023",make:"BMW",model:"X5",vin:"5UXMOCKPDF001"}]}]});
  const loadMatch=path.match(/^\/api\/loads\/([^/]+)$/);
  if (loadMatch) {
    const id=decodeURIComponent(loadMatch[1]); const index=state.loads.findIndex((item)=>item.id===id);
    if(index<0)return json({error:"Load not found"},404);
    if(method==="GET")return json(state.loads[index]);
    if(method==="PATCH"){const body=await requestBody(input,init);state.loads[index]={...state.loads[index],...body,updatedAt:new Date().toISOString()} as any;recordAudit(state,"UPDATE","load",id,`Load ${state.loads[index].loadId} updated.`);saveState(state);return json(state.loads[index]);}
    if(method==="DELETE"){state.loads.splice(index,1);recordAudit(state,"DELETE","load",id,"Load deleted.");saveState(state);return noContent();}
  }

  if (path === "/api/carriers" && method === "GET") return json(listResponse(state.carriers, url));
  if (path === "/api/carriers" && method === "POST") {const body=await requestBody(input,init);const record={...body,id:idFor("carrier"),createdAt:new Date().toISOString(),updatedAt:null};state.carriers.unshift(record as any);recordAudit(state,"CREATE","carrier",record.id,`Carrier ${String((record as any).companyName ?? "")} created.`);saveState(state);return json(record,201);}
  const carrierMatch=path.match(/^\/api\/carriers\/([^/]+)$/);
  if(carrierMatch){const id=decodeURIComponent(carrierMatch[1]);const index=state.carriers.findIndex(item=>item.id===id);if(index<0)return json({error:"Carrier not found"},404);if(method==="GET")return json(state.carriers[index]);if(method==="PATCH"){const body=await requestBody(input,init);state.carriers[index]={...state.carriers[index],...body,updatedAt:new Date().toISOString()} as any;saveState(state);return json(state.carriers[index]);}if(method==="DELETE"){state.carriers.splice(index,1);saveState(state);return noContent();}}

  if (path === "/api/brokers" && method === "GET") return json(listResponse(state.brokers, url));
  if (path === "/api/brokers" && method === "POST") {const body=await requestBody(input,init);const record={...body,id:idFor("broker"),createdAt:new Date().toISOString(),updatedAt:null};state.brokers.unshift(record as any);saveState(state);return json(record,201);}
  const brokerMatch=path.match(/^\/api\/brokers\/([^/]+)$/);
  if(brokerMatch){const id=decodeURIComponent(brokerMatch[1]);const index=state.brokers.findIndex(item=>item.id===id);if(index<0)return json({error:"Broker not found"},404);if(method==="GET")return json(state.brokers[index]);if(method==="PATCH"){const body=await requestBody(input,init);state.brokers[index]={...state.brokers[index],...body,updatedAt:new Date().toISOString()} as any;saveState(state);return json(state.brokers[index]);}if(method==="DELETE"){state.brokers.splice(index,1);saveState(state);return noContent();}}

  if(path==="/api/crm/contacts"&&method==="GET")return json(listResponse(state.contacts,url));
  if(path==="/api/crm/contacts"&&method==="POST"){const body=await requestBody(input,init);const record={...body,id:idFor("contact"),createdAt:new Date().toISOString(),updatedAt:null};state.contacts.unshift(record as any);saveState(state);return json(record,201);}
  const contactMatch=path.match(/^\/api\/crm\/contacts\/([^/]+)$/);
  if(contactMatch){const id=decodeURIComponent(contactMatch[1]);const index=state.contacts.findIndex(item=>item.id===id);if(index<0)return json({error:"Contact not found"},404);if(method==="GET")return json(state.contacts[index]);if(method==="PATCH"){const body=await requestBody(input,init);state.contacts[index]={...state.contacts[index],...body,updatedAt:new Date().toISOString()} as any;saveState(state);return json(state.contacts[index]);}if(method==="DELETE"){state.contacts.splice(index,1);saveState(state);return noContent();}}

  if(path==="/api/crm/leads"&&method==="GET")return json(listResponse(state.leads,url));
  if(path==="/api/crm/leads"&&method==="POST"){const body=await requestBody(input,init);const record={...body,id:idFor("lead"),status:"Active",createdAt:new Date().toISOString(),updatedAt:null};state.leads.unshift(record as any);saveState(state);return json(record,201);}
  const leadConvert=path.match(/^\/api\/crm\/leads\/([^/]+)\/convert$/);
  if(leadConvert&&method==="POST"){const id=decodeURIComponent(leadConvert[1]);const index=state.leads.findIndex(item=>item.id===id);if(index<0)return json({error:"Lead not found"},404);const lead=state.leads[index] as any;const convertedEntityType=lead.leadType==="Broker"?"Broker":"Contact";const convertedEntityId=idFor(convertedEntityType.toLowerCase());lead.convertedEntityType=convertedEntityType;lead.convertedEntityId=convertedEntityId;lead.pipelineStage="Converted";saveState(state);return json({lead,convertedEntityType,convertedEntityId});}
  const leadMatch=path.match(/^\/api\/crm\/leads\/([^/]+)$/);
  if(leadMatch){const id=decodeURIComponent(leadMatch[1]);const index=state.leads.findIndex(item=>item.id===id);if(index<0)return json({error:"Lead not found"},404);if(method==="GET")return json(state.leads[index]);if(method==="PATCH"){const body=await requestBody(input,init);state.leads[index]={...state.leads[index],...body,updatedAt:new Date().toISOString()} as any;saveState(state);return json(state.leads[index]);}if(method==="DELETE"){state.leads.splice(index,1);saveState(state);return noContent();}}

  if(path==="/api/crm/drivers"&&method==="GET")return json(listResponse(state.drivers,url));
  if(path==="/api/crm/drivers"&&method==="POST"){const body=await requestBody(input,init);const record={...body,id:idFor("driver"),createdAt:new Date().toISOString(),updatedAt:null};state.drivers.unshift(record as any);saveState(state);return json(record,201);}
  const driverMatch=path.match(/^\/api\/crm\/drivers\/([^/]+)$/);
  if(driverMatch){const id=decodeURIComponent(driverMatch[1]);const index=state.drivers.findIndex(item=>item.id===id);if(index<0)return json({error:"Driver not found"},404);if(method==="GET")return json(state.drivers[index]);if(method==="PATCH"){const body=await requestBody(input,init);state.drivers[index]={...state.drivers[index],...body,updatedAt:new Date().toISOString()} as any;saveState(state);return json(state.drivers[index]);}if(method==="DELETE"){state.drivers.splice(index,1);saveState(state);return noContent();}}

  if(path==="/api/invoices"&&method==="GET")return json(listResponse(state.invoices,url));
  if(path==="/api/invoices"&&method==="POST"){const body=await requestBody(input,init);const total=Number((body as any).total ?? 0);const record={...body,id:idFor("invoice"),invoiceNumber:String((body as any).invoiceNumber ?? `INV-${Date.now().toString().slice(-4)}`),amountPaid:0,balance:total,status:(body as any).status ?? "Open",payments:[],createdAt:new Date().toISOString(),updatedAt:null};state.invoices.unshift(record as any);saveState(state);return json(record,201);}
  const invoiceMatch=path.match(/^\/api\/invoices\/([^/]+)$/);
  if(invoiceMatch){const id=decodeURIComponent(invoiceMatch[1]);const index=state.invoices.findIndex(item=>item.id===id);if(index<0)return json({error:"Invoice not found"},404);if(method==="GET")return json(state.invoices[index]);if(method==="PATCH"){const body=await requestBody(input,init);state.invoices[index]={...state.invoices[index],...body,updatedAt:new Date().toISOString()} as any;saveState(state);return json(state.invoices[index]);}if(method==="DELETE"){state.invoices.splice(index,1);saveState(state);return noContent();}}

  if(path==="/api/transactions/kpis"&&method==="GET")return json(transactionKpis(state));
  if(path==="/api/transactions"&&method==="GET")return json(listResponse(state.transactions,url));
  if(path==="/api/transactions"&&method==="POST"){const body=await requestBody(input,init);const record={...body,id:idFor("transaction"),transactionId:String((body as any).transactionId ?? `TXN-${Date.now().toString().slice(-6)}`),createdAt:new Date().toISOString()};state.transactions.unshift(record as any);saveState(state);return json(record,201);}
  const transactionMatch=path.match(/^\/api\/transactions\/([^/]+)$/);
  if(transactionMatch){const id=decodeURIComponent(transactionMatch[1]);const index=state.transactions.findIndex(item=>item.id===id);if(index<0)return json({error:"Transaction not found"},404);if(method==="GET")return json(state.transactions[index]);if(method==="PATCH"){const body=await requestBody(input,init);state.transactions[index]={...state.transactions[index],...body} as any;saveState(state);return json(state.transactions[index]);}if(method==="DELETE"){state.transactions.splice(index,1);saveState(state);return noContent();}}

  if(path==="/api/accounting/profit-loss"&&method==="GET")return json(profitLoss(state,url));

  if(path==="/api/settings/company"&&method==="GET")return json(state.companyProfile);
  if(path==="/api/settings/company"&&method==="PATCH"){const body=await requestBody(input,init);state.companyProfile={...state.companyProfile,...body} as any;saveState(state);return json(state.companyProfile);}

  if(path==="/api/documents"&&method==="GET")return json(listResponse(state.documents,url));
  if(path==="/api/documents"&&method==="POST"){const body=await requestBody(input,init);const record={...body,id:idFor("document"),uploadedById:"frontend-preview",uploadedByEmail:"preview@landerdispatch.local",createdAt:new Date().toISOString(),updatedAt:null,downloadUrl:"data:text/plain;charset=utf-8,Mock%20uploaded%20document"};state.documents.unshift(record as any);recordAudit(state,"CREATE","document",record.id,`Document ${String((record as any).name ?? "")} uploaded.`);saveState(state);return json(record,201);}
  const documentMatch=path.match(/^\/api\/documents\/([^/]+)$/);
  if(documentMatch&&method==="DELETE"){const id=decodeURIComponent(documentMatch[1]);state.documents=state.documents.filter(item=>item.id!==id) as any;recordAudit(state,"DELETE","document",id,"Document deleted.");saveState(state);return noContent();}

  if(path==="/api/audit-logs"&&method==="GET")return json(listResponse(state.auditLogs,url));
  if(path==="/api/storage/uploads/request-url"&&method==="POST"){const body=await requestBody(input,init);const token=crypto.randomUUID();return json({uploadURL:`${window.location.origin}/__mock_upload__/${token}`,objectPath:`mock/uploads/${token}-${String((body as any).name ?? "document")}`});}

  return null;
}

export function installMockApiFetch() {
  if (typeof window === "undefined" || import.meta.env.VITE_MOCKUP_DATA !== "true") return;
  ensureState();
  if ((window as any).__landerMockFetchInstalled) return;
  (window as any).__landerMockFetchInstalled = true;
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const mocked = await handleApi(input, init);
    return mocked ?? nativeFetch(input, init);
  }) as typeof window.fetch;
}
