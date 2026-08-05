import process from "node:process";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:5000";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function dateOffset(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function readJson(response, label) {
  const body = await response.text();
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`${label} returned invalid JSON: ${body}`);
  }
}

async function request(path, method = "GET", body) {
  return fetch(`${apiBaseUrl}${path}`, {
    method,
    headers:
      body === undefined
        ? { accept: "application/json" }
        : {
            accept: "application/json",
            "content-type": "application/json",
          },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function waitForActivity(entityType, entityId) {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const response = await request("/api/dashboard/activity");
    assert(response.ok, `Dashboard activity failed with ${response.status}.`);
    const items = await readJson(response, "Dashboard activity");
    if (
      items.some(
        (item) =>
          item.entityType === entityType &&
          (!entityId || item.entityId === entityId),
      )
    ) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(
    `Dashboard activity did not expose ${entityType}${entityId ? ` ${entityId}` : ""}.`,
  );
}

const suffix = Date.now();
const createdTransactionIds = [];
let invoiceId = null;
let invoiceNumber = null;

try {
  const incomeResponse = await request("/api/transactions", "POST", {
    date: dateOffset(0),
    type: "Income",
    category: "Commission",
    description: `Dashboard revenue smoke ${suffix}`,
    paymentMethod: "ACH",
    amount: 123.45,
    status: "Cleared",
    referenceNumber: `DASH-${suffix}`,
    notes: "Temporary dashboard validation transaction",
  });
  assert(
    incomeResponse.status === 201,
    `Dashboard revenue transaction failed with ${incomeResponse.status}.`,
  );
  const incomeTransaction = await readJson(
    incomeResponse,
    "Dashboard revenue transaction",
  );
  createdTransactionIds.push(incomeTransaction.id);

  const kpiResponse = await request("/api/dashboard/kpis");
  assert(kpiResponse.ok, `Dashboard KPIs failed with ${kpiResponse.status}.`);
  const kpis = await readJson(kpiResponse, "Dashboard KPIs");
  assert(Number.isFinite(kpis.monthlyRevenue), "Monthly revenue is not numeric.");
  assert(
    kpis.monthlyRevenue >= 123.45,
    `Monthly revenue did not include cleared Income; received ${kpis.monthlyRevenue}.`,
  );
  assert(Number.isInteger(kpis.loadsBooked), "Loads booked is not an integer.");
  assert(Number.isInteger(kpis.activeCarriers), "Active carriers is not an integer.");

  const loadResponse = await request(
    `/api/loads?search=${encodeURIComponent("LD-DEV-1007")}&page=1&pageSize=10`,
  );
  assert(loadResponse.ok, `Seeded load lookup failed with ${loadResponse.status}.`);
  const loadList = await readJson(loadResponse, "Seeded load lookup");
  const load = loadList.data?.find((item) => item.loadId === "LD-DEV-1007");
  assert(load, "Seeded load LD-DEV-1007 was not found.");
  assert(load.carrierId, "Seeded load LD-DEV-1007 has no Carrier.");

  const invoiceResponse = await request("/api/invoices", "POST", {
    carrierId: load.carrierId,
    issueDate: dateOffset(-3),
    dueDate: dateOffset(-1),
    total: 66.25,
    loadIds: [load.id],
    notes: `Dashboard overdue alert smoke ${suffix}`,
  });
  assert(
    invoiceResponse.status === 201,
    `Dashboard test invoice failed with ${invoiceResponse.status}.`,
  );
  const invoice = await readJson(invoiceResponse, "Dashboard test invoice");
  invoiceId = invoice.id;
  invoiceNumber = invoice.invoiceNumber;

  const alertResponse = await request("/api/dashboard/alerts");
  assert(alertResponse.ok, `Dashboard alerts failed with ${alertResponse.status}.`);
  const alertsBeforePayment = await readJson(
    alertResponse,
    "Dashboard alerts before payment",
  );
  assert(
    alertsBeforePayment.some(
      (alert) =>
        alert.alertType === "invoice_overdue" &&
        alert.relatedEntityId === invoiceId,
    ),
    "Overdue unpaid invoice did not appear in Dashboard alerts.",
  );

  const paymentResponse = await request(
    `/api/invoices/${invoiceId}/payments`,
    "POST",
    {
      paymentDate: dateOffset(0),
      amount: 66.25,
      paymentMethod: "ACH",
      reference: `DASH-PAY-${suffix}`,
      notes: "Full payment for dashboard alert validation",
    },
  );
  assert(
    paymentResponse.status === 201,
    `Dashboard test payment failed with ${paymentResponse.status}.`,
  );

  const alertsAfterPaymentResponse = await request("/api/dashboard/alerts");
  assert(
    alertsAfterPaymentResponse.ok,
    `Dashboard alerts after payment failed with ${alertsAfterPaymentResponse.status}.`,
  );
  const alertsAfterPayment = await readJson(
    alertsAfterPaymentResponse,
    "Dashboard alerts after payment",
  );
  assert(
    !alertsAfterPayment.some(
      (alert) =>
        alert.alertType === "invoice_overdue" &&
        alert.relatedEntityId === invoiceId,
    ),
    "Fully paid overdue invoice remained in Dashboard alerts.",
  );

  await waitForActivity("invoice", invoiceId);
} finally {
  if (invoiceId) {
    const deleteInvoiceResponse = await request(
      `/api/invoices/${invoiceId}`,
      "DELETE",
    );
    assert(
      deleteInvoiceResponse.status === 204 || deleteInvoiceResponse.status === 404,
      `Dashboard test invoice cleanup failed with ${deleteInvoiceResponse.status}.`,
    );
  }

  if (invoiceNumber) {
    const linkedTransactionResponse = await request(
      `/api/transactions?search=${encodeURIComponent(invoiceNumber)}&page=1&pageSize=20`,
    );
    if (linkedTransactionResponse.ok) {
      const linkedTransactions = await readJson(
        linkedTransactionResponse,
        "Dashboard linked transaction cleanup",
      );
      for (const transaction of linkedTransactions.data ?? []) {
        createdTransactionIds.push(transaction.id);
      }
    }
  }

  for (const transactionId of [...new Set(createdTransactionIds)]) {
    const deleteTransactionResponse = await request(
      `/api/transactions/${transactionId}`,
      "DELETE",
    );
    assert(
      deleteTransactionResponse.status === 204 ||
        deleteTransactionResponse.status === 404,
      `Dashboard transaction cleanup failed with ${deleteTransactionResponse.status}.`,
    );
  }
}

console.log("Dashboard accounting and alert smoke test passed.");
