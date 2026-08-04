import { Router, type IRouter } from "express";
import { db, carriersTable, carrierFleetTable } from "@workspace/db";
import { eq, ilike, or, desc, sql, and } from "drizzle-orm";
import {
  CreateCarrierBody,
  UpdateCarrierBody,
  ListCarriersQueryParams,
} from "@workspace/api-zod";

import { encryptSensitiveValue } from "../lib/fieldEncryption";

const router: IRouter = Router();

function flatToNested(row: typeof carrierFleetTable.$inferSelect) {
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
      email: row.driverEmail ?? "",
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
  const fleet = await db
    .select()
    .from(carrierFleetTable)
    .where(eq(carrierFleetTable.carrierId, carrier.id))
    .orderBy(carrierFleetTable.sortOrder);

  return {
    ...sanitizeCarrier(carrier),
    fleetData: fleet.map(flatToNested),
  };
}

interface FleetEntryInput {
  truck?: {
    year?: string;
    make?: string;
    model?: string;
    vin?: string;
    color?: string;
    plateNumber?: string;
  };
  trailer?: {
    year?: string;
    make?: string;
    model?: string;
    vin?: string;
    color?: string;
    plateNumber?: string;
  };
  driver?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

async function replaceFleet(
  carrierId: string,
  fleetData: FleetEntryInput[],
): Promise<void> {
  await db
    .delete(carrierFleetTable)
    .where(eq(carrierFleetTable.carrierId, carrierId));

  if (fleetData.length === 0) return;

  await db.insert(carrierFleetTable).values(
    fleetData.map((entry, index) => ({
      carrierId,
      sortOrder: index,
      truckYear: entry.truck?.year ?? null,
      truckMake: entry.truck?.make ?? null,
      truckModel: entry.truck?.model ?? null,
      truckVin: entry.truck?.vin ?? null,
      truckColor: entry.truck?.color ?? null,
      truckPlateNumber: entry.truck?.plateNumber ?? null,
      trailerYear: entry.trailer?.year ?? null,
      trailerMake: entry.trailer?.make ?? null,
      trailerModel: entry.trailer?.model ?? null,
      trailerVin: entry.trailer?.vin ?? null,
      trailerColor: entry.trailer?.color ?? null,
      trailerPlateNumber: entry.trailer?.plateNumber ?? null,
      driverName: entry.driver?.name ?? null,
      driverPhone: entry.driver?.phone ?? null,
      driverEmail: entry.driver?.email ?? null,
    })),
  );
}

function parseFleetData(value: unknown): FleetEntryInput[] | undefined {
  return Array.isArray(value) ? (value as FleetEntryInput[]) : undefined;
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
  const enriched = await Promise.all(data.map(withFleet));

  res.json({
    data: enriched,
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

  const payload = parsed.data as typeof parsed.data & {
    accountNumber?: string;
    routingNumber?: string;
    fleetData?: unknown;
  };
  const { accountNumber, routingNumber, fleetData, ...rest } = payload;
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

  const parsedFleetData = parseFleetData(fleetData);
  if (parsedFleetData?.length) {
    await replaceFleet(carrier.id, parsedFleetData);
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

  const payload = parsed.data as typeof parsed.data & {
    accountNumber?: string;
    routingNumber?: string;
    fleetData?: unknown;
  };
  const { accountNumber, routingNumber, fleetData, ...rest } = payload;
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

  const parsedFleetData = parseFleetData(fleetData);
  if (parsedFleetData) {
    await replaceFleet(carrierId, parsedFleetData);
  }

  res.json(await withFleet(carrier));
});

router.delete("/carriers/:carrierId", async (req, res): Promise<void> => {
  const { carrierId } = req.params as { carrierId: string };
  await db
    .delete(carriersTable)
    .where(eq(carriersTable.id, carrierId));
  res.status(204).send();
});

export default router;
