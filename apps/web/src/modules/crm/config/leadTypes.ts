// ── Lead Types ────────────────────────────────────────────────────────────────
// Carrier is NOT a valid Lead type — Carriers belong in Contacts.

export const LEAD_TYPES = [
  "Broker",
  "Direct Customer",
  "Dealer",
  "Shipper",
  "Auction",
  "Manufacturer",
  "Fleet / Rental Company",
  "Other",
] as const;

export type LeadType = (typeof LEAD_TYPES)[number];

// ── Pipeline Stages ───────────────────────────────────────────────────────────

export const PIPELINE_STAGES = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Onboarding",
  "Won",
  "Lost",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/** Stages the user can set directly in the form (Won/Lost require specific actions) */
export const EDITABLE_PIPELINE_STAGES = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Onboarding",
] as const;

export type EditablePipelineStage = (typeof EDITABLE_PIPELINE_STAGES)[number];

// ── Lead Statuses ─────────────────────────────────────────────────────────────

export const LEAD_STATUSES = [
  "Active",
  "Converted",
  "Lost",
  "Archived",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

// ── Lead Sources ──────────────────────────────────────────────────────────────

export const LEAD_SOURCES = [
  "Referral",
  "Website",
  "Phone Call",
  "Email",
  "Social Media",
  "Central Dispatch",
  "FMCSA",
  "Google Search",
  "Event",
  "Manual Entry",
  "Other",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

// ── Priorities ────────────────────────────────────────────────────────────────

export const PRIORITIES = ["Low", "Normal", "High", "Critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

// ── Lead Type Config ──────────────────────────────────────────────────────────

export interface LeadTypeConfig {
  component: "broker" | "directCustomer" | "dealer" | "shipper" | "auction" | "manufacturer" | "fleetRental" | "other";
  conversionTarget: "Broker" | "Contact";
}

export const LEAD_TYPE_CONFIG: Record<LeadType, LeadTypeConfig> = {
  Broker: { component: "broker", conversionTarget: "Broker" },
  "Direct Customer": { component: "directCustomer", conversionTarget: "Contact" },
  Dealer: { component: "dealer", conversionTarget: "Contact" },
  Shipper: { component: "shipper", conversionTarget: "Contact" },
  Auction: { component: "auction", conversionTarget: "Contact" },
  Manufacturer: { component: "manufacturer", conversionTarget: "Contact" },
  "Fleet / Rental Company": { component: "fleetRental", conversionTarget: "Contact" },
  Other: { component: "other", conversionTarget: "Contact" },
};
