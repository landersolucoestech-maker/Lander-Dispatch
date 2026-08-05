CREATE TABLE IF NOT EXISTS "carrier_contact_details" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "carrier_id" uuid NOT NULL,
  "phone_2" text,
  "emergency_contact_name" text,
  "emergency_phone" text,
  "emergency_phone_2" text,
  "weekly_minimum_amount" numeric(14, 2),
  "total_trips_per_week" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone,
  CONSTRAINT "carrier_contact_details_carrier_id_carriers_id_fk"
    FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id")
    ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "carrier_contact_details_carrier_id_unique"
  ON "carrier_contact_details" USING btree ("carrier_id");

CREATE TABLE IF NOT EXISTS "carrier_fleet_driver_details" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "fleet_id" uuid NOT NULL,
  "phone_2" text,
  "emergency_contact_name" text,
  "emergency_phone" text,
  "emergency_phone_2" text,
  "license_type" text,
  "cdl_number" text,
  "twic_card" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone,
  CONSTRAINT "carrier_fleet_driver_details_fleet_id_carrier_fleet_id_fk"
    FOREIGN KEY ("fleet_id") REFERENCES "public"."carrier_fleet"("id")
    ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "carrier_fleet_driver_details_fleet_id_unique"
  ON "carrier_fleet_driver_details" USING btree ("fleet_id");
