export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DocumentRecord {
  id: string;
  name: string;
  category: string;
  entityType: string | null;
  entityId: string | null;
  objectPath: string;
  contentType: string;
  size: number;
  notes: string | null;
  uploadedById: string | null;
  uploadedByEmail: string | null;
  createdAt: string;
  updatedAt: string | null;
  downloadUrl: string;
}

export interface AuditLogRecord {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface DocumentCreateInput {
  name: string;
  category: string;
  entityType?: string;
  entityId?: string;
  objectPath: string;
  contentType: string;
  size: number;
  notes?: string;
}

interface UploadTarget {
  uploadURL: string;
  objectPath: string;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || `Request failed with status ${response.status}.`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function listDocuments(params: {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  return apiRequest<PaginatedResponse<DocumentRecord>>(
    `/api/documents${buildQuery(params)}`,
  );
}

export async function uploadDocument(
  file: File,
  input: Omit<DocumentCreateInput, "objectPath" | "contentType" | "size">,
) {
  const contentType = file.type || "application/octet-stream";
  const target = await apiRequest<UploadTarget>("/api/storage/uploads/request-url", {
    method: "POST",
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType,
    }),
  });

  const uploadResponse = await fetch(target.uploadURL, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error(`Storage upload failed with status ${uploadResponse.status}.`);
  }

  return apiRequest<DocumentRecord>("/api/documents", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      objectPath: target.objectPath,
      contentType,
      size: file.size,
    }),
  });
}

export function deleteDocument(documentId: string) {
  return apiRequest<void>(`/api/documents/${documentId}`, { method: "DELETE" });
}

export function listAuditLogs(params: {
  search?: string;
  action?: string;
  entityType?: string;
  page?: number;
  pageSize?: number;
}) {
  return apiRequest<PaginatedResponse<AuditLogRecord>>(
    `/api/audit-logs${buildQuery(params)}`,
  );
}
