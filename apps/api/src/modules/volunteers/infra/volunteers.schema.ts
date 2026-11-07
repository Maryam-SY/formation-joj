// Lu par drizzle-kit pour générer les migrations : ce fichier n'importe que drizzle-orm.
import { sql } from 'drizzle-orm';
import { check, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { disciplines } from '../../disciplines/infra/disciplines.schema';

export const slots = pgTable(
  'slots',
  {
    id: uuid('id').primaryKey(),
    // Un créneau appartient à une discipline existante ; supprimer la discipline supprime ses créneaux.
    disciplineId: uuid('discipline_id')
      .notNull()
      .references(() => disciplines.id, { onDelete: 'cascade' }),
    // Précision milliseconde = celle de Date en JavaScript.
    startsAt: timestamp('starts_at', { withTimezone: true, precision: 3 }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true, precision: 3 }).notNull(),
    capacity: integer('capacity').notNull(),
    registeredCount: integer('registered_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
  },
  (table) => [
    check('slots_capacity_positive', sql`${table.capacity} > 0`),
    check('slots_time_range', sql`${table.endsAt} > ${table.startsAt}`),
    // Dernier rempart contre le débordement, même si deux inscriptions arrivent ensemble.
    check(
      'slots_not_overbooked',
      sql`${table.registeredCount} >= 0 AND ${table.registeredCount} <= ${table.capacity}`,
    ),
  ],
);

export const registrations = pgTable('registrations', {
  id: uuid('id').primaryKey(),
  slotId: uuid('slot_id')
    .notNull()
    .references(() => slots.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 254 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
});

export type SlotRow = typeof slots.$inferSelect;
export type RegistrationRow = typeof registrations.$inferSelect;
