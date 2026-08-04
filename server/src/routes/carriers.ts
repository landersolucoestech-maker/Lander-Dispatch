import { Router, type IRouter } from "express";
import { db, carriersTable, carrierFleetTable, loadsTable } from "@workspace/db";
import { eq, ilike, or, desc, sql, and } from "drizzle-orm";
import {
  CreateCarrierBody,
  UpdateCarrierBody,
  ListCarriersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function flatToNested(row: typeof carrierFleetTable.$inferSelect) {
  return {
    id: row.id,
    truck: { year: row.truckYear ?? "", make: row.truckMake ?? "", model: row.truckModel ?? "", vin: row.truckVin ?? "", color: row.truckColor ?? "", plateNumber: row.truckPlateNumber ?? "" },
    trailer: { year: row.trailerYear ?? "", make: row.trailerMake ?? "", model: row.trailerModel ?? "", vin: row.trailerVin ?? "", color: row.trailerColor ?? "", plateNumber: row.trailerPlateNumber ?? "" },
    driver: { name: row.driverName ?? "", phone: row.driverPhone ?? "", email: row.driverEmail ?? "" },
  };
}

async function withFleet(carrier: typeof carriersTable.$inferSelect) {
  const fleet = await db
    .select()
    .from(carrierFleetTable)
    .where(eq(carrierFleetTable.carrierId, carrier.id))
    .orderBy(carrierFleetTable.sortOrder);
  return { ...carrier, fleetData: fleet.map(flatToNested) };
}

async function replaceFleet(carrierId: string, fleetData: any[]) {
  await db.delete(carrierFleetTable).where(eq(carrierFleetTable.carrierId, carrierId));
  if (fleetData.length > 0) {
    await db.insert(carrierFleetTable).values(
      fleetData.map((entry: any, i: number) => ({
        carrierId,
        sortOrder: i,
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
      }))
    );
  }
}

router.get("/carriers/overview", async (_req, res): Promise<void> => {
  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(carriersTable);
  const [active] = await db.select({ count: sql<number>`count(*)::int` }).from(carriersTable).where(eq(carriersTable.status, "Active"));
  const [inactive] = await db.select({ count: sql<number>`count(*)::int` }).from(carriersTable).where(eq(carriersTable.status, "Inactive"));
  res.json({ total: total?.count ?? 0, active: active?.count ?? 0, inactive: inactive?.count ?? 0 });
});

router.get("/carriers", async (req, res): Promise<void> => {
  const parsed = ListCarriersQueryParams.safeParse(req.query);
  const { search, status, page = 1, pageSize = 20 } = parsed.success ? parsed.data : { search: undefined, status: undefined, page: 1, pageSize: 20 };

  const conditions = [];
  if (status) conditions.push(eq(carriersTable.status, status));
  if (search) {
    conditions.push(or(
      ilike(carriersTable.companyName, `%${search}%`),
      ilike(carriersTable.primaryContact, `%${search}%`),
      ilike(carriersTable.mcNumber, `%${search}%`),
      ilike(carriersTable.usdotNumber, `%${search}%`),
      ilike(carriersTable.email, `%${search}%`),
    ));
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(carriersTable).where(where).orderBy(desc(carriersTable.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(carriersTable).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const enriched = await Promise.all(data.map(withFleet));

  res.json({
    data: enriched,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

router.post("/carriers", async (req, res): Promise<void> => {
  const parsed = CreateCarrierBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { accountNumber, routingNumber, fleetData, ...rest } = parsed.data as any;
  const insertData: Record<string, unknown> = { ...rest };
  if (accountNumber) {
    insertData.accountNumberLast4 = String(accountNumber).slice(-4);
    insertData.accountNumberEncrypted = String(accountNumber);
  }
  if (routingNumber) {
    insertData.routingNumberLast4 = String(routingNumber).slice(-4);
    insertData.routingNumberEncrypted = String(routingNumber);
  }

  const [carrier] = await db.insert(carriersTable).values(insertData as any).returning();
  if (Array.isArray(fleetData) && fleetData.length > 0) {
    await replaceFleet(carrier.id, fleetData);
  }
  res.status(201).json(await withFleet(carrier));
});

router.get("/carriers/:carrierId", async (req, res): Promise<void> => {
  const { carrierId } = req.params as { carrierId: string };
  const [carrier] = await db.select().from(carriersTable).where(eq(carriersTable.id, carrierId));
  if (!carrier) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await withFleet(carrier));
});

router.patch("/carriers/:carrierId", async (req, res): Promise<void> => {
  const { carrierId } = req.params as { carrierId: string };
  const parsed = UpdateCarrierBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { accountNumber, routingNumber, fleetData, ...rest } = parsed.data as any;
  const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (accountNumber) {
    updateData.accountNumberLast4 = String(accountNumber).slice(-4);
    updateData.accountNumberEncrypted = String(accountNumber);
  }
  if (routingNumber) {
    updateData.routingNumberLast4 = String(routingNumber).slice(-4);
    updateData.routingNumberEncrypted = String(routingNumber);
  }

  const [carrier] = await db.update(carriersTable).set(updateData as any).where(eq(carriersTable.id, carrierId)).returning();
  if (!carrier) { res.status(404).json({ error: "Not found" }); return; }
  if (Array.isArray(fleetData)) await replaceFleet(carrierId, fleetData);
  res.json(await withFleet(carrier));
});

router.delete("/carriers/:carrierId", async (req, res): Promise<void> => {
  const { carrierId } = req.params as { carrierId: string };
  await db.delete(carriersTable).where(eq(carriersTable.id, carrierId));
  res.status(204).send();
});

export default router;
