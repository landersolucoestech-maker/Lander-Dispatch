// ── Contact Types ─────────────────────────────────────────────────────────────

export const CONTACT_TYPES = [
  "Carrier",
  "Broker",
  "Driver",
  "Dealer",
  "Direct Customer",
  "Shipper",
  "Auction",
  "Manufacturer",
  "Fleet / Rental Company",
  "Roadside Assistance",
  "Truck Repair",
  "Tire Repair",
  "Towing",
  "FMCSA",
  "Insurance",
  "Factoring",
  "Banking",
  "Accounting",
  "Legal",
  "Software",
  "Internet",
  "Office Supplier",
  "Other",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

export interface ContactTypeConfig {
  /** Show generic address block */
  showAddress: boolean;
  /** Show coverage area field */
  showCoverageArea: boolean;
  /** Show business hours field */
  showBusinessHours: boolean;
  /** Show 24/7 emergency toggle */
  showEmergencyService: boolean;
  /** Show services textarea */
  showServices: boolean;
  /** Show full Broker-specific fields */
  showBrokerFields: boolean;
  /** Show full Carrier-specific fields */
  showCarrierFields: boolean;
}

export const CONTACT_TYPE_CONFIG: Record<ContactType, ContactTypeConfig> = {
  Driver: {
    showAddress: false, showCoverageArea: false, showBusinessHours: false,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: false,
  },
  Carrier: {
    showAddress: true, showCoverageArea: false, showBusinessHours: false,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: true,
  },
  Broker: {
    showAddress: true, showCoverageArea: false, showBusinessHours: false,
    showEmergencyService: false, showServices: false,
    showBrokerFields: true, showCarrierFields: false,
  },
  Dealer: {
    showAddress: true, showCoverageArea: false, showBusinessHours: true,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: false,
  },
  "Direct Customer": {
    showAddress: true, showCoverageArea: false, showBusinessHours: true,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: false,
  },
  Shipper: {
    showAddress: true, showCoverageArea: true, showBusinessHours: true,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: false,
  },
  Auction: {
    showAddress: true, showCoverageArea: false, showBusinessHours: true,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: false,
  },
  Manufacturer: {
    showAddress: true, showCoverageArea: true, showBusinessHours: true,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: false,
  },
  "Fleet / Rental Company": {
    showAddress: true, showCoverageArea: true, showBusinessHours: true,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: false,
  },
  "Roadside Assistance": {
    showAddress: true, showCoverageArea: true, showBusinessHours: true,
    showEmergencyService: true, showServices: true,
    showBrokerFields: false, showCarrierFields: false,
  },
  "Truck Repair": {
    showAddress: true, showCoverageArea: true, showBusinessHours: true,
    showEmergencyService: true, showServices: true,
    showBrokerFields: false, showCarrierFields: false,
  },
  "Tire Repair": {
    showAddress: true, showCoverageArea: true, showBusinessHours: true,
    showEmergencyService: true, showServices: true,
    showBrokerFields: false, showCarrierFields: false,
  },
  Towing: {
    showAddress: true, showCoverageArea: true, showBusinessHours: true,
    showEmergencyService: true, showServices: true,
    showBrokerFields: false, showCarrierFields: false,
  },
  FMCSA: {
    showAddress: true, showCoverageArea: false, showBusinessHours: true,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: false,
  },
  Insurance: {
    showAddress: true, showCoverageArea: false, showBusinessHours: true,
    showEmergencyService: false, showServices: true,
    showBrokerFields: false, showCarrierFields: false,
  },
  Factoring: {
    showAddress: true, showCoverageArea: false, showBusinessHours: true,
    showEmergencyService: false, showServices: true,
    showBrokerFields: false, showCarrierFields: false,
  },
  Banking: {
    showAddress: true, showCoverageArea: false, showBusinessHours: true,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: false,
  },
  Accounting: {
    showAddress: true, showCoverageArea: false, showBusinessHours: true,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: false,
  },
  Legal: {
    showAddress: true, showCoverageArea: false, showBusinessHours: true,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: false,
  },
  Software: {
    showAddress: false, showCoverageArea: false, showBusinessHours: true,
    showEmergencyService: false, showServices: true,
    showBrokerFields: false, showCarrierFields: false,
  },
  Internet: {
    showAddress: false, showCoverageArea: false, showBusinessHours: true,
    showEmergencyService: false, showServices: true,
    showBrokerFields: false, showCarrierFields: false,
  },
  "Office Supplier": {
    showAddress: true, showCoverageArea: false, showBusinessHours: true,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: false,
  },
  Other: {
    showAddress: true, showCoverageArea: false, showBusinessHours: false,
    showEmergencyService: false, showServices: false,
    showBrokerFields: false, showCarrierFields: false,
  },
};
