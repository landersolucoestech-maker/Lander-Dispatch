import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import {
  brokersTable,
  crmContactsTable,
  crmLeadsTable,
  db,
} from "@workspace/db";

const router: IRouter = Router();

const LEAD_TYPES = [
  "Broker",
  "Direct Customer",
  "Dealer",
  "Shipper",
  "Auction",
  "Manufacturer",
  "Fleet / Rental Company",
  "Other",
] as const;

const EDITABLE_PIPELINE_STAGES = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Onboarding",
] as const;

const PRIORITIES = ["Low", "Normal", "High", "Critical"] as const;

const nullableText = z.string().trim().max(5000).nullable().optional();

const leadInputSchema = z
  .object({
    companyName: z.string().trim().min(1).max(255),
    leadType: z.enum(LEAD_TYPES),
    pipelineStage: z.enum(EDITABLE_PIPELINE_STAGES).default("New Lead"),
    leadSource: nullableText,
    priority: z.enum(PRIORITIES).nullable().optional(),
    rating: z.number().min(0).max(5).nullable().optional(),
    primaryContact: nullableText,
    phone: nullableText,
    email: z.string().trim().email().nullable().optional(),
    website: nullableText,
    streetAddress: nullableText,
    city: nullableText,
    state: z.string().trim().max(2).nullable().optional(),
    zipCode: nullableText,
    serviceTypes: z.array(z.string().trim().min(1)).default([]),
    operatingStates: z.array(z.string().trim().min(2).max(2)).default([]),
    estimatedWeeklyLoads: z.number().int().min(0).nullable().optional(),
    estimatedWeeklyRevenue: z.number().min(0).nullable().optional(),
    nextFollowUpDate: z.string().trim().nullable().optional(),
    nextFollowUpTime: z.string().trim().nullable().optional(),
    followUpNotes: nullableText,
    tags: z.array(z.string().trim().min(1)).default([]),
    notes: nullableText,
    brokerType: nullableText,
    mcNumber: nullableText,
    usdotNumber: nullableText,
    coverage: nullableText,
    freightTypes: nullableText,
    selectedStates: nullableText,
  })
  .strict();

const leadUpdateSchema = leadInputSchema.partial();

const listLeadSchema = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

function serializeLead(lead: typeof crmLeadsTable.$inferSelect) {
  return {
    ...lead,
    rating: lead.rating == null ? null : Number(lead.rating),
    estimatedWeeklyRevenue:
      lead.estimatedWeeklyRevenue == null
        ? null
        : Number(lead.estimatedWeeklyRevenue),
    serviceTypes: lead.serviceTypes ?? [],
    operatingStates: lead.operatingStates ?? [],
    tags: lead.tags ?? [],
  };
}

function splitTextList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toInsertValues(data: z.infer<typeof leadInputSchema>) {
  return {
    ...data,
    state: data.state?.toUpperCase() ?? null,
    operatingStates: data.operatingStates.map((state) => state.toUpperCase()),
    rating: data.rating == null ? null : String(data.rating),
    estimatedWeeklyRevenue:
      data.estimatedWeeklyRevenue == null
        ? null
        : String(data.estimatedWeeklyRevenue),
    status: "Active",
  } satisfies typeof crmLeadsTable.$inferInsert;
}

