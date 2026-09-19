import { mockDate, mockDateTime } from "./date";

export function createMockInternalConversations() {
  return [
    {
      id: "mock-internal-chat-001",
      title: "Dispatch Operations",
      participants: ["Marcus Reed", "Olivia Grant", "Sophia Bennett"],
      updatedAt: mockDateTime(0, 8, 42),
      messages: [
        { id: "mock-internal-001-a", sender: "other", senderName: "Olivia Grant", body: "LD-24091 release is confirmed. Driver has the gate pass.", at: mockDateTime(0, 8, 15) },
        { id: "mock-internal-001-b", sender: "self", senderName: "You", body: "Perfect. Keep the pickup photos attached before departure.", at: mockDateTime(0, 8, 18) },
        { id: "mock-internal-001-c", sender: "other", senderName: "Marcus Reed", body: "Driver ETA is 08:35. I’ll post the pickup status as soon as loaded.", at: mockDateTime(0, 8, 42) },
      ],
    },
    {
      id: "mock-internal-chat-002",
      title: "Accounting",
      participants: ["Sophia Bennett", "Daniel Carter"],
      updatedAt: mockDateTime(-1, 16, 25),
      messages: [
        { id: "mock-internal-002-a", sender: "other", senderName: "Sophia Bennett", body: "Apex partial payment is in. I’m reconciling INV-1038 now.", at: mockDateTime(-1, 16, 10) },
        { id: "mock-internal-002-b", sender: "self", senderName: "You", body: "Please flag the remaining balance for tomorrow’s follow-up.", at: mockDateTime(-1, 16, 25) },
      ],
    },
    {
      id: "mock-internal-chat-003",
      title: "Marketing + CRM",
      participants: ["Maya Collins", "Jordan Blake", "Daniel Carter"],
      updatedAt: mockDateTime(-1, 11, 40),
      messages: [
        { id: "mock-internal-003-a", sender: "other", senderName: "Maya Collins", body: "I need the broker exclusion list before the retargeting audience goes live.", at: mockDateTime(-1, 11, 15) },
        { id: "mock-internal-003-b", sender: "other", senderName: "Daniel Carter", body: "I’ll validate current partners and send the clean segment today.", at: mockDateTime(-1, 11, 40) },
      ],
    },
  ];
}

export function createMockSupportConversations() {
  return [
    {
      id: "mock-support-001",
      protocol: "SUP-260901",
      contactName: "Eric Lawson",
      phone: "(704) 555-0188",
      channel: "WhatsApp",
      status: "Open",
      assignee: "Dispatch",
      originLabel: "Carrier onboarding",
      tags: ["carrier", "onboarding", "authority"],
      messages: [
        { id: "mock-support-001-a", sender: "other", senderName: "Eric Lawson", body: "I submitted my carrier packet yesterday. Is anything else needed?", at: mockDateTime(0, 8, 5) },
        { id: "mock-support-001-b", sender: "self", senderName: "Support", body: "We received it. We’re validating insurance and authority now and will update you today.", at: mockDateTime(0, 8, 12) },
      ],
      internalNotes: [
        { id: "mock-support-001-note", sender: "self", senderName: "Internal note", body: "COI received. Authority active. Banking verification still pending.", at: mockDateTime(0, 8, 18), kind: "note" },
      ],
      createdAt: mockDateTime(-1, 15, 20),
      updatedAt: mockDateTime(0, 8, 18),
      priority: "High",
      deadline: mockDate(0),
    },
    {
      id: "mock-support-002",
      protocol: "SUP-260902",
      contactName: "Northstar Auto Group",
      phone: "(336) 555-0192",
      channel: "Email",
      status: "Pending",
      assignee: "Operations",
      originLabel: "Delivery question",
      tags: ["customer", "delivery", "eta"],
      messages: [
        { id: "mock-support-002-a", sender: "other", senderName: "Northstar Auto Group", body: "Can you confirm the delivery window for the BMW X5?", at: mockDateTime(0, 7, 55) },
      ],
      internalNotes: [],
      createdAt: mockDateTime(0, 7, 55),
      updatedAt: mockDateTime(0, 7, 55),
      priority: "Normal",
      deadline: mockDate(0),
    },
    {
      id: "mock-support-003",
      protocol: "SUP-260898",
      contactName: "Apex Auto Logistics",
      phone: "(919) 555-0145",
      channel: "Instagram",
      status: "Waiting",
      assignee: "Accounting",
      originLabel: "Payment follow-up",
      tags: ["broker", "invoice", "payment"],
      messages: [
        { id: "mock-support-003-a", sender: "other", senderName: "Apex Auto Logistics", body: "We sent the ACH yesterday. Can you confirm receipt?", at: mockDateTime(-1, 13, 30) },
        { id: "mock-support-003-b", sender: "self", senderName: "Support", body: "Accounting is matching the payment now. We’ll confirm the applied amount shortly.", at: mockDateTime(-1, 13, 42) },
      ],
      internalNotes: [],
      createdAt: mockDateTime(-1, 13, 30),
      updatedAt: mockDateTime(-1, 13, 42),
      priority: "High",
      deadline: mockDate(1),
    },
    {
      id: "mock-support-004",
      protocol: "SUP-260887",
      contactName: "Coastal Carriers LLC",
      phone: "(910) 555-0163",
      channel: "Facebook",
      status: "Closed",
      assignee: "Admin",
      originLabel: "Document request",
      tags: ["carrier", "documents"],
      messages: [
        { id: "mock-support-004-a", sender: "other", senderName: "Coastal Carriers LLC", body: "Where can I upload the updated W-9?", at: mockDateTime(-4, 9, 10) },
        { id: "mock-support-004-b", sender: "self", senderName: "Support", body: "We sent the secure upload link by email. The document is now received.", at: mockDateTime(-4, 9, 24) },
      ],
      internalNotes: [],
      createdAt: mockDateTime(-4, 9, 10),
      updatedAt: mockDateTime(-4, 9, 24),
      priority: "Normal",
      deadline: mockDate(-3),
    },
  ];
}
