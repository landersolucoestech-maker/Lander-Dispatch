import type { CrmContact } from "@workspace/api-client-react";
import type { ContactType } from "../config/contactTypes";

export const GENERIC_CONTACT_TYPES = [
  "Dealer",
  "Direct Customer",
  "Shipper",
  "Auction",
  "Manufacturer",
  "Fleet / Rental Company",
  "Roadside Assistance",
  "Truck Repair",
  "Tire Repair",
  "Towing",
  "FMCSA",
  "Insurance",
  "Factoring",
  "Banking",
  "Accounting",
  "Legal",
  "Software",
  "Internet",
  "Office Supplier",
  "Other",
] as const satisfies readonly ContactType[];

export type GenericContactType = (typeof GENERIC_CONTACT_TYPES)[number];

export type GenericContactRecord = CrmContact & {
  website?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  coverageArea?: string | null;
  businessHours?: string | null;
  emergencyService?: boolean | null;
  services?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  lastContact?: string | null;
};

export interface GenericContactInput {
  companyName: string;
  contactType: GenericContactType;
  status: "Active" | "Inactive" | "Blocked";
  priority?: string | null;
  rating?: number | null;
  primaryContactName?: string | null;
  primaryPhoneNumber?: string | null;
  primaryPhoneNumber2?: string | null;
  email?: string | null;
  website?: string | null;
  emergencyContactName?: string | null;
  emergencyPhoneNumber?: string | null;
  emergencyPhoneNumber2?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  coverageArea?: string | null;
  businessHours?: string | null;
  emergencyService: boolean;
  services?: string | null;
  lastContact?: string | null;
  tags: string[];
  notes?: string | null;
}

function isGenericContactType(value: string): value is GenericContactType {
  return (GENERIC_CONTACT_TYPES as readonly string[]).includes(value);
}

export function assertGenericContactType(value: string): GenericContactType {
  if (!isGenericContactType(value)) {
    throw new Error(
      "Carrier, Broker and Driver must be created in their dedicated modules.",
    );
  }
  return value;
}

async function readError(response: Response): Promise<Error> {
  const body = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  return new Error(
    body?.error || `Contact request failed with status ${response.status}.`,
  );
}

async function requestContact(
  path: string,
  method: "POST" | "PATCH",
  data: GenericContactInput,
): Promise<GenericContactRecord> {
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
  return response.json() as Promise<GenericContactRecord>;
}

export async function getGenericContact(
  contactId: string,
): Promise<GenericContactRecord> {
  const response = await fetch(`/api/crm/contacts/${contactId}`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw await readError(response);
  return response.json() as Promise<GenericContactRecord>;
}

export function createGenericContact(
  data: GenericContactInput,
): Promise<GenericContactRecord> {
  return requestContact("/api/crm/contacts", "POST", data);
}

export function updateGenericContact(
  contactId: string,
  data: GenericContactInput,
): Promise<GenericContactRecord> {
  return requestContact(`/api/crm/contacts/${contactId}`, "PATCH", data);
}
