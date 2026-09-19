export function createMockSettingsData() {
  return {
    automations: {
      dailyDigest: true,
      overdueInvoices: true,
      loadFollowups: true,
      carrierCompliance: true,
      quietHours: true,
      taskDeadlines: true,
      agendaReminders: true,
      newLeadAlerts: true,
      failedIntegrations: true,
      weeklyReport: true,
      frequency: "Weekdays",
      preferredTime: "08:00",
    },
    integrations: [
      { id: "meta", name: "Meta (Facebook + Instagram)", category: "Marketing & messaging", status: "Connected", description: "Messages, account information, publishing, moderation, campaigns and Meta analytics." },
      { id: "whatsapp", name: "WhatsApp", category: "Messaging", status: "Connected", description: "Centralized customer conversations and support." },
      { id: "resend", name: "Resend", category: "Email", status: "Connected", description: "Transactional and operational email delivery." },
      { id: "youtube", name: "YouTube", category: "Content & media", status: "Disconnected", description: "Publishing, content management and campaign metrics." },
      { id: "tiktok", name: "TikTok", category: "Content & media", status: "Disconnected", description: "Publishing, supported messages, ads and analytics." },
      { id: "google-ads", name: "Google Ads", category: "Advertising", status: "Connected", description: "Campaign creation, management and reporting." },
      { id: "nfse", name: "NFS-e / Invoice Service", category: "Accounting", status: "Planned", description: "Service invoice issuance, consultation and management." },
      { id: "esign", name: "Electronic Signature", category: "Documents", status: "Planned", description: "Contract generation, sending, tracking and electronic signatures." },
    ],
    publicRegistration: {
      enabled: true,
      slug: "request-vehicle-transport",
      pixel: "",
      iframe: "",
      webhook: "https://example.com/mock/webhooks/leads",
    },
    users: [
      { id: "mock-user-owner", name: "Lander Admin", email: "admin@landerdispatch.example", role: "Owner", status: "Active" },
      { id: "mock-user-dispatch", name: "Marcus Reed", email: "marcus@landerdispatch.example", role: "Dispatcher", status: "Active" },
      { id: "mock-user-ops", name: "Olivia Grant", email: "olivia@landerdispatch.example", role: "Operations Manager", status: "Active" },
      { id: "mock-user-accounting", name: "Sophia Bennett", email: "sophia@landerdispatch.example", role: "Accounting", status: "Active" },
      { id: "mock-user-marketing", name: "Maya Collins", email: "maya@landerdispatch.example", role: "Marketing", status: "Pending" },
    ],
    roles: [
      { id: "owner", name: "Owner", description: "Full administrative access.", permissions: ["all"] },
      { id: "dispatcher", name: "Dispatcher", description: "Loads, CRM, agenda and carrier operations.", permissions: ["dashboard", "loads", "crm", "carriers", "agenda", "tasks"] },
      { id: "operations-manager", name: "Operations Manager", description: "Operational supervision, compliance and reporting.", permissions: ["dashboard", "loads", "crm", "carriers", "brokers", "agenda", "chat", "tasks", "documents", "reports"] },
      { id: "accounting", name: "Accounting", description: "Invoices, transactions and financial reports.", permissions: ["dashboard", "accounting", "documents", "reports"] },
      { id: "marketing", name: "Marketing", description: "Marketing workspace, CRM visibility and customer communication.", permissions: ["dashboard", "crm", "chat", "marketing", "reports"] },
    ],
  };
}
