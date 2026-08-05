import { pgTable, text, timestamp, uuid, integer, numeric, date, boolean, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Carriers ──────────────────────────────────────────────────────────────────
export const carriersTable = pgTable("carriers", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: text("company_name").notNull(),
  carrierType: text("carrier_type"),
  website: text("website"),
  usdotNumber: text("usdot_number"),
  mcNumber: text("mc_number"),
  einNumber: text("ein_number"),
  status: text("status").notNull().default("Active"),
  priority: text("priority"),
  rating: numeric("rating", { precision: 3, scale: 1 }),
  tags: json("tags").$type<string[]>().default([]),
  notes: text("notes"),
  primaryContact: text("primary_contact"),
  phone: text("phone"),
  email: text("email"),
  lastContact: date("last_contact"),
  companyAddress: text("company_address"),
  companyCity: text("company_city"),
  companyState: text("company_state"),
  companyZip: text("company_zip"),
  operatingStates: json("operating_states").$type<string[]>().default([]),
  serviceTypes: json("service_types").$type<string[]>().default([]),
  ratePerMile: numeric("rate_per_mile", { precision: 12, scale: 4 }),
  insuranceExpiration: date("insurance_expiration"),
  authorityStatus: text("authority_status"),
  paymentTerms: text("payment_terms"),
  quickPay: boolean("quick_pay"),
  factoringCompany: text("factoring_company"),
  factoringFee: numeric("factoring_fee", { precision: 12, scale: 4 }),
  bankName: text("bank_name"),
  accountHolder: text("account_holder"),
  accountNumberEncrypted: text("account_number_encrypted"),
  accountNumberLast4: text("account_number_last4"),
  routingNumberEncrypted: text("routing_number_encrypted"),
  routingNumberLast4: text("routing_number_last4"),
  bankAddress: text("bank_address"),
  bankCity: text("bank_city"),
  bankState: text("bank_state"),
  bankZip: text("bank_zip"),
  zelleAccount: text("zelle_account"),
  cashAppAccount: text("cash_app_account"),
  lastLoadDate: date("last_load_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertCarrierSchema = createInsertSchema(carriersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCarrier = z.infer<typeof insertCarrierSchema>;
export type Carrier = typeof carriersTable.$inferSelect;

// ── Carrier Fleet Equipment ───────────────────────────────────────────────────
export const carrierFleetTable = pgTable("carrier_fleet", {
  id: uuid("id").defaultRandom().primaryKey(),
  carrierId: uuid("carrier_id").references(() => carriersTable.id, { onDelete: "cascade" }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  truckYear: text("truck_year"),
  truckMake: text("truck_make"),
  truckModel: text("truck_model"),
  truckVin: text("truck_vin"),
  truckColor: text("truck_color"),
  truckPlateNumber: text("truck_plate_number"),
  trailerYear: text("trailer_year"),
  trailerMake: text("trailer_make"),
  trailerModel: text("trailer_model"),
  trailerVin: text("trailer_vin"),
  trailerColor: text("trailer_color"),
  trailerPlateNumber: text("trailer_plate_number"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  driverEmail: text("driver_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Brokers ───────────────────────────────────────────────────────────────────
export const brokersTable = pgTable("brokers", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: text("company_name").notNull(),
  brokerType: text("broker_type"),
  website: text("website"),
  mcNumber: text("mc_number"),
  usdotNumber: text("usdot_number"),
  primaryContact: text("primary_contact"),
  phone: text("phone"),
  email: text("email"),
  lastContact: date("last_contact"),
  freightTypes: json("freight_types").$type<string[]>().default([]),
  coverage: text("coverage"),
  selectedStates: json("selected_states").$type<string[]>().default([]),
  paymentTerms: text("payment_terms"),
  paymentDays: integer("payment_days"),
  quickPay: boolean("quick_pay"),
  quickPayFee: numeric("quick_pay_fee", { precision: 12, scale: 4 }),
  factoringAccepted: text("factoring_accepted"),
  onboardingStatus: text("onboarding_status"),
  rating: numeric("rating", { precision: 3, scale: 1 }),
  status: text("status").notNull().default("Active"),
  priority: text("priority"),
  tags: json("tags").$type<string[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertBrokerSchema = createInsertSchema(brokersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBroker = z.infer<typeof insertBrokerSchema>;
export type Broker = typeof brokersTable.$inferSelect;

// ── Loads ─────────────────────────────────────────────────────────────────────
export const loadsTable = pgTable("loads", {
  id: uuid("id").defaultRandom().primaryKey(),
  loadId: text("load_id").notNull().unique(),
  carrierId: uuid("carrier_id").references(() => carriersTable.id),
  brokerId: uuid("broker_id").references(() => brokersTable.id),
  status: text("status").notNull().default("New"),
  dispatchDate: date("dispatch_date"),
  pickupName: text("pickup_name"),
  pickupAddress: text("pickup_address"),
  pickupCity: text("pickup_city"),
  pickupState: text("pickup_state"),
  pickupZip: text("pickup_zip"),
  pickupPhone: text("pickup_phone"),
  pickupContactName: text("pickup_contact_name"),
  pickupEmail: text("pickup_email"),
  pickupEstimated: date("pickup_estimated"),
  pickupDeadline: date("pickup_deadline"),
  deliveryName: text("delivery_name"),
  deliveryAddress: text("delivery_address"),
  deliveryCity: text("delivery_city"),
  deliveryState: text("delivery_state"),
  deliveryZip: text("delivery_zip"),
  deliveryPhone: text("delivery_phone"),
  deliveryContactName: text("delivery_contact_name"),
  deliveryEmail: text("delivery_email"),
  deliveryEstimated: date("delivery_estimated"),
  deliveryDeadline: date("delivery_deadline"),
  miles: numeric("miles", { precision: 12, scale: 2 }),
  rate: numeric("rate", { precision: 14, scale: 2 }),
  carrierPay: numeric("carrier_pay", { precision: 14, scale: 2 }),
  fuelSurcharge: numeric("fuel_surcharge", { precision: 14, scale: 2 }),
  ratePerMile: numeric("rate_per_mile", { precision: 12, scale: 4 }),
  freightType: text("freight_type"),
  equipmentType: text("equipment_type"),
  weight: numeric("weight", { precision: 12, scale: 2 }),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status"),
  dispatchInstructions: text("dispatch_instructions"),
  pickupInstructions: text("pickup_instructions"),
  deliveryInstructions: text("delivery_instructions"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertLoadSchema = createInsertSchema(loadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLoad = z.infer<typeof insertLoadSchema>;
export type Load = typeof loadsTable.$inferSelect;

// ── Load Vehicles ─────────────────────────────────────────────────────────────
export const loadVehiclesTable = pgTable("load_vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  loadId: uuid("load_id").references(() => loadsTable.id, { onDelete: "cascade" }).notNull(),
  vehicleNumber: integer("vehicle_number").notNull().default(1),
  year: text("year"),
  make: text("make"),
  model: text("model"),
  type: text("type"),
  color: text("color"),
  plate: text("plate"),
  vin: text("vin"),
  lotNumber: text("lot_number"),
  buyerNumber: text("buyer_number"),
  additionalInfo: text("additional_info"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertLoadVehicleSchema = createInsertSchema(loadVehiclesTable).omit({ id: true, createdAt: true });
export type InsertLoadVehicle = z.infer<typeof insertLoadVehicleSchema>;
export type LoadVehicle = typeof loadVehiclesTable.$inferSelect;

// ── Fleet Equipment (carrier contact, flat-field structure) ───────────────────
export interface FleetEquipment {
  id: string;
  truckYear: string;
  truckMake: string;
  truckModel: string;
  truckVin: string;
  truckColor: string;
  truckPlate: string;
  trailerYear: string;
  trailerMake: string;
  trailerModel: string;
  trailerVin: string;
  trailerColor: string;
  trailerPlate: string;
  assignedDriverId?: string;
  assignedDriverName: string;
  assignedDriverPhoneNumber: string;
  assignedDriverPhoneNumber2: string;
  assignedDriverEmergencyContactName: string;
  assignedDriverEmergencyPhoneNumber: string;
  assignedDriverEmergencyPhoneNumber2: string;
  assignedDriverEmail: string;
}

// ── CRM Contacts ──────────────────────────────────────────────────────────────
export const crmContactsTable = pgTable("crm_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: text("company_name").notNull(),
  contactType: text("contact_type"),
  status: text("status").notNull().default("Active"),
  priority: text("priority"),
  rating: numeric("rating", { precision: 3, scale: 1 }),
  primaryContactName: text("primary_contact_name"),
  primaryPhoneNumber: text("primary_phone_number"),
  primaryPhoneNumber2: text("primary_phone_number_2"),
  email: text("email"),
  website: text("website"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyPhoneNumber: text("emergency_phone_number"),
  emergencyPhoneNumber2: text("emergency_phone_number_2"),
  streetAddress: text("street_address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  coverageArea: text("coverage_area"),
  businessHours: text("business_hours"),
  emergencyService: boolean("emergency_service"),
  services: text("services"),
  brokerType: text("broker_type"),
  mcNumber: text("mc_number"),
  usdotNumber: text("usdot_number"),
  coverage: text("coverage"),
  freightTypes: json("freight_types").$type<string[]>().default([]),
  coverageStates: json("coverage_states").$type<string[]>().default([]),
  paymentTerms: text("payment_terms"),
  paymentDays: integer("payment_days"),
  quickPay: boolean("quick_pay"),
  quickPayFee: numeric("quick_pay_fee", { precision: 12, scale: 4 }),
  factoringAccepted: text("factoring_accepted"),
  factoringConditions: text("factoring_conditions"),
  onboardingStatus: text("onboarding_status"),
  carrierType: text("carrier_type"),
  einNumber: text("ein_number"),
  authorityStatus: text("authority_status"),
  insuranceExpiration: date("insurance_expiration"),
  ratePerMile: numeric("rate_per_mile", { precision: 12, scale: 4 }),
  companyAddress: text("company_address"),
  companyCity: text("company_city"),
  companyState: text("company_state"),
  companyZipCode: text("company_zip_code"),
  factoringCompany: text("factoring_company"),
  factoringFee: numeric("factoring_fee", { precision: 12, scale: 4 }),
  bankName: text("bank_name"),
  accountHolder: text("account_holder"),
  accountNumber: text("account_number"),
  routingNumber: text("routing_number"),
  bankAddress: text("bank_address"),
  bankCity: text("bank_city"),
  bankState: text("bank_state"),
  bankZipCode: text("bank_zip_code"),
  zelleAccount: text("zelle_account"),
  cashAppAccount: text("cash_app_account"),
  operatingStates: json("operating_states").$type<string[]>().default([]),
  areaOfOperation: text("area_of_operation"),
  serviceTypes: json("service_types").$type<string[]>().default([]),
  weeklyMinimumAmount: numeric("weekly_minimum_amount", { precision: 14, scale: 2 }),
  totalTripsPerWeek: integer("total_trips_per_week"),
  lastLoad: date("last_load"),
  fleetEquipment: json("fleet_equipment").$type<FleetEquipment[]>().default([]),
  lastContact: date("last_contact"),
  tags: json("tags").$type<string[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// ── Drivers ───────────────────────────────────────────────────────────────────
export const driversTable = pgTable("drivers", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  status: text("status").notNull().default("Active"),
  dateOfBirth: date("date_of_birth"),
  phoneNumber: text("phone_number"),
  phoneNumber2: text("phone_number_2"),
  email: text("email"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyPhoneNumber: text("emergency_phone_number"),
  emergencyPhoneNumber2: text("emergency_phone_number_2"),
  streetAddress: text("street_address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  hireDate: date("hire_date"),
  driverType: text("driver_type"),
  employmentType: text("employment_type"),
  yearsOfExperience: integer("years_of_experience"),
  assignedEquipmentId: uuid("assigned_equipment_id"),
  driverLicenseNumber: text("driver_license_number"),
  driverLicenseState: text("driver_license_state"),
  driverLicenseClass: text("driver_license_class"),
  driverLicenseExpiration: date("driver_license_expiration"),
  cdlNumber: text("cdl_number"),
  cdlState: text("cdl_state"),
  cdlClass: text("cdl_class"),
  cdlExpiration: date("cdl_expiration"),
  cdlEndorsements: json("cdl_endorsements").$type<string[]>().default([]),
  cdlRestrictions: text("cdl_restrictions"),
  hazmatEndorsement: boolean("hazmat_endorsement").default(false),
  hazmatEndorsementExpiration: date("hazmat_endorsement_expiration"),
  medicalExaminerCertificateNumber: text("medical_examiner_certificate_number"),
  medicalCardIssueDate: date("medical_card_issue_date"),
  medicalCardExpiration: date("medical_card_expiration"),
  medicalExaminerName: text("medical_examiner_name"),
  nationalRegistryNumber: text("national_registry_number"),
  twicCardNumber: text("twic_card_number"),
  twicCardExpiration: date("twic_card_expiration"),
  driverQualificationFileStatus: text("driver_qualification_file_status"),
  mvrCheckDate: date("mvr_check_date"),
  mvrNextReviewDate: date("mvr_next_review_date"),
  mvrStatus: text("mvr_status"),
  backgroundCheckDate: date("background_check_date"),
  backgroundCheckStatus: text("background_check_status"),
  drugTestDate: date("drug_test_date"),
  drugTestResult: text("drug_test_result"),
  alcoholTestDate: date("alcohol_test_date"),
  alcoholTestResult: text("alcohol_test_result"),
  clearinghouseStatus: text("clearinghouse_status"),
  clearinghouseLastQueryDate: date("clearinghouse_last_query_date"),
  clearinghouseNextQueryDate: date("clearinghouse_next_query_date"),
  complianceStatus: text("compliance_status"),
  accidentHistory: text("accident_history"),
  violationHistory: text("violation_history"),
  assignedCarrierId: uuid("assigned_carrier_id"),
  assignedTruckId: uuid("assigned_truck_id"),
  assignedTrailerId: uuid("assigned_trailer_id"),
  lastLoad: date("last_load"),
  totalLoads: integer("total_loads").default(0),
  lastAssignmentDate: date("last_assignment_date"),
  notes: text("notes"),
  tags: json("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertCrmContactSchema = createInsertSchema(crmContactsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCrmContact = z.infer<typeof insertCrmContactSchema>;
export type CrmContact = typeof crmContactsTable.$inferSelect;

// ── CRM Leads ─────────────────────────────────────────────────────────────────
export const crmLeadsTable = pgTable("crm_leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: text("company_name").notNull(),
  leadType: text("lead_type"),
  primaryContact: text("primary_contact"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  streetAddress: text("street_address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  brokerType: text("broker_type"),
  mcNumber: text("mc_number"),
  usdotNumber: text("usdot_number"),
  coverage: text("coverage"),
  freightTypes: text("freight_types"),
  selectedStates: text("selected_states"),
  serviceTypes: json("service_types").$type<string[]>().default([]),
  operatingStates: json("operating_states").$type<string[]>().default([]),
  estimatedWeeklyLoads: integer("estimated_weekly_loads"),
  estimatedWeeklyRevenue: numeric("estimated_weekly_revenue", { precision: 14, scale: 2 }),
  leadSource: text("lead_source"),
  pipelineStage: text("pipeline_stage").notNull().default("New Lead"),
  priority: text("priority"),
  rating: numeric("rating", { precision: 3, scale: 1 }),
  status: text("status").notNull().default("Active"),
  nextFollowUpDate: date("next_follow_up_date"),
  nextFollowUpTime: text("next_follow_up_time"),
  followUpNotes: text("follow_up_notes"),
  lastContact: date("last_contact"),
  convertedCarrierId: uuid("converted_carrier_id").references(() => carriersTable.id),
  convertedEntityType: text("converted_entity_type"),
  convertedEntityId: uuid("converted_entity_id"),
  tags: json("tags").$type<string[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertCrmLeadSchema = createInsertSchema(crmLeadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCrmLead = z.infer<typeof insertCrmLeadSchema>;
export type CrmLead = typeof crmLeadsTable.$inferSelect;

export const crmLeadFleetTable = pgTable("crm_lead_fleet", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => crmLeadsTable.id, { onDelete: "cascade" }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  truckYear: text("truck_year"),
  truckMake: text("truck_make"),
  truckModel: text("truck_model"),
  truckVin: text("truck_vin"),
  truckColor: text("truck_color"),
  truckPlateNumber: text("truck_plate_number"),
  trailerYear: text("trailer_year"),
  trailerMake: text("trailer_make"),
  trailerModel: text("trailer_model"),
  trailerVin: text("trailer_vin"),
  trailerColor: text("trailer_color"),
  trailerPlateNumber: text("trailer_plate_number"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  driverEmail: text("driver_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertCrmLeadFleetSchema = createInsertSchema(crmLeadFleetTable).omit({ id: true, createdAt: true });
export type InsertCrmLeadFleet = z.infer<typeof insertCrmLeadFleetSchema>;
export type CrmLeadFleet = typeof crmLeadFleetTable.$inferSelect;

// ── Invoices ──────────────────────────────────────────────────────────────────
export const invoicesTable = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  carrierId: uuid("carrier_id").references(() => carriersTable.id),
  driverName: text("driver_name"),
  issueDate: date("issue_date"),
  dueDate: date("due_date"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("Pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;

export const invoiceLoadsTable = pgTable("invoice_loads", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoicesTable.id).notNull(),
  loadId: uuid("load_id").references(() => loadsTable.id).notNull(),
});

export const invoicePaymentsTable = pgTable("invoice_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoicesTable.id).notNull(),
  paymentDate: date("payment_date").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertInvoicePaymentSchema = createInsertSchema(invoicePaymentsTable).omit({ id: true, createdAt: true });
export type InsertInvoicePayment = z.infer<typeof insertInvoicePaymentSchema>;
export type InvoicePayment = typeof invoicePaymentsTable.$inferSelect;

// ── Transactions ──────────────────────────────────────────────────────────────
export const transactionsTable = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  date: date("date"),
  dueDate: date("due_date"),
  type: text("type").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  carrierId: uuid("carrier_id").references(() => carriersTable.id),
  invoiceId: uuid("invoice_id").references(() => invoicesTable.id),
  paymentMethod: text("payment_method"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull().default("Pending"),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;

// ── Company Profile (singleton) ───────────────────────────────────────────────
export const companyProfileTable = pgTable("company_profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: text("company_name"),
  legalCompanyName: text("legal_company_name"),
  dbaName: text("dba_name"),
  einNumber: text("ein_number"),
  mcNumber: text("mc_number"),
  usdotNumber: text("usdot_number"),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  website: text("website"),
  streetAddress: text("street_address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("USA"),
  businessHours: text("business_hours"),
  logoUrl: text("logo_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertCompanyProfileSchema = createInsertSchema(companyProfileTable).omit({ id: true });
export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;
export type CompanyProfile = typeof companyProfileTable.$inferSelect;

// ── Audit Log ─────────────────────────────────────────────────────────────────
export const auditLogTable = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: text("action").notNull(),
  description: text("description"),
  source: text("source"),
  actor: text("actor").default("Owner"),
  approximateIp: text("approximate_ip"),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});