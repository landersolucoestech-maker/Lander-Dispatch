import { Router, type IRouter } from "express";
import {
  carrierContactDetailsTable,
  carrierFleetDriverDetailsTable,
  carrierFleetTable,
  carriersTable,
  db,
} from "@workspace/db";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import {
  CreateCarrierBody,
  ListCarriersQueryParams,
  UpdateCarrierBody,
} from "@workspace/api-zod";
import { encryptSensitiveValue } from "../lib/fieldEncryption";

const router: IRouter = Router();

const driverSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyPhone2: z.string().optional(),
  email: z.string().optional(),
  licenseType: z.string().optional(),
  cdlNumber: z.string().optional(),
  twicCard: z.boolean().optional(),
});

const equipmentSchema = z.object({
  year: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  vin: z.string().optional(),
  color: z.string().optional(),
  plateNumber: z.string().optional(),
});

const fleetEntrySchema = z.object({
  truck: equipmentSchema.optional(),
  trailer: equipmentSchema.optional(),
  driver: driverSchema.optional(),
});

const carrierExtensionSchema = z.object({
  phone2: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyPhone2: z.string().optional(),
  weeklyMinimumAmount: z.coerce.number().min(0).optional(),
  totalTripsPerWeek: z.coerce.number().int().min(0).optional(),
  fleetData: z.array(fleetEntrySchema).optional(),
});

type FleetEntryInput = z.infer<typeof fleetEntrySchema>;
type CarrierExtensionInput = z.infer<typeof carrierExtensionSchema>;
type DriverDetailsRow = typeof carrierFleetDriverDetailsTable.$inferSelect;

const CONTACT_DETAIL_KEYS = [
  "phone2",
  "emergencyContactName",
  "emergencyPhone",
  "emergencyPhone2",
  "weeklyMinimumAmount",
  "totalTripsPerWeek",
] as const;

function hasOwn(value: unknown, key: string): boolean {
  return Boolean(
    value &&
      typeof value === "object" &&
      Object.prototype.hasOwnProperty.call(value, key),
  );
}

function hasMeaningfulDriverDetails(driver?: FleetEntryInput["driver"]): boolean {
  if (!driver) return false;
  return Boolean(
    driver.phone2 ||
      driver.emergencyContactName ||
      driver.emergencyPhone ||
      driver.emergencyPhone2 ||
      driver.licenseType ||
      driver.cdlNumber ||
      driver.twicCard,
  );
}

function flatToNested(
  row: typeof carrierFleetTable.$inferSelect,
  details?: DriverDetailsRow,
) {
  return {
    id: row.id,
    truck: {
      year: row.truckYear ?? "",
      make: row.truckMake ?? "",
      model: row.truckModel ?? "",
      vin: row.truckVin ?? "",
      color: row.truckColor ?? "",
      plateNumber: row.truckPlateNumber ?? "",
    },
    trailer: {
      year: row.trailerYear ?? "",
      make: row.trailerMake ?? "",
      model: row.trailerModel ?? "",
      vin: row.trailerVin ?? "",
      color: row.trailerColor ?? "",
      plateNumber: row.trailerPlateNumber ?? "",
    },
    driver: {
      name: row.driverName ?? "",
      phone: row.driverPhone ?? "",
      phone2: details?.phone2 ?? "",
      emergencyContactName: details?.emergencyContactName ?? "",
      emergencyPhone: details?.emergencyPhone ?? "",
      emergencyPhone2: details?.emergencyPhone2 ?? "",
      email: row.driverEmail ?? "",
      licenseType: details?.licenseType ?? "",
      cdlNumber: details?.cdlNumber ?? "",
      twicCard: details?.twicCard ?? false,
    },
  };
}

function sanitizeCarrier(carrier: typeof carriersTable.$inferSelect) {
  const {
    accountNumberEncrypted,
    routingNumberEncrypted,
    ...safeCarrier
  } = carrier;

  void accountNumberEncrypted;
  void routingNumberEncrypted;
  return safeCarrier;
}

async function withFleet(carrier: typeof carriersTable.$inferSelect) {
  const [contactDetails] = await db
    .select()
    .from(carrierContactDetailsTable)
    .where(eq(carrierContactDetailsTable.carrierId, carrier.id));

  const fleet = await db
    .select()
    .from(carrierFleetTable)
    .where(eq(carrierFleetTable.carrierId, carrier.id))
    .orderBy(carrierFleetTable.sortOrder);

  const driverDetails = fleet.length
    ? await db
        .select()
        .from(carrierFleetDriverDetailsTable)
        .where(
          inArray(
            carrierFleetDriverDetailsTable.fleetId,
            fleet.map((entry) => entry.id),
          ),
        )
    : [];
  const detailsByFleetId = new Map(
    driverDetails.map((details) => [details.fleetId, details]),
  );

  return {
    ...sanitizeCarrier(carrier),
    phone2: contactDetails?.phone2 ?? null,
    emergencyContactName: contactDetails?.emergencyContactName ?? null,
    emergencyPhone: contactDetails?.emergencyPhone ?? null,
    emergencyPhone2: contactDetails?.emergencyPhone2 ?? null,
    weeklyMinimumAmount: contactDetails?.weeklyMinimumAmount
      ? Number.parseFloat(contactDetails.weeklyMinimumAmount)
      : null,
    totalTripsPerWeek: contactDetails?.totalTripsPerWeek ?? null,
    fleetData: fleet.map((entry) =>
      flatToNested(entry, detailsByFleetId.get(entry.id)),
    ),
  };
}

async function upsertContactDetails(
  carrierId: string,
  extension: CarrierExtensionInput,
  rawBody: unknown,
) {
  const values: Partial<typeof carrierContactDetailsTable.$inferInsert> = {};

  for (const key of CONTACT_DETAIL_KEYS) {
    if (!hasOwn(rawBody, key)) continue;

    if (key === "weeklyMinimumAmount") {
      values.weeklyMinimumAmount =
        extension.weeklyMinimumAmount == null
          ? null
          : String(extension.weeklyMinimumAmount);
    } else if (key === "totalTripsPerWeek") {
      values.totalTripsPerWeek = extension.totalTripsPerWeek ?? null;
    } else {
      values[key] = extension[key] || null;
    }
  }

  if (Object.keys(values).length === 0) return;

  const [existing] = await db
    .select({ id: carrierContactDetailsTable.id })
    .from(carrierContactDetailsTable)
    .where(eq(carrierContactDetailsTable.carrierId, carrierId));

  if (existing) {
    await db
      .update(carrierContactDetailsTable)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(carrierContactDetailsTable.carrierId, carrierId));
    return;
  }

  await db.insert(carrierContactDetailsTable).values({
    carrierId,
    ...values,
  });
}

async function replaceFleet(
  carrierId: string,
  fleetData: FleetEntryInput[],
): Promise<void> {
  await db
    .delete(carrierFleetTable)
    .where(eq(carrierFleetTable.carrierId, carrierId));

  for (const [index, entry] of fleetData.entries()) {
    const [fleet] = await db
      .insert(carrierFleetTable)
      .values({
        carrierId,
        sortOrder: index,
        truckYear: entry.truck?.year || null,
        truckMake: entry.truck?.make || null,
        truckModel: entry.truck?.model || null,
        truckVin: entry.truck?.vin || null,
        truckColor: entry.truck?.color || null,
        truckPlateNumber: entry.truck?.plateNumber || null,
        trailerYear: entry.trailer?.year || null,
        trailerMake: entry.trailer?.make || null,
        trailerModel: entry.trailer?.model || null,
        trailerVin: entry.trailer?.vin || null,
        trailerColor: entry.trailer?.color || null,
        trailerPlateNumber: entry.trailer?.plateNumber || null,
        driverName: entry.driver?.name || null,
        driverPhone: entry.driver?.phone || null,
        driverEmail: entry.driver?.email || null,
      })
      .returning({ id: carrierFleetTable.id });

    if (hasMeaningfulDriverDetails(entry.driver)) {
      await db.insert(carrierFleetDriverDetailsTable).values({
        fleetId: fleet.id,
        phone2: entry.driver?.phone2 || null,
        emergencyContactName: entry.driver?.emergencyContactName || null,
        emergencyPhone: entry.driver?.emergencyPhone || null,
        emergencyPhone2: entry.driver?.emergencyPhone2 || null,
        licenseType: entry.driver?.licenseType || null,
        cdlNumber: entry.driver?.cdlNumber || null,
        twicCard: entry.driver?.twicCard ?? false,
      });
    }
  }
}

function parseExtension(value: unknown) {
  return carrierExtensionSchema.safeParse(value);
}