router.get("/crm/leads", async (req, res): Promise<void> => {
  const parsed = listLeadSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, status, page, pageSize } = parsed.data;
  const conditions = [];
  if (status) conditions.push(eq(crmLeadsTable.status, status));
  if (search) {
    conditions.push(
      or(
        ilike(crmLeadsTable.companyName, `%${search}%`),
        ilike(crmLeadsTable.primaryContact, `%${search}%`),
        ilike(crmLeadsTable.email, `%${search}%`),
      ),
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;
  const [leads, countResult] = await Promise.all([
    db
      .select()
      .from(crmLeadsTable)
      .where(where)
      .orderBy(desc(crmLeadsTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(crmLeadsTable)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  res.json({
    data: leads.map(serializeLead),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

router.post("/crm/leads", async (req, res): Promise<void> => {
  const parsed = leadInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lead] = await db
    .insert(crmLeadsTable)
    .values(toInsertValues(parsed.data))
    .returning();

  res.status(201).json(serializeLead(lead));
});

router.get("/crm/leads/:leadId", async (req, res): Promise<void> => {
  const { leadId } = req.params as { leadId: string };
  const [lead] = await db
    .select()
    .from(crmLeadsTable)
    .where(eq(crmLeadsTable.id, leadId));

  if (!lead) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }

  res.json(serializeLead(lead));
});

router.patch("/crm/leads/:leadId", async (req, res): Promise<void> => {
  const { leadId } = req.params as { leadId: string };
  const parsed = leadUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updateData: Partial<typeof crmLeadsTable.$inferInsert> = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.state !== undefined) {
    updateData.state = data.state?.toUpperCase() ?? null;
  }
  if (data.operatingStates !== undefined) {
    updateData.operatingStates = data.operatingStates.map((state) =>
      state.toUpperCase(),
    );
  }
  if (data.rating !== undefined) {
    updateData.rating = data.rating == null ? null : String(data.rating);
  }
  if (data.estimatedWeeklyRevenue !== undefined) {
    updateData.estimatedWeeklyRevenue =
      data.estimatedWeeklyRevenue == null
        ? null
        : String(data.estimatedWeeklyRevenue);
  }

  const [lead] = await db
    .update(crmLeadsTable)
    .set(updateData)
    .where(eq(crmLeadsTable.id, leadId))
    .returning();

  if (!lead) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }

  res.json(serializeLead(lead));
});

router.post("/crm/leads/:leadId/convert", async (req, res): Promise<void> => {
  const { leadId } = req.params as { leadId: string };

  try {
    const result = await db.transaction(async (tx) => {
      const [lead] = await tx
        .select()
        .from(crmLeadsTable)
        .where(eq(crmLeadsTable.id, leadId));

      if (!lead) {
        return { kind: "not-found" as const };
      }
      if (lead.status === "Converted" || lead.convertedEntityId) {
        return { kind: "already-converted" as const };
      }
      if (!lead.leadType || !LEAD_TYPES.includes(lead.leadType as (typeof LEAD_TYPES)[number])) {
        return { kind: "invalid-type" as const };
      }

      if (lead.leadType === "Broker") {
        const [broker] = await tx
          .insert(brokersTable)
          .values({
            companyName: lead.companyName,
            brokerType: lead.brokerType,
            website: lead.website,
            mcNumber: lead.mcNumber,
            usdotNumber: lead.usdotNumber,
            primaryContact: lead.primaryContact,
            phone: lead.phone,
            email: lead.email,
            lastContact: lead.lastContact,
            freightTypes: splitTextList(lead.freightTypes),
            coverage: lead.coverage,
            selectedStates: splitTextList(lead.selectedStates),
            onboardingStatus: "Not Started",
            rating: lead.rating,
            status: "Active",
            priority: lead.priority,
            tags: lead.tags ?? [],
            notes: lead.notes,
          })
          .returning();

        const [updatedLead] = await tx
          .update(crmLeadsTable)
          .set({
            pipelineStage: "Won",
            status: "Converted",
            convertedEntityType: "Broker",
            convertedEntityId: broker.id,
            updatedAt: new Date(),
          })
          .where(eq(crmLeadsTable.id, leadId))
          .returning();

        return {
          kind: "converted" as const,
          lead: updatedLead,
          convertedEntityType: "Broker" as const,
          convertedEntityId: broker.id,
        };
      }

      const [contact] = await tx
        .insert(crmContactsTable)
        .values({
          companyName: lead.companyName,
          contactType: lead.leadType,
          status: "Active",
          priority: lead.priority,
          rating: lead.rating,
          primaryContactName: lead.primaryContact,
          primaryPhoneNumber: lead.phone,
          email: lead.email,
          website: lead.website,
          streetAddress: lead.streetAddress,
          city: lead.city,
          state: lead.state,
          zipCode: lead.zipCode,
          coverageArea: (lead.operatingStates ?? []).join(", ") || null,
          services: (lead.serviceTypes ?? []).join(", ") || null,
          lastContact: lead.lastContact,
          tags: lead.tags ?? [],
          notes: lead.notes,
        })
        .returning();

      const [updatedLead] = await tx
        .update(crmLeadsTable)
        .set({
          pipelineStage: "Won",
          status: "Converted",
          convertedEntityType: "Contact",
          convertedEntityId: contact.id,
          updatedAt: new Date(),
        })
        .where(eq(crmLeadsTable.id, leadId))
        .returning();

      return {
        kind: "converted" as const,
        lead: updatedLead,
        convertedEntityType: "Contact" as const,
        convertedEntityId: contact.id,
      };
    });

    if (result.kind === "not-found") {
      res.status(404).json({ error: "Lead not found." });
      return;
    }
    if (result.kind === "already-converted") {
      res.status(409).json({ error: "Lead has already been converted." });
      return;
    }
    if (result.kind === "invalid-type") {
      res.status(400).json({
        error: "Lead type is invalid. Carrier is never a valid Lead type.",
      });
      return;
    }

    res.status(201).json({
      lead: serializeLead(result.lead),
      convertedEntityType: result.convertedEntityType,
      convertedEntityId: result.convertedEntityId,
    });
  } catch (error) {
    req.log.error({ err: error, leadId }, "Lead conversion failed");
    res.status(500).json({ error: "Lead conversion failed." });
  }
});

router.delete("/crm/leads/:leadId", async (req, res): Promise<void> => {
  const { leadId } = req.params as { leadId: string };
  const [deleted] = await db
    .delete(crmLeadsTable)
    .where(eq(crmLeadsTable.id, leadId))
    .returning({ id: crmLeadsTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }

  res.status(204).send();
});

export default router;
