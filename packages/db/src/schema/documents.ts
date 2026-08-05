import {
  bigint,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const documentsTable = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull().default("Other"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    objectPath: text("object_path").notNull().unique(),
    contentType: text("content_type").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    notes: text("notes"),
    uploadedById: varchar("uploaded_by_id"),
    uploadedByEmail: varchar("uploaded_by_email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("documents_category_idx").on(table.category),
    index("documents_entity_idx").on(table.entityType, table.entityId),
    index("documents_created_at_idx").on(table.createdAt),
  ],
);

export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: varchar("actor_id"),
    actorEmail: varchar("actor_email"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export type DocumentRecord = typeof documentsTable.$inferSelect;
export type AuditLogRecord = typeof auditLogsTable.$inferSelect;
