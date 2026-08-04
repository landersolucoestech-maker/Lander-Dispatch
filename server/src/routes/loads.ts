import { Router, type IRouter } from "express";
import { db, loadsTable, loadVehiclesTable, carriersTable, brokersTable } from "@workspace/db";
import { eq, ilike, or, desc, sql, and } from "drizzle-orm";
import { CreateLoadBody, UpdateLoadBody, ListLoadsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function computeRatePerMile(rate: string | null, miles: string | null): number | null {
  const r = parseFloat(rate ?? "0");
  const m = parseFloat(miles ?? "0");
  if (!m) return null;
  return Math.round((r / m) * 100) / 100;
}

async function withVehicles(load: typeof loadsTable.$inferSelect) {
  const [carrier] = load.carrierId
    ? await db.select({ companyName: carriersTable.companyName }).from(carriersTable).where(eq(carriersTable.id, load.carrierId))
    : [null];
  const [broker] = load.brokerId
    ? await db.select({ companyName: brokersTable.companyName }).from(brokersTable).where(eq(brokersTable.id, load.brokerId))
    : [null];
  const vehicles = await db
    .select()
    .from(loadVehiclesTable)
    .where(eq(loadVehiclesTable.loadId, load.id))
    .orderBy(loadVehiclesTable.vehicleNumber);
  return {
    ...load,
    carrierName: carrier?.companyName ?? null,
    brokerName: broker?.companyName ?? null,
    ratePerMile: computeRatePerMile(load.rate, load.miles),
    vehicles,
  };
}

async function replaceVehicles(loadId: string, vehicles: any[]) {
  await db.delete(loadVehiclesTable).where(eq(loadVehiclesTable.loadId, loadId));
  if (vehicles.length > 0) {
    await db.insert(loadVehiclesTable).values(
      vehicles.map((v: any, i: number) => ({
        loadId,
        vehicleNumber: v.vehicleNumber ?? i + 1,
        year: v.year ?? null,
        make: v.make ?? null,
        model: v.model ?? null,
        type: v.type ?? null,
        color: v.color ?? null,
        plate: v.plate ?? null,
        vin: v.vin ?? null,
        lotNumber: v.lotNumber ?? null,
        buyerNumber: v.buyerNumber ?? null,
        additionalInfo: v.additionalInfo ?? null,
      }))
    );
  }
}

router.get("/loads", async (req, res): Promise<void> => {
  const parsed = ListLoadsQueryParams.safeParse(req.query);
  const { search, status, carrierId, brokerId, page = 1, pageSize = 20 } = parsed.success ? parsed.data : { search: undefined, status: undefined, carrierId: undefined, brokerId: undefined, page: 1, pageSize: 20 };

  const conditions = [];
  if (status) conditions.push(eq(loadsTable.status, status));
  if (carrierId) conditions.push(eq(loadsTable.carrierId, carrierId));
  if (brokerId) conditions.push(eq(loadsTable.brokerId, brokerId));
  if (search) {
    conditions.push(or(
      ilike(loadsTable.loadId, `%${search}%`),
      ilike(loadsTable.pickupCity, `%${search}%`),
      ilike(loadsTable.deliveryCity, `%${search}%`),
    ));
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(loadsTable).where(where).orderBy(desc(loadsTable.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(loadsTable).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const enriched = await Promise.all(data.map(withVehicles));
  res.json({ data: enriched, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

async function generateLoadId(): Promise<string> {
  const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(loadsTable);
  const num = (result?.count ?? 0) + 1;
  return `LD-${String(num).padStart(5, "0")}`;
}

router.post("/loads", async (req, res): Promise<void> => {
  const parsed = CreateLoadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { vehicles, loadId: rawId, ...rest } = parsed.data as any;
  const loadId = rawId?.trim() || await generateLoadId();
  const [load] = await db.insert(loadsTable).values({ ...rest, loadId } as any).returning();
  if (Array.isArray(vehicles) && vehicles.length > 0) await replaceVehicles(load.id, vehicles);
  res.status(201).json(await withVehicles(load));
});

router.get("/loads/:loadId", async (req, res): Promise<void> => {
  const { loadId } = req.params as { loadId: string };
  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, loadId));
  if (!load) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await withVehicles(load));
});

router.patch("/loads/:loadId", async (req, res): Promise<void> => {
  const { loadId } = req.params as { loadId: string };
  const parsed = UpdateLoadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { vehicles, ...rest } = parsed.data as any;
  const [load] = await db.update(loadsTable).set({ ...rest, updatedAt: new Date() } as any).where(eq(loadsTable.id, loadId)).returning();
  if (!load) { res.status(404).json({ error: "Not found" }); return; }
  if (Array.isArray(vehicles)) await replaceVehicles(loadId, vehicles);
  res.json(await withVehicles(load));
});

router.delete("/loads/:loadId", async (req, res): Promise<void> => {
  const { loadId } = req.params as { loadId: string };
  await db.delete(loadsTable).where(eq(loadsTable.id, loadId));
  res.status(204).send();
});

router.post("/loads/bulk", async (req, res): Promise<void> => {
  const rows = req.body;
  if (!Array.isArray(rows) || rows.length === 0) { res.status(400).json({ error: "Body must be a non-empty array." }); return; }
  if (rows.length > 500) { res.status(400).json({ error: "Max 500 loads per import." }); return; }

  const allCarriers = await db.select({ id: carriersTable.id, name: carriersTable.companyName }).from(carriersTable);
  const allBrokers  = await db.select({ id: brokersTable.id,  name: brokersTable.companyName  }).from(brokersTable);
  const carrierByName = new Map(allCarriers.map((c) => [c.name.toLowerCase().trim(), c.id]));
  const brokerByName  = new Map(allBrokers.map((b)  => [b.name.toLowerCase().trim(), b.id]));

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(loadsTable);
  let nextNum = (countResult?.count ?? 0) + 1;

  const inserted: object[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const carrierId = row.carrierName ? (carrierByName.get(row.carrierName.toLowerCase().trim()) ?? null) : (row.carrierId ?? null);
      const brokerId  = row.brokerName  ? (brokerByName.get(row.brokerName.toLowerCase().trim())   ?? null) : (row.brokerId  ?? null);
      const loadId = `LD-${String(nextNum).padStart(5, "0")}`;
      nextNum++;
      const [load] = await db.insert(loadsTable).values({
        loadId, carrierId, brokerId,
        status: row.status ?? "New",
        dispatchDate: row.dispatchDate ?? null,
        pickupCity: row.pickupCity ?? null, pickupState: row.pickupState ?? null, pickupZip: row.pickupZip ?? null,
        pickupEstimated: row.pickupEstimated ?? null, pickupDeadline: row.pickupDeadline ?? null,
        deliveryCity: row.deliveryCity ?? null, deliveryState: row.deliveryState ?? null, deliveryZip: row.deliveryZip ?? null,
        deliveryEstimated: row.deliveryEstimated ?? null, deliveryDeadline: row.deliveryDeadline ?? null,
        miles: row.miles != null ? String(row.miles) : null,
        rate: row.rate != null ? String(row.rate) : null,
        paymentMethod: row.paymentMethod ?? null,
        dispatchInstructions: row.dispatchInstructions ?? null,
        pickupInstructions: row.pickupInstructions ?? null,
        deliveryInstructions: row.deliveryInstructions ?? null,
      } as any).returning();
      inserted.push(await withVehicles(load));
    } catch (err: unknown) {
      errors.push({ row: i + 1, error: err instanceof Error ? err.message : String(err) });
    }
  }

  res.status(201).json({ inserted: inserted.length, errors });
});

export default router;
