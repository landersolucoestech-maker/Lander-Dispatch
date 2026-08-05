import type { CrmLead } from "@workspace/api-client-react";
import type {
  EditablePipelineStage,
  LeadSource,
  LeadType,
  Priority,
} from "../config/leadTypes";

export type LeadRecord = Omit<CrmLead, "freightTypes"> & {
  leadType?: LeadType | null;
  streetAddress?: string | null;
  zipCode?: string | null;
  brokerType?: string | null;
  coverage?: string | null;
  freightTypes?: string | null;
  selectedStates?: string | null;
  nextFollowUpDate?: string | null;
  nextFollowUpTime?: string | null;
  followUpNotes?: string | null;
  convertedEntityType?: "Broker" | "Contact" | null;
  convertedEntityId?: string | null;
  updatedAt?: string | null;
};

export interface LeadMutationInput {
  companyName: string;
  leadType: LeadType;
  pipelineStage: EditablePipelineStage;
  leadSource?: LeadSource | null;
  priority?: Priority | null;
  rating?: number | null;
  primaryContact?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  serviceTypes?: string[];
  operatingStates?: string[];
  estimatedWeeklyLoads?: number | null;
  estimatedWeeklyRevenue?: number | null;
  nextFollowUpDate?: string | null;
  nextFollowUpTime?: string | null;
  followUpNotes?: string | null;
  tags?: string[];
  notes?: string | null;
  brokerType?: string | null;
  mcNumber?: string | null;
  usdotNumber?: string | null;
  coverage?: string | null;
  freightTypes?: string | null;
  selectedStates?: string | null;
}

export interface LeadConversionResult {
  lead: LeadRecord;
  convertedEntityType: "Broker" | "Contact";
  convertedEntityId: string;
}

function isLeadType(value: string | null | undefined): value is LeadType {
  return [
    "Broker",
    "Direct Customer",
    "Dealer",
    "Shipper",
    "Auction",
    "Manufacturer",
    "Fleet / Rental Company",
    "Other",
  ].includes(value ?? "");
}

export function normalizeLeadRecord(
  lead: CrmLead | LeadRecord,
): LeadRecord {
  const rawFreightTypes = lead.freightTypes;
  const freightTypes = Array.isArray(rawFreightTypes)
    ? rawFreightTypes.join(", ")
    : rawFreightTypes ?? null;
  const extended = lead as LeadRecord;

  return {
    ...lead,
    leadType: isLeadType(extended.leadType) ? extended.leadType : null,
    streetAddress: extended.streetAddress ?? null,
    zipCode: extended.zipCode ?? null,
    brokerType: extended.brokerType ?? null,
    coverage: extended.coverage ?? null,
    freightTypes,
    selectedStates: extended.selectedStates ?? null,
    nextFollowUpDate:
      extended.nextFollowUpDate ?? lead.nextFollowUp?.slice(0, 10) ?? null,
    nextFollowUpTime: extended.nextFollowUpTime ?? null,
    followUpNotes: extended.followUpNotes ?? null,
    convertedEntityType: extended.convertedEntityType ?? null,
    convertedEntityId:
      extended.convertedEntityId ?? lead.convertedCarrierId ?? null,
    updatedAt: extended.updatedAt ?? null,
  };
}

async function readError(response: Response): Promise<Error> {
  const errorBody = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  return new Error(
    errorBody?.error || `Lead request failed with status ${response.status}.`,
  );
}

async function requestLead(
  path: string,
  method: "POST" | "PATCH",
  data: LeadMutationInput,
): Promise<LeadRecord> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw await readError(response);
  const lead = (await response.json()) as LeadRecord;
  return normalizeLeadRecord(lead);
}

export async function getLead(leadId: string): Promise<LeadRecord> {
  const response = await fetch(`/api/crm/leads/${leadId}`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw await readError(response);
  const lead = (await response.json()) as LeadRecord;
  return normalizeLeadRecord(lead);
}

export function createLead(data: LeadMutationInput): Promise<LeadRecord> {
  return requestLead("/api/crm/leads", "POST", data);
}

export function updateLead(
  leadId: string,
  data: LeadMutationInput,
): Promise<LeadRecord> {
  return requestLead(`/api/crm/leads/${leadId}`, "PATCH", data);
}

export async function convertLead(
  leadId: string,
): Promise<LeadConversionResult> {
  const response = await fetch(`/api/crm/leads/${leadId}/convert`, {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw await readError(response);
  const result = (await response.json()) as LeadConversionResult;
  return {
    ...result,
    lead: normalizeLeadRecord(result.lead),
  };
}