router.get("/carriers/overview", async (_req, res): Promise<void> => {
  const [total] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(carriersTable);
  const [active] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(carriersTable)
    .where(eq(carriersTable.status, "Active"));
  const [inactive] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(carriersTable)
    .where(eq(carriersTable.status, "Inactive"));

  res.json({
    total: total?.count ?? 0,
    active: active?.count ?? 0,
    inactive: inactive?.count ?? 0,
  });
});

router.get("/carriers", async (req, res): Promise<void> => {
  const parsed = ListCarriersQueryParams.safeParse(req.query);
  const { search, status, page = 1, pageSize = 20 } = parsed.success
    ? parsed.data
    : { search: undefined, status: undefined, page: 1, pageSize: 20 };

  const conditions = [];
  if (status) conditions.push(eq(carriersTable.status, status));
  if (search) {
    conditions.push(
      or(
        ilike(carriersTable.companyName, `%${search}%`),
        ilike(carriersTable.primaryContact, `%${search}%`),
        ilike(carriersTable.mcNumber, `%${search}%`),
        ilike(carriersTable.usdotNumber, `%${search}%`),
        ilike(carriersTable.email, `%${search}%`),
      ),
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(carriersTable)
      .where(where)
      .orderBy(desc(carriersTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(carriersTable)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  res.json({
    data: await Promise.all(data.map(withFleet)),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

router.post("/carriers", async (req, res): Promise<void> => {
  const parsed = CreateCarrierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const extension = parseExtension(req.body);
  if (!extension.success) {
    res.status(400).json({ error: extension.error.message });
    return;
  }

  const { accountNumber, routingNumber, ...rest } = parsed.data;
  const insertData: Record<string, unknown> = { ...rest };

  if (accountNumber) {
    insertData.accountNumberLast4 = accountNumber.slice(-4);
    insertData.accountNumberEncrypted = encryptSensitiveValue(accountNumber);
  }
  if (routingNumber) {
    insertData.routingNumberLast4 = routingNumber.slice(-4);
    insertData.routingNumberEncrypted = encryptSensitiveValue(routingNumber);
  }

  const [carrier] = await db
    .insert(carriersTable)
    .values(insertData as typeof carriersTable.$inferInsert)
    .returning();

  await upsertContactDetails(carrier.id, extension.data, req.body);
  if (hasOwn(req.body, "fleetData")) {
    await replaceFleet(carrier.id, extension.data.fleetData ?? []);
  }

  res.status(201).json(await withFleet(carrier));
});

router.get("/carriers/:carrierId", async (req, res): Promise<void> => {
  const { carrierId } = req.params as { carrierId: string };
  const [carrier] = await db
    .select()
    .from(carriersTable)
    .where(eq(carriersTable.id, carrierId));

  if (!carrier) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(await withFleet(carrier));
});

router.patch("/carriers/:carrierId", async (req, res): Promise<void> => {
  const { carrierId } = req.params as { carrierId: string };
  const parsed = UpdateCarrierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const extension = parseExtension(req.body);
  if (!extension.success) {
    res.status(400).json({ error: extension.error.message });
    return;
  }

  const { accountNumber, routingNumber, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = {
    ...rest,
    updatedAt: new Date(),
  };

  if (accountNumber) {
    updateData.accountNumberLast4 = accountNumber.slice(-4);
    updateData.accountNumberEncrypted = encryptSensitiveValue(accountNumber);
  }
  if (routingNumber) {
    updateData.routingNumberLast4 = routingNumber.slice(-4);
    updateData.routingNumberEncrypted = encryptSensitiveValue(routingNumber);
  }

  const [carrier] = await db
    .update(carriersTable)
    .set(updateData as Partial<typeof carriersTable.$inferInsert>)
    .where(eq(carriersTable.id, carrierId))
    .returning();

  if (!carrier) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await upsertContactDetails(carrierId, extension.data, req.body);
  if (hasOwn(req.body, "fleetData")) {
    await replaceFleet(carrierId, extension.data.fleetData ?? []);
  }

  res.json(await withFleet(carrier));
});

router.delete("/carriers/:carrierId", async (req, res): Promise<void> => {
  const { carrierId } = req.params as { carrierId: string };
  await db.delete(carriersTable).where(eq(carriersTable.id, carrierId));
  res.status(204).send();
});

export default router;
