import process from "node:process";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:5000";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(response, label) {
  const body = await response.text();
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`${label} returned invalid JSON: ${body}`);
  }
}

async function post(path, body) {
  return fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function remove(path) {
  const response = await fetch(`${apiBaseUrl}${path}`, { method: "DELETE" });
  assert(
    response.status === 204 || response.status === 404,
    `Cleanup ${path} failed with ${response.status}.`,
  );
}

const suffix = Date.now();
const invalidCarrierResponse = await post("/api/crm/leads", {
  companyName: `Invalid Carrier Lead ${suffix}`,
  leadType: "Carrier",
  pipelineStage: "New Lead",
});
assert(
  invalidCarrierResponse.status === 400,
  `Carrier Lead was not rejected; received ${invalidCarrierResponse.status}.`,
);

const brokerCreateResponse = await post("/api/crm/leads", {
  companyName: `CI Broker Prospect ${suffix}`,
  leadType: "Broker",
  pipelineStage: "Qualified",
  leadSource: "Outbound Prospecting",
  priority: "High",
  primaryContact: "CI Broker Contact",
  phone: "+1 (407) 555-0991",
  email: `broker-${suffix}@example.test`,
  brokerType: "Freight Broker",
  mcNumber: `MC-CI-${suffix}`,
  usdotNumber: `USDOT-CI-${suffix}`,
  coverage: "Southeast",
  freightTypes: "Auto Transport, Dealer Transfers",
  selectedStates: "FL, GA, SC",
  serviceTypes: ["Auto Transport"],
  operatingStates: ["FL", "GA", "SC"],
  estimatedWeeklyLoads: 8,
  estimatedWeeklyRevenue: 12000,
  tags: ["CI", "Broker Prospect"],
});
assert(
  brokerCreateResponse.status === 201,
  `Broker Lead creation failed with ${brokerCreateResponse.status}.`,
);
const brokerLead = await readJson(brokerCreateResponse, "Broker Lead creation");
assert(brokerLead.leadType === "Broker", "Broker Lead lost its leadType.");
assert(brokerLead.mcNumber?.startsWith("MC-CI-"), "Broker Lead lost MC Number.");

const pipelineFilterResponse = await fetch(
  `${apiBaseUrl}/api/crm/leads?status=Qualified&search=${encodeURIComponent(brokerLead.companyName)}`,
);
assert(
  pipelineFilterResponse.ok,
  `Legacy pipeline filter failed with ${pipelineFilterResponse.status}.`,
);
const pipelineFilter = await readJson(
  pipelineFilterResponse,
  "Legacy pipeline filter",
);
assert(
  pipelineFilter.data?.some(
    (lead) => lead.id === brokerLead.id && lead.pipelineStage === "Qualified",
  ),
  "status=Qualified did not filter by pipeline stage.",
);

const recordStatusFilterResponse = await fetch(
  `${apiBaseUrl}/api/crm/leads?status=Active&search=${encodeURIComponent(brokerLead.companyName)}`,
);
assert(
  recordStatusFilterResponse.ok,
  `Record status filter failed with ${recordStatusFilterResponse.status}.`,
);
const recordStatusFilter = await readJson(
  recordStatusFilterResponse,
  "Record status filter",
);
assert(
  recordStatusFilter.data?.some(
    (lead) => lead.id === brokerLead.id && lead.status === "Active",
  ),
  "status=Active did not filter by record status.",
);

const brokerConvertResponse = await post(
  `/api/crm/leads/${brokerLead.id}/convert`,
  {},
);
assert(
  brokerConvertResponse.status === 201,
  `Broker Lead conversion failed with ${brokerConvertResponse.status}.`,
);
const brokerConversion = await readJson(
  brokerConvertResponse,
  "Broker Lead conversion",
);
assert(
  brokerConversion.convertedEntityType === "Broker",
  "Broker Lead did not convert to Broker.",
);

const brokerResponse = await fetch(
  `${apiBaseUrl}/api/brokers/${brokerConversion.convertedEntityId}`,
);
assert(brokerResponse.ok, `Converted Broker lookup failed with ${brokerResponse.status}.`);
const broker = await readJson(brokerResponse, "Converted Broker lookup");
assert(broker.companyName === brokerLead.companyName, "Converted Broker has wrong company name.");
assert(broker.mcNumber === brokerLead.mcNumber, "Converted Broker has wrong MC Number.");

const repeatedConversionResponse = await post(
  `/api/crm/leads/${brokerLead.id}/convert`,
  {},
);
assert(
  repeatedConversionResponse.status === 409,
  `Repeated Lead conversion was not rejected; received ${repeatedConversionResponse.status}.`,
);

const contactCreateResponse = await post("/api/crm/leads", {
  companyName: `CI Dealer Prospect ${suffix}`,
  leadType: "Dealer",
  pipelineStage: "Proposal Sent",
  leadSource: "Referral",
  priority: "Normal",
  primaryContact: "CI Dealer Contact",
  phone: "+1 (407) 555-0992",
  email: `dealer-${suffix}@example.test`,
  streetAddress: "100 CI Validation Way",
  city: "Orlando",
  state: "fl",
  zipCode: "32827",
  serviceTypes: ["Dealer Transfers"],
  operatingStates: ["FL", "GA"],
  estimatedWeeklyLoads: 5,
  estimatedWeeklyRevenue: 7500,
});
const contactCreateBody = await readJson(
  contactCreateResponse,
  "Dealer Lead creation",
);
assert(
  contactCreateResponse.status === 201,
  `Dealer Lead creation failed with ${contactCreateResponse.status}: ${JSON.stringify(contactCreateBody)}`,
);
const contactLead = contactCreateBody;
assert(contactLead.state === "FL", "Lead state was not normalized to uppercase.");

const contactConvertResponse = await post(
  `/api/crm/leads/${contactLead.id}/convert`,
  {},
);
assert(
  contactConvertResponse.status === 201,
  `Dealer Lead conversion failed with ${contactConvertResponse.status}.`,
);
const contactConversion = await readJson(
  contactConvertResponse,
  "Dealer Lead conversion",
);
assert(
  contactConversion.convertedEntityType === "Contact",
  "Dealer Lead did not convert to Contact.",
);

const contactResponse = await fetch(
  `${apiBaseUrl}/api/crm/contacts/${contactConversion.convertedEntityId}`,
);
assert(contactResponse.ok, `Converted Contact lookup failed with ${contactResponse.status}.`);
const contact = await readJson(contactResponse, "Converted Contact lookup");
assert(contact.contactType === "Dealer", "Converted Contact has wrong contact type.");
assert(contact.companyName === contactLead.companyName, "Converted Contact has wrong company name.");

await remove(`/api/brokers/${brokerConversion.convertedEntityId}`);
await remove(`/api/crm/contacts/${contactConversion.convertedEntityId}`);
await remove(`/api/crm/leads/${brokerLead.id}`);
await remove(`/api/crm/leads/${contactLead.id}`);

console.log("CRM Lead domain smoke test passed.");
