import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { crmContactsTable, db } from "@workspace/db";

const router: IRouter = Router();

const GENERIC_CONTACT_TYPES = [
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
] as const;

const listContactsSchema = z.object({
  search: z.string().trim().optional(),
  contactType: z.string().trim().optional(),
  status: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

const optionalText = z.string().trim().max(5000).nullable().optional();

const contactInputSchema = z
  .object({
    companyName: z.string().trim().min(1).max(255),
    contactType: z.enum(GENERIC_CONTACT_TYPES),
    status: z.enum(["Active", "Inactive", "Blocked"]).default("Active"),
    priority: z.string().trim().max(100).nullable().optional(),
    rating: z.number().min(0).max(5).nullable().optional(),
    primaryContactName: optionalText,
    primaryPhoneNumber: optionalText,
    primaryPhoneNumber2: optionalText,
    email: z.string().trim().email().nullable().optional(),
    website: optionalText,
    emergencyContactName: optionalText,
    emergencyPhoneNumber: optionalText,
    emergencyPhoneNumber2: optionalText,
    streetAddress: optionalText,
    city: optionalText,
    state: z.string().trim().max(2).nullable().optional(),
    zipCode: optionalText,
    coverageArea: optionalText,
    businessHours: optionalText,
    emergencyService: z.boolean().default(false),
    services: optionalText,
    lastContact: z.string().trim().nullable().optional(),
    tags: z.array(z.string().trim().min(1)).default([]),
    notes: optionalText,
  })
  .strict();

const contactUpdateSchema = contactInputSchema.partial();

function serializeContact(contact: typeof crmContactsTable.$inferSelect) {
  return {
    ...contact,
    rating: contact.rating == null ? null : Number(contact.rating),
    quickPayFee:
      contact.quickPayFee == null ? null : Number(contact.quickPayFee),
    factoringFee:
      contact.factoringFee == null ? null : Number(contact.factoringFee),
    ratePerMile:
      contact.ratePerMile == null ? null : Number(contact.ratePerMile),
    weeklyMinimumAmount:
      contact.weeklyMinimumAmount == null
        ? null
        : Number(contact.weeklyMinimumAmount),
    freightTypes: contact.freightTypes ?? [],
    coverageStates: contact.coverageStates ?? [],
    operatingStates: contact.operatingStates ?? [],
    serviceTypes: contact.serviceTypes ?? [],
    fleetEquipment: contact.fleetEquipment ?? [],
    tags: contact.tags ?? [],
  };
}

function toInsertValues(data: z.infer<typeof contactInputSchema>) {
  return {
    ...data,
    state: data.state?.toUpperCase() ?? null,
    rating: data.rating == null ? null : String(data.rating),
  } satisfies typeof crmContactsTable.$inferInsert;
}

router.get("/crm/contacts", async (req, res): Promise<void> => {
  const parsed = listContactsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, contactType, status, page, pageSize } = parsed.data;
  const conditions = [];

  if (contactType) {
    conditions.push(eq(crmContactsTable.contactType, contactType));
  }
  if (status) {
    conditions.push(eq(crmContactsTable.status, status));
  }
  if (search) {
    conditions.push(
      or(
        ilike(crmContactsTable.companyName, `%${search}%`),
        ilike(crmContactsTable.primaryContactName, `%${search}%`),
        ilike(crmContactsTable.primaryPhoneNumber, `%${search}%`),
        ilike(crmContactsTable.email, `%${search}%`),
      ),
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [contacts, countResult] = await Promise.all([
    db
      .select()
      .from(crmContactsTable)
      .where(where)
      .orderBy(desc(crmContactsTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(crmContactsTable)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  res.json({
    data: contacts.map(serializeContact),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

router.post("/crm/contacts", async (req, res): Promise<void> => {
  const parsed = contactInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error:
        parsed.error.message +
        " Carrier, Broker and Driver must be created in their dedicated modules.",
    });
    return;
  }

  const [contact] = await db
    .insert(crmContactsTable)
    .values(toInsertValues(parsed.data))
    .returning();

  res.status(201).json(serializeContact(contact));
});

router.get("/crm/contacts/:contactId", async (req, res): Promise<void> => {
  const { contactId } = req.params as { contactId: string };
  const [contact] = await db
    .select()
    .from(crmContactsTable)
    .where(eq(crmContactsTable.id, contactId));

  if (!contact) {
    res.status(404).json({ error: "Contact not found." });
    return;
  }

  res.json(serializeContact(contact));
});

router.patch("/crm/contacts/:contactId", async (req, res): Promise<void> => {
  const { contactId } = req.params as { contactId: string };
  const [existing] = await db
    .select()
    .from(crmContactsTable)
    .where(eq(crmContactsTable.id, contactId));

  if (!existing) {
    res.status(404).json({ error: "Contact not found." });
    return;
  }

  if (
    existing.contactType === "Carrier" ||
    existing.contactType === "Broker" ||
    existing.contactType === "Driver"
  ) {
    res.status(409).json({
      error:
        "Legacy Carrier, Broker or Driver CRM records cannot be edited here. Use the dedicated module.",
    });
    return;
  }

  const parsed = contactUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updateData: Partial<typeof crmContactsTable.$inferInsert> = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.state !== undefined) {
    updateData.state = data.state?.toUpperCase() ?? null;
  }
  if (data.rating !== undefined) {
    updateData.rating = data.rating == null ? null : String(data.rating);
  }

  const [contact] = await db
    .update(crmContactsTable)
    .set(updateData)
    .where(eq(crmContactsTable.id, contactId))
    .returning();

  res.json(serializeContact(contact));
});

router.delete("/crm/contacts/:contactId", async (req, res): Promise<void> => {
  const { contactId } = req.params as { contactId: string };
  const [contact] = await db
    .select({ id: crmContactsTable.id, contactType: crmContactsTable.contactType })
    .from(crmContactsTable)
    .where(eq(crmContactsTable.id, contactId));

  if (!contact) {
    res.status(404).json({ error: "Contact not found." });
    return;
  }

  if (
    contact.contactType === "Carrier" ||
    contact.contactType === "Broker" ||
    contact.contactType === "Driver"
  ) {
    res.status(409).json({
      error:
        "Legacy Carrier, Broker or Driver CRM records cannot be deleted here. Use the dedicated module.",
    });
    return;
  }

  await db.delete(crmContactsTable).where(eq(crmContactsTable.id, contactId));
  res.status(204).send();
});

export default router;
