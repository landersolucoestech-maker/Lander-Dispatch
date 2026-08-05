import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { db, documentsTable } from "@workspace/db";
import { recordAudit } from "../lib/audit";
import {
  ObjectNotFoundError,
  ObjectStorageService,
} from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();

const listDocumentsSchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  entityId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

const documentBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  category: z.string().trim().min(1).max(100).default("Other"),
  entityType: z.string().trim().max(100).optional(),
  entityId: z.string().trim().max(255).optional(),
  objectPath: z.string().trim().startsWith("/objects/"),
  contentType: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(100 * 1024 * 1024),
  notes: z.string().trim().max(5000).optional(),
});

const documentUpdateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  entityType: z.string().trim().max(100).nullable().optional(),
  entityId: z.string().trim().max(255).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

function serializeDocument(document: typeof documentsTable.$inferSelect) {
  return {
    ...document,
    downloadUrl: `/api/storage${document.objectPath}`,
  };
}

router.get("/documents", async (req, res): Promise<void> => {
  const parsed = listDocumentsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, category, entityType, entityId, page, pageSize } = parsed.data;
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(documentsTable.name, `%${search}%`),
        ilike(documentsTable.notes, `%${search}%`),
      ),
    );
  }
  if (category) conditions.push(eq(documentsTable.category, category));
  if (entityType) conditions.push(eq(documentsTable.entityType, entityType));
  if (entityId) conditions.push(eq(documentsTable.entityId, entityId));

  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [documents, countResult] = await Promise.all([
    db
      .select()
      .from(documentsTable)
      .where(where)
      .orderBy(desc(documentsTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(documentsTable)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  res.json({
    data: documents.map(serializeDocument),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = documentBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    await objectStorage.getObjectEntityFile(parsed.data.objectPath);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(400).json({ error: "Uploaded object was not found in private storage." });
      return;
    }
    throw error;
  }

  const [document] = await db
    .insert(documentsTable)
    .values({
      ...parsed.data,
      entityType: parsed.data.entityType || null,
      entityId: parsed.data.entityId || null,
      notes: parsed.data.notes || null,
      uploadedById: req.user?.id ?? null,
      uploadedByEmail: req.user?.email ?? null,
    })
    .returning();

  await recordAudit(req, {
    action: "document.created",
    entityType: "document",
    entityId: document.id,
    summary: `Uploaded document ${document.name}`,
    metadata: {
      category: document.category,
      contentType: document.contentType,
      size: document.size,
      relatedEntityType: document.entityType,
      relatedEntityId: document.entityId,
    },
  });

  res.status(201).json(serializeDocument(document));
});

router.patch("/documents/:documentId", async (req, res): Promise<void> => {
  const parsed = documentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { documentId } = req.params as { documentId: string };
  const [document] = await db
    .update(documentsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(documentsTable.id, documentId))
    .returning();

  if (!document) {
    res.status(404).json({ error: "Document not found." });
    return;
  }

  await recordAudit(req, {
    action: "document.updated",
    entityType: "document",
    entityId: document.id,
    summary: `Updated document ${document.name}`,
    metadata: { changedFields: Object.keys(parsed.data) },
  });

  res.json(serializeDocument(document));
});

router.delete("/documents/:documentId", async (req, res): Promise<void> => {
  const { documentId } = req.params as { documentId: string };
  const [document] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, documentId));

  if (!document) {
    res.status(404).json({ error: "Document not found." });
    return;
  }

  try {
    await objectStorage.deleteObjectEntity(document.objectPath);
  } catch (error) {
    if (!(error instanceof ObjectNotFoundError)) throw error;
  }

  await db.delete(documentsTable).where(eq(documentsTable.id, documentId));
  await recordAudit(req, {
    action: "document.deleted",
    entityType: "document",
    entityId: document.id,
    summary: `Deleted document ${document.name}`,
    metadata: {
      category: document.category,
      contentType: document.contentType,
      size: document.size,
    },
  });

  res.status(204).send();
});

export default router;
