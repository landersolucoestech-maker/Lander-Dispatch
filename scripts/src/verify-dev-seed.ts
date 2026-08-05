import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import process from "node:process";
import { eq, inArray } from "drizzle-orm";
import { assertDevSeedTarget } from "./dev-seed-guard";

function currentBranch(): string {
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  try {
    return execFileSync("git", ["branch", "--show-current"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

const target = assertDevSeedTarget({
  nodeEnv: process.env.NODE_ENV,
  appEnv: process.env.APP_ENV,
  confirmation: process.env.SEED_DEV_CONFIRM,
  branch: currentBranch(),
  databaseUrl: process.env.DATABASE_URL,
  allowedRemoteDatabase: process.env.SEED_DEV_ALLOWED_DATABASE,
});

const database = await import("@workspace/db");
const {
  auditLogsTable,
  brokersTable,
  carriersTable,
  companyProfileTable,
  crmContactsTable,
  crmLeadsTable,
  db,
  driversTable,
  invoiceLoadsTable,
  invoicePaymentsTable,
  invoicesTable,
  loadsTable,
  pool,
  transactionsTable,
} = database;

const seededCarrierIds = [
  "d1000000-0000-4000-8000-000000000001",
  "d1000000-0000-4000-8000-000000000002",
  "d1000000-0000-4000-8000-000000000003",
];
const seededBrokerIds = [
  "d2000000-0000-4000-8000-000000000001",
  "d2000000-0000-4000-8000-000000000002",
  "d2000000-0000-4000-8000-000000000003",
];
const seededContactIds = [
  "d3000000-0000-4000-8000-000000000001",
  "d3000000-0000-4000-8000-000000000002",
  "d3000000-0000-4000-8000-000000000003",
];
const seededLeadIds = [
  "d4000000-0000-4000-8000-000000000001",
  "d4000000-0000-4000-8000-000000000002",
  "d4000000-0000-4000-8000-000000000003",
  "d4000000-0000-4000-8000-000000000004",
];
const seededDriverIds = [
  "d5000000-0000-4000-8000-000000000001",
  "d5000000-0000-4000-8000-000000000002",
  "d5000000-0000-4000-8000-000000000003",
];
const seededLoadIds = [
  "d6000000-0000-4000-8000-000000000001",
  "d6000000-0000-4000-8000-000000000002",
  "d6000000-0000-4000-8000-000000000003",
  "d6000000-0000-4000-8000-000000000004",
  "d6000000-0000-4000-8000-000000000005",
  "d6000000-0000-4000-8000-000000000006",
  "d6000000-0000-4000-8000-000000000007",
  "d6000000-0000-4000-8000-000000000008",
];
const seededInvoiceIds = [
  "d7000000-0000-4000-8000-000000000001",
  "d7000000-0000-4000-8000-000000000002",
  "d7000000-0000-4000-8000-000000000003",
];
const seededTransactionIds = [
  "d8000000-0000-4000-8000-000000000001",
  "d8000000-0000-4000-8000-000000000002",
  "d8000000-0000-4000-8000-000000000003",
  "d8000000-0000-4000-8000-000000000004",
  "d8000000-0000-4000-8000-000000000005",
  "d8000000-0000-4000-8000-000000000006",
];

try {
  const [company] = await db
    .select()
    .from(companyProfileTable)
    .where(eq(companyProfileTable.id, "d0000000-0000-4000-8000-000000000001"));
  assert(company, "Seeded company profile is missing.");
  assert.equal(company.companyName, "Lander Dispatch");

  const carriers = await db
    .select({ id: carriersTable.id })
    .from(carriersTable)
    .where(inArray(carriersTable.id, seededCarrierIds));
  assert.equal(carriers.length, 3, "Expected exactly 3 seeded carriers.");

  const brokers = await db
    .select({ id: brokersTable.id })
    .from(brokersTable)
    .where(inArray(brokersTable.id, seededBrokerIds));
  assert.equal(brokers.length, 3, "Expected exactly 3 seeded brokers.");

  const contacts = await db
    .select({ id: crmContactsTable.id })
    .from(crmContactsTable)
    .where(inArray(crmContactsTable.id, seededContactIds));
  assert.equal(contacts.length, 3, "Expected exactly 3 seeded CRM contacts.");

  const leads = await db
    .select({ id: crmLeadsTable.id, leadType: crmLeadsTable.leadType })
    .from(crmLeadsTable)
    .where(inArray(crmLeadsTable.id, seededLeadIds));
  assert.equal(leads.length, 4, "Expected exactly 4 seeded leads.");
  assert(
    leads.every((lead) => lead.leadType !== "Carrier"),
    "Development seed violated the domain rule: Carrier cannot be a Lead.",
  );

  const drivers = await db
    .select({ id: driversTable.id, complianceStatus: driversTable.complianceStatus })
    .from(driversTable)
    .where(inArray(driversTable.id, seededDriverIds));
  assert.equal(drivers.length, 3, "Expected exactly 3 seeded drivers.");
  assert(
    drivers.some((driver) => driver.complianceStatus === "Review Required"),
    "Driver seed must include a compliance-review scenario.",
  );

  const loads = await db
    .select({ id: loadsTable.id, status: loadsTable.status })
    .from(loadsTable)
    .where(inArray(loadsTable.id, seededLoadIds));
  assert.equal(loads.length, 8, "Expected exactly 8 seeded loads.");
  for (const expectedStatus of ["Delivered", "In Route", "Picked Up", "Dispatched", "New", "Canceled"]) {
    assert(
      loads.some((load) => load.status === expectedStatus),
      `Seeded loads are missing the ${expectedStatus} status scenario.`,
    );
  }

  const invoices = await db
    .select({ id: invoicesTable.id, carrierId: invoicesTable.carrierId })
    .from(invoicesTable)
    .where(inArray(invoicesTable.id, seededInvoiceIds));
  assert.equal(invoices.length, 3, "Expected exactly 3 seeded invoices.");
  assert(
    invoices.every((invoice) => invoice.carrierId !== null),
    "Every seeded invoice must be linked to a Carrier.",
  );

  const invoiceLinks = await db
    .select({ invoiceId: invoiceLoadsTable.invoiceId, loadId: invoiceLoadsTable.loadId })
    .from(invoiceLoadsTable)
    .where(inArray(invoiceLoadsTable.invoiceId, seededInvoiceIds));
  assert.equal(invoiceLinks.length, 5, "Expected exactly 5 seeded invoice/load links.");

  const payments = await db
    .select({ invoiceId: invoicePaymentsTable.invoiceId })
    .from(invoicePaymentsTable)
    .where(inArray(invoicePaymentsTable.invoiceId, seededInvoiceIds));
  assert.equal(payments.length, 2, "Expected exactly 2 seeded invoice payments.");

  const transactions = await db
    .select({ id: transactionsTable.id, type: transactionsTable.type })
    .from(transactionsTable)
    .where(inArray(transactionsTable.id, seededTransactionIds));
  assert.equal(transactions.length, 6, "Expected exactly 6 seeded transactions.");
  assert(transactions.some((transaction) => transaction.type === "Income"));
  assert(transactions.some((transaction) => transaction.type === "Expense"));

  const [audit] = await db
    .select({ id: auditLogsTable.id })
    .from(auditLogsTable)
    .where(eq(auditLogsTable.id, "d9000000-0000-4000-8000-000000000001"));
  assert(audit, "Development seed audit record is missing.");

  console.log(`Development seed verification passed on ${target.databaseTarget}.`);
} finally {
  await pool.end();
}
