/**
 * Local hooks for CRM Drivers CRUD (bypasses generated api-client-react)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = "/api/crm/drivers";

export interface Driver {
  id: string;
  fullName: string;
  status: string;
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  phoneNumber2?: string | null;
  email?: string | null;
  emergencyContactName?: string | null;
  emergencyPhoneNumber?: string | null;
  emergencyPhoneNumber2?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  hireDate?: string | null;
  driverType?: string | null;
  employmentType?: string | null;
  yearsOfExperience?: number | null;
  assignedEquipmentId?: string | null;
  driverLicenseNumber?: string | null;
  driverLicenseState?: string | null;
  driverLicenseClass?: string | null;
  driverLicenseExpiration?: string | null;
  cdlNumber?: string | null;
  cdlState?: string | null;
  cdlClass?: string | null;
  cdlExpiration?: string | null;
  cdlEndorsements?: string[];
  cdlRestrictions?: string | null;
  hazmatEndorsement?: boolean | null;
  hazmatEndorsementExpiration?: string | null;
  medicalExaminerCertificateNumber?: string | null;
  medicalCardIssueDate?: string | null;
  medicalCardExpiration?: string | null;
  medicalExaminerName?: string | null;
  nationalRegistryNumber?: string | null;
  twicCardNumber?: string | null;
  twicCardExpiration?: string | null;
  driverQualificationFileStatus?: string | null;
  mvrCheckDate?: string | null;
  mvrNextReviewDate?: string | null;
  mvrStatus?: string | null;
  backgroundCheckDate?: string | null;
  backgroundCheckStatus?: string | null;
  drugTestDate?: string | null;
  drugTestResult?: string | null;
  alcoholTestDate?: string | null;
  alcoholTestResult?: string | null;
  clearinghouseStatus?: string | null;
  clearinghouseLastQueryDate?: string | null;
  clearinghouseNextQueryDate?: string | null;
  complianceStatus?: string | null;
  accidentHistory?: string | null;
  violationHistory?: string | null;
  assignedCarrierId?: string | null;
  assignedTruckId?: string | null;
  assignedTrailerId?: string | null;
  lastLoad?: string | null;
  totalLoads?: number;
  lastAssignmentDate?: string | null;
  notes?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt?: string | null;
}

interface DriverList {
  data: Driver[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Query keys ─────────────────────────────────────────────────────────────────
export const driverKeys = {
  all: ["crm-drivers"] as const,
  list: (params?: object) => ["crm-drivers", "list", params] as const,
  detail: (id: string) => ["crm-drivers", "detail", id] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useListDrivers(params: { search?: string; status?: string; page?: number; pageSize?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  const url = `${BASE}?${qs.toString()}`;
  return useQuery<DriverList>({ queryKey: driverKeys.list(params), queryFn: () => apiFetch(url) });
}

export function useGetDriver(id: string | undefined) {
  return useQuery<Driver>({
    queryKey: driverKeys.detail(id!),
    queryFn: () => apiFetch(`${BASE}/${id}`),
    enabled: !!id,
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation<Driver, Error, Partial<Driver>>({
    mutationFn: (data) => apiFetch(BASE, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: driverKeys.all }),
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation<Driver, Error, { id: string; data: Partial<Driver> }>({
    mutationFn: ({ id, data }) => apiFetch(`${BASE}/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: driverKeys.all });
      qc.invalidateQueries({ queryKey: driverKeys.detail(id) });
    },
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation<null, Error, string>({
    mutationFn: (id) => apiFetch(`${BASE}/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: driverKeys.all }),
  });
}
