import { Router, type IRouter } from "express";
import { db, crmContactsTable, crmLeadsTable } from "@workspace/db";
import { eq, ilike, or, desc, sql, and } from "drizzle-orm";
import {
  CreateCrmContactBody, UpdateCrmContactBody, ListCrmContactsQueryParams,
  CreateCrmLeadBody, UpdateCrmLeadBody, ListCrmLeadsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ── Allowed contact types (all 22) ────────────────────────────────────────────

const VALID_CONTACT_TYPES = new Set([
  "Carrier", "Broker", "Dealer", "Direct Customer", "Shipper", "Auction",
  "Manufacturer", "Fleet / Rental Company", "Roadside Assistance",
  "Truck Repair", "Tire Repair", "Towing", "FMCSA", "Insurance",
  "Factoring", "Banking", "Accounting", "Legal", "Software", "Internet",
  "Office Supplier", "Other",
]);

const VALID_LEAD_TYPES = new Set([
  "Broker", "Direct Customer", "Dealer", "Shipper", "Auction",
  "Manufacturer", "Fleet / Rental Company", "Other",
]);

const VALID_PIPELINE_STAGES = new Set([
  "New Lead", "Contacted", "Qualified", "Proposal Sent",
  "Negotiation", "Onboarding", "Won", "Lost",
]);

const VALID_STATUSES = new Set(["Active", "Inactive", "Blocked"]);
const VALID_LEAD_STATUSES = new Set(["Active", "Converted", "Lost", "Archived"]);
const VALID_PRIORITIES = new Set(["Low", "Normal", "High", "Critical"]);

// ── Contacts ───────────────────────────────────────────────────────────────────

router.get("/crm/contacts", async (req, res): Promise<void> => {
  const parsed = ListCrmContactsQueryParams.safeParse(req.query);
  const { search, page = 1, pageSize = 20 } = parsed.success ? parsed.data : { search: undefined, page: 1, pageSize: 20 };

  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(crmContactsTable.companyName, `%${search}%`),
      ilike(crmContactsTable.primaryContactName, `%${search}%`),
      ilike(crmContactsTable.email, `%${search}%`),
    ));
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(crmContactsTable).where(where).orderBy(desc(crmContactsTable.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(crmContactsTable).where(where),
  ]);
  const total = countResult[0]?.count ?? 0;
  res.json({ data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

router.post("/crm/contacts", async (req, res): Promise<void> => {
  const parsed = CreateCrmContactBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data = parsed.data;

  if (data.contactType && !VALID_CONTACT_TYPES.has(data.contactType)) {
    res.status(400).json({ error: `Invalid contactType: ${data.contactType}` }); return;
  }
  if (data.status && !VALID_STATUSES.has(data.status)) {
    res.status(400).json({ error: `Invalid status: ${data.status}` }); return;
  }
  if (data.priority && !VALID_PRIORITIES.has(data.priority)) {
    res.status(400).json({ error: `Invalid priority: ${data.priority}` }); return;
  }

  const insertData = {
    ...data,
    state: data.state ? data.state.toUpperCase() : undefined,
    companyState: (data as any).companyState ? (data as any).companyState.toUpperCase() : undefined,
    rating: data.rating != null ? String(data.rating) : undefined,
    quickPayFee: (data as any).quickPayFee != null ? String((data as any).quickPayFee) : undefined,
    factoringFee: (data as any).factoringFee != null ? String((data as any).factoringFee) : undefined,
    ratePerMile: (data as any).ratePerMile != null ? String((data as any).ratePerMile) : undefined,
  };

  const [contact] = await db.insert(crmContactsTable).values(insertData as any).returning();
  res.status(201).json(serializeContact(contact));
});

router.get("/crm/contacts/:contactId", async (req, res): Promise<void> => {
  const { contactId } = req.params as { contactId: string };
  const [contact] = await db.select().from(crmContactsTable).where(eq(crmContactsTable.id, contactId));
  if (!contact) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeContact(contact));
});

router.patch("/crm/contacts/:contactId", async (req, res): Promise<void> => {
  const { contactId } = req.params as { contactId: string };
  const parsed = UpdateCrmContactBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data = parsed.data;

  if (data.contactType !== undefined && data.contactType && !VALID_CONTACT_TYPES.has(data.contactType)) {
    res.status(400).json({ error: `Invalid contactType: ${data.contactType}` }); return;
  }
  if (data.status && !VALID_STATUSES.has(data.status)) {
    res.status(400).json({ error: `Invalid status: ${data.status}` }); return;
  }
  if (data.priority !== undefined && data.priority && !VALID_PRIORITIES.has(data.priority)) {
    res.status(400).json({ error: `Invalid priority: ${data.priority}` }); return;
  }

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
  };
  if (data.state !== undefined) updateData.state = data.state ? data.state.toUpperCase() : null;
  if ((data as any).companyState !== undefined) updateData.companyState = (data as any).companyState ? (data as any).companyState.toUpperCase() : null;
  if (data.rating !== undefined) updateData.rating = data.rating != null ? String(data.rating) : null;
  if ((data as any).quickPayFee !== undefined) updateData.quickPayFee = (data as any).quickPayFee != null ? String((data as any).quickPayFee) : null;
  if ((data as any).factoringFee !== undefined) updateData.factoringFee = (data as any).factoringFee != null ? String((data as any).factoringFee) : null;
  if ((data as any).ratePerMile !== undefined) updateData.ratePerMile = (data as any).ratePerMile != null ? String((data as any).ratePerMile) : null;

  const [contact] = await db.update(crmContactsTable)
    .set(updateData as Partial<typeof crmContactsTable.$inferInsert>)
    .where(eq(crmContactsTable.id, contactId))
    .returning();
  if (!contact) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeContact(contact));
});

router.delete("/crm/contacts/:contactId", async (req, res): Promise<void> => {
  const { contactId } = req.params as { contactId: string };
  await db.delete(crmContactsTable).where(eq(crmContactsTable.id, contactId));
  res.status(204).send();
});

function serializeContact(c: typeof crmContactsTable.$inferSelect) {
  return {
    ...c,
    rating: c.rating != null ? Number(c.rating) : null,
    quickPayFee: c.quickPayFee != null ? Number(c.quickPayFee) : null,
    factoringFee: c.factoringFee != null ? Number(c.factoringFee) : null,
    ratePerMile: c.ratePerMile != null ? Number(c.ratePerMile) : null,
    weeklyMinimumAmount: c.weeklyMinimumAmount != null ? Number(c.weeklyMinimumAmount) : null,
    totalTripsPerWeek: c.totalTripsPerWeek ?? null,
    freightTypes: Array.isArray(c.freightTypes) ? c.freightTypes : [],
    coverageStates: Array.isArray(c.coverageStates) ? c.coverageStates : [],
    operatingStates: Array.isArray(c.operatingStates) ? c.operatingStates : [],
    serviceTypes: Array.isArray(c.serviceTypes) ? c.serviceTypes : [],
    fleetEquipment: Array.isArray(c.fleetEquipment) ? c.fleetEquipment : [],
    tags: Array.isArray(c.tags) ? c.tags : [],
  };
}

// ── Leads ──────────────────────────────────────────────────────────────────────

router.get("/crm/leads", async (req, res): Promise<void> => {
  const parsed = ListCrmLeadsQueryParams.safeParse(req.query);
  const { search, status, page = 1, pageSize = 20 } = parsed.success ? parsed.data : { search: undefined, status: undefined, page: 1, pageSize: 20 };

  const conditions = [];
  if (status) conditions.push(eq(crmLeadsTable.status, status));
  if (search) {
    conditions.push(or(
      ilike(crmLeadsTable.companyName, `%${search}%`),
      ilike(crmLeadsTable.primaryContact, `%${search}%`),
      ilike(crmLeadsTable.email, `%${search}%`),
    ));
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(crmLeadsTable).where(where).orderBy(desc(crmLeadsTable.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(crmLeadsTable).where(where),
  ]);
  const total = countResult[0]?.count ?? 0;
  res.json({ data: data.map(serializeLead), meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

router.post("/crm/leads", async (req, res): Promise<void> => {
  const parsed = CreateCrmLeadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data = parsed.data as any;

  if (data.leadType && !VALID_LEAD_TYPES.has(data.leadType)) {
    res.status(400).json({ error: `Invalid leadType: ${data.leadType}. Carrier is not a valid Lead type.` }); return;
  }
  if (data.pipelineStage) {
    const editableStages = new Set(["New Lead", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Onboarding"]);
    if (!editableStages.has(data.pipelineStage)) {
      res.status(400).json({ error: `Pipeline stage '${data.pipelineStage}' cannot be set directly.` }); return;
    }
  }
  if (data.priority && !VALID_PRIORITIES.has(data.priority)) {
    res.status(400).json({ error: `Invalid priority: ${data.priority}` }); return;
  }

  const insertData = {
    ...data,
    state: data.state ? data.state.toUpperCase() : undefined,
    status: "Active",
    rating: data.rating != null ? String(data.rating) : undefined,
    estimatedWeeklyRevenue: data.estimatedWeeklyRevenue != null ? String(data.estimatedWeeklyRevenue) : undefined,
  };

  const [lead] = await db.insert(crmLeadsTable).values(insertData as any).returning();
  res.status(201).json(serializeLead(lead));
});

router.get("/crm/leads/:leadId", async (req, res): Promise<void> => {
  const { leadId } = req.params as { leadId: string };
  const [lead] = await db.select().from(crmLeadsTable).where(eq(crmLeadsTable.id, leadId));
  if (!lead) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeLead(lead));
});

router.patch("/crm/leads/:leadId", async (req, res): Promise<void> => {
  const { leadId } = req.params as { leadId: string };
  const parsed = UpdateCrmLeadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data = parsed.data as any;

  if (data.leadType && !VALID_LEAD_TYPES.has(data.leadType)) {
    res.status(400).json({ error: `Invalid leadType: ${data.leadType}. Carrier is not a valid Lead type.` }); return;
  }
  if (data.pipelineStage) {
    const editableStages = new Set(["New Lead", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Onboarding"]);
    if (!editableStages.has(data.pipelineStage)) {
      res.status(400).json({ error: `Pipeline stage '${data.pipelineStage}' cannot be set directly.` }); return;
    }
  }
  if (data.priority !== undefined && data.priority && !VALID_PRIORITIES.has(data.priority)) {
    res.status(400).json({ error: `Invalid priority: ${data.priority}` }); return;
  }

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
  };
  if (data.state !== undefined) updateData.state = data.state ? data.state.toUpperCase() : null;
  if (data.rating !== undefined) updateData.rating = data.rating != null ? String(data.rating) : null;
  if (data.estimatedWeeklyRevenue !== undefined) updateData.estimatedWeeklyRevenue = data.estimatedWeeklyRevenue != null ? String(data.estimatedWeeklyRevenue) : null;
  delete updateData.status;
  delete updateData.lastContact;

  const [lead] = await db.update(crmLeadsTable)
    .set(updateData as Partial<typeof crmLeadsTable.$inferInsert>)
    .where(eq(crmLeadsTable.id, leadId))
    .returning();
  if (!lead) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeLead(lead));
});

router.delete("/crm/leads/:leadId", async (req, res): Promise<void> => {
  const { leadId } = req.params as { leadId: string };
  await db.delete(crmLeadsTable).where(eq(crmLeadsTable.id, leadId));
  res.status(204).send();
});

function serializeLead(l: typeof crmLeadsTable.$inferSelect) {
  return {
    ...l,
    rating: l.rating != null ? Number(l.rating) : null,
    estimatedWeeklyRevenue: l.estimatedWeeklyRevenue != null ? Number(l.estimatedWeeklyRevenue) : null,
  };
}

export default router;
