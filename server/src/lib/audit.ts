import { auditLogsTable, db } from "@workspace/db";
import type { Request } from "express";

export interface AuditEntryInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}

export async function recordAudit(
  req: Request,
  entry: AuditEntryInput,
): Promise<void> {
  await db.insert(auditLogsTable).values({
    actorId: req.user?.id ?? null,
    actorEmail: req.user?.email ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    summary: entry.summary,
    metadata: entry.metadata ?? null,
  });
}
