import { Router, type IRouter } from "express";
import { db, driversTable } from "@workspace/db";
import { eq, ilike, or, desc, sql, and } from "drizzle-orm";

const router: IRouter = Router();

const VALID_STATUSES = new Set([
  "Active", "Inactive", "Suspended", "Disqualified",
  "On Leave", "Pending Documentation", "Terminated",
]);

const VALID_DRIVER_TYPES = new Set([
  "Company Driver", "Owner-Operator", "Independent Contractor",
  "Team Driver", "Temporary Driver", "Other",
]);

const VALID_EMPLOYMENT_TYPES = new Set([
  "Employee", "Contractor", "Owner-Operator", "Temporary", "Other",
]);

// ── List ───────────────────────────────────────────────────────────────────────
router.get("/crm/drivers", async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10)));
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (status) conditions.push(eq(driversTable.status, status));
  if (search) {
    conditions.push(or(
      ilike(driversTable.fullName, `%${search}%`),
      ilike(driversTable.email, `%${search}%`),
      ilike(driversTable.phoneNumber, `%${search}%`),
    ));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(driversTable).where(where)
      .orderBy(desc(driversTable.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(driversTable).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  res.json({
    data: data.map(serializeDriver),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

// ── Create ─────────────────────────────────────────────────────────────────────
router.post("/crm/drivers", async (req, res): Promise<void> => {
  const body = req.body ?? {};

  const { fullName, status, driverType, employmentType, ...rest } = body;
  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    res.status(400).json({ error: "fullName is required" }); return;
  }
  if (status && !VALID_STATUSES.has(status)) {
    res.status(400).json({ error: `Invalid status: ${status}` }); return;
  }
  if (driverType && !VALID_DRIVER_TYPES.has(driverType)) {
    res.status(400).json({ error: `Invalid driverType: ${driverType}` }); return;
  }
  if (employmentType && !VALID_EMPLOYMENT_TYPES.has(employmentType)) {
    res.status(400).json({ error: `Invalid employmentType: ${employmentType}` }); return;
  }

  const insertData = sanitizeDriverPayload({ fullName: fullName.trim(), status, driverType, employmentType, ...rest });
  const [driver] = await db.insert(driversTable).values(insertData as any).returning();
  res.status(201).json(serializeDriver(driver));
});

// ── Get One ───────────────────────────────────────────────────────────────────
router.get("/crm/drivers/:driverId", async (req, res): Promise<void> => {
  const { driverId } = req.params as { driverId: string };
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, driverId));
  if (!driver) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeDriver(driver));
});

// ── Update ────────────────────────────────────────────────────────────────────
router.patch("/crm/drivers/:driverId", async (req, res): Promise<void> => {
  const { driverId } = req.params as { driverId: string };
  const body = req.body ?? {};

  const { status, driverType, employmentType } = body;
  if (status !== undefined && status && !VALID_STATUSES.has(status)) {
    res.status(400).json({ error: `Invalid status: ${status}` }); return;
  }
  if (driverType !== undefined && driverType && !VALID_DRIVER_TYPES.has(driverType)) {
    res.status(400).json({ error: `Invalid driverType: ${driverType}` }); return;
  }
  if (employmentType !== undefined && employmentType && !VALID_EMPLOYMENT_TYPES.has(employmentType)) {
    res.status(400).json({ error: `Invalid employmentType: ${employmentType}` }); return;
  }

  const updateData = { ...sanitizeDriverPayload(body), updatedAt: new Date() };
  // Remove read-only derived fields
  delete (updateData as any).lastLoad;
  delete (updateData as any).totalLoads;
  delete (updateData as any).lastAssignmentDate;
  delete (updateData as any).complianceStatus;

  const [driver] = await db.update(driversTable)
    .set(updateData as Partial<typeof driversTable.$inferInsert>)
    .where(eq(driversTable.id, driverId))
    .returning();
  if (!driver) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeDriver(driver));
});

// ── Delete ────────────────────────────────────────────────────────────────────
router.delete("/crm/drivers/:driverId", async (req, res): Promise<void> => {
  const { driverId } = req.params as { driverId: string };
  await db.delete(driversTable).where(eq(driversTable.id, driverId));
  res.status(204).send();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALLOWED_WRITE_FIELDS = new Set([
  "fullName", "status", "dateOfBirth", "phoneNumber", "phoneNumber2", "email",
  "emergencyContactName", "emergencyPhoneNumber", "emergencyPhoneNumber2",
  "streetAddress", "city", "state", "zipCode", "hireDate", "driverType",
  "employmentType", "yearsOfExperience", "assignedEquipmentId",
  "driverLicenseNumber", "driverLicenseState", "driverLicenseClass", "driverLicenseExpiration",
  "cdlNumber", "cdlState", "cdlClass", "cdlExpiration", "cdlEndorsements", "cdlRestrictions",
  "hazmatEndorsement", "hazmatEndorsementExpiration",
  "medicalExaminerCertificateNumber", "medicalCardIssueDate", "medicalCardExpiration",
  "medicalExaminerName", "nationalRegistryNumber", "twicCardNumber", "twicCardExpiration",
  "driverQualificationFileStatus",
  "mvrCheckDate", "mvrNextReviewDate", "mvrStatus",
  "backgroundCheckDate", "backgroundCheckStatus",
  "drugTestDate", "drugTestResult", "alcoholTestDate", "alcoholTestResult",
  "clearinghouseStatus", "clearinghouseLastQueryDate", "clearinghouseNextQueryDate",
  "accidentHistory", "violationHistory",
  "assignedCarrierId", "assignedTruckId", "assignedTrailerId",
  "notes", "tags",
]);

function sanitizeDriverPayload(body: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!ALLOWED_WRITE_FIELDS.has(k)) continue;
    if (k === "state" && typeof v === "string") { result[k] = v.toUpperCase().slice(0, 2); continue; }
    if (k === "driverLicenseState" && typeof v === "string") { result[k] = v.toUpperCase().slice(0, 2); continue; }
    if (k === "cdlState" && typeof v === "string") { result[k] = v.toUpperCase().slice(0, 2); continue; }
    if (k === "driverLicenseNumber" || k === "cdlNumber") {
      result[k] = typeof v === "string" ? v.toUpperCase() : v; continue;
    }
    if (k === "yearsOfExperience" && v != null) { result[k] = Math.max(0, Math.round(Number(v))); continue; }
    if (k === "tags" || k === "cdlEndorsements") { result[k] = Array.isArray(v) ? v : []; continue; }
    result[k] = v === "" ? null : v;
  }
  return result;
}

function serializeDriver(d: typeof driversTable.$inferSelect) {
  return {
    ...d,
    cdlEndorsements: Array.isArray(d.cdlEndorsements) ? d.cdlEndorsements : [],
    tags: Array.isArray(d.tags) ? d.tags : [],
    totalLoads: d.totalLoads ?? 0,
  };
}

export default router;
