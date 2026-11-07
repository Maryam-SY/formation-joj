CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slot_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(254) NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"discipline_id" uuid NOT NULL,
	"starts_at" timestamp (3) with time zone NOT NULL,
	"ends_at" timestamp (3) with time zone NOT NULL,
	"capacity" integer NOT NULL,
	"registered_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL,
	CONSTRAINT "slots_capacity_positive" CHECK ("slots"."capacity" > 0),
	CONSTRAINT "slots_time_range" CHECK ("slots"."ends_at" > "slots"."starts_at"),
	CONSTRAINT "slots_not_overbooked" CHECK ("slots"."registered_count" >= 0 AND "slots"."registered_count" <= "slots"."capacity")
);
--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_slot_id_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_discipline_id_disciplines_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."disciplines"("id") ON DELETE cascade ON UPDATE no action;