export function dashboardEntityRoute(
  entityType: string,
  entityId?: string | null,
): string | null {
  const normalized = entityType.trim().toLowerCase();
  const id = entityId?.trim() ?? "";

  switch (normalized) {
    case "carrier":
      return id ? `/carriers/${id}` : "/carriers";
    case "broker":
      return id ? `/brokers/${id}` : "/brokers";
    case "load":
      return id ? `/loads/${id}` : "/loads";
    case "contact":
      return id ? `/crm/contacts/${id}` : "/crm";
    case "lead":
      return id ? `/crm/leads/${id}` : "/crm";
    case "driver":
      return "/crm";
    case "invoice":
      return id ? `/accounting/invoices/${id}` : "/accounting/invoices";
    case "transaction":
      return id
        ? `/accounting/transactions/${id}`
        : "/accounting/transactions";
    case "company_profile":
      return "/settings";
    case "document":
      return "/documents";
    case "development_dataset":
      return "/audit-log";
    default:
      return null;
  }
}
