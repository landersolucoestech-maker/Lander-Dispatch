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

async function request(path, method, body) {
  return fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const suffix = Date.now();

for (const restrictedType of ["Carrier", "Broker", "Driver"]) {
  const response = await request("/api/crm/contacts", "POST", {
    companyName: `Invalid ${restrictedType} Contact ${suffix}`,
    contactType: restrictedType,
    status: "Active",
    emergencyService: false,
    tags: [],
  });
  assert(
    response.status === 400,
    `${restrictedType} was incorrectly accepted by generic Contacts with status ${response.status}.`,
  );
}

const plaintextBankResponse = await request("/api/crm/contacts", "POST", {
  companyName: `Invalid Banking Payload ${suffix}`,
  contactType: "Banking",
  status: "Active",
  accountNumber: "123456789",
  routingNumber: "987654321",
  emergencyService: false,
  tags: [],
});
assert(
  plaintextBankResponse.status === 400,
  `Plaintext banking fields were accepted with status ${plaintextBankResponse.status}.`,
);

const createResponse = await request("/api/crm/contacts", "POST", {
  companyName: `CI Dealer Contact ${suffix}`,
  contactType: "Dealer",
  status: "Active",
  priority: "High",
  rating: 4.7,
  primaryContactName: "CI Dealer Manager",
  primaryPhoneNumber: "+1 (407) 555-0981",
  primaryPhoneNumber2: "+1 (407) 555-0982",
  email: `dealer-contact-${suffix}@example.test`,
  website: "https://dealer-contact.example.test",
  emergencyContactName: "CI After Hours",
  emergencyPhoneNumber: "+1 (407) 555-0989",
  streetAddress: "100 Contact Validation Way",
  city: "Orlando",
  state: "fl",
  zipCode: "32827",
  businessHours: "Mon-Fri 8:00 AM-6:00 PM",
  emergencyService: false,
  lastContact: new Date().toISOString().slice(0, 10),
  tags: ["CI", "Dealer"],
  notes: "CRM generic contact smoke test",
});
assert(
  createResponse.status === 201,
  `Generic Contact creation failed with ${createResponse.status}.`,
);
const contact = await readJson(createResponse, "Generic Contact creation");
assert(contact.contactType === "Dealer", "Generic Contact has the wrong type.");
assert(contact.state === "FL", "Generic Contact state was not normalized.");
assert(contact.rating === 4.7, "Generic Contact rating was not serialized as a number.");

const updateResponse = await request(
  `/api/crm/contacts/${contact.id}`,
  "PATCH",
  {
    priority: "Medium",
    notes: "Updated by CRM generic contact smoke test",
  },
);
assert(
  updateResponse.ok,
  `Generic Contact update failed with ${updateResponse.status}.`,
);
const updatedContact = await readJson(updateResponse, "Generic Contact update");
assert(updatedContact.priority === "Medium", "Generic Contact priority was not updated.");

const getResponse = await fetch(`${apiBaseUrl}/api/crm/contacts/${contact.id}`);
assert(getResponse.ok, `Generic Contact lookup failed with ${getResponse.status}.`);
const fetchedContact = await readJson(getResponse, "Generic Contact lookup");
assert(fetchedContact.id === contact.id, "Generic Contact lookup returned the wrong record.");

const deleteResponse = await request(
  `/api/crm/contacts/${contact.id}`,
  "DELETE",
);
assert(
  deleteResponse.status === 204,
  `Generic Contact deletion failed with ${deleteResponse.status}.`,
);

const deletedResponse = await fetch(`${apiBaseUrl}/api/crm/contacts/${contact.id}`);
assert(
  deletedResponse.status === 404,
  `Deleted Generic Contact remained available with status ${deletedResponse.status}.`,
);

console.log("CRM generic contact domain smoke test passed.");
