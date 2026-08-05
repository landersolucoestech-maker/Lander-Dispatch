import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { carrierFleetTable, carriersTable } from "./lander";

export const carrierContactDetailsTable = pgTable(
  "carrier_contact_details",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    carrierId: uuid("carrier_id")
      .notNull()
      .references(() => carriersTable.id, { onDelete: "cascade" }),
    phone2: text("phone_2"),
    emergencyContactName: text("emergency_contact_name"),
    emergencyPhone: text("emergency_phone"),
    emergencyPhone2: text("emergency_phone_2"),
    weeklyMinimumAmount: numeric("weekly_minimum_amount", {
      precision: 14,
      scale: 2,
    }),
    totalTripsPerWeek: integer("total_trips_per_week"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("carrier_contact_details_carrier_id_unique").on(table.carrierId),
  ],
);

export const carrierFleetDriverDetailsTable = pgTable(
  "carrier_fleet_driver_details",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fleetId: uuid("fleet_id")
      .notNull()
      .references(() => carrierFleetTable.id, { onDelete: "cascade" }),
    phone2: text("phone_2"),
    emergencyContactName: text("emergency_contact_name"),
    emergencyPhone: text("emergency_phone"),
    emergencyPhone2: text("emergency_phone_2"),
    licenseType: text("license_type"),
    cdlNumber: text("cdl_number"),
    twicCard: boolean("twic_card").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("carrier_fleet_driver_details_fleet_id_unique").on(table.fleetId),
  ],
);

export type CarrierContactDetails =
  typeof carrierContactDetailsTable.$inferSelect;
export type CarrierFleetDriverDetails =
  typeof carrierFleetDriverDetailsTable.$inferSelect;
