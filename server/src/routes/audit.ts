import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { auditLogsTable, db } from "@workspace/db";

const router: IRouter = Router();

const listAuditSchema = z.object({
  search: z.string().trim().optional(),
  action: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  entityId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

router.get("/audit-logs", async (req, res): Promise<void> => {
  const parsed = listAuditSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, action, entityType, entityId, page, pageSize } = parsed.data;
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(auditLogsTable.summary, `%${search}%`),
        ilike(auditLogsTable.actorEmail, `%${search}%`),
      ),
    );
  }
  if (action) conditions.push(eq(auditLogsTable.action, action));
  if (entityType) conditions.push(eq(auditLogsTable.entityType, entityType));
  if (entityId) conditions.push(eq(auditLogsTable.entityId, entityId));

  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [entries, countResult] = await Promise.all([
    db
      .select()
      .from(auditLogsTable)
      .where(where)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogsTable)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  res.json({
    data: entries,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

export default router;
