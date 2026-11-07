import { Inject, Injectable } from '@nestjs/common';
import { and, eq, lt, sql } from 'drizzle-orm';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { SlotRepository } from '../application/slot.repository';
import type { Registration } from '../domain/registration';
import type { Slot } from '../domain/slot';
import { slotFull } from '../domain/volunteers.errors';
import { toDomain, toRegistrationRow, toRow } from './slot.mapper';
import { registrations, slots } from './volunteers.schema';

@Injectable()
export class DrizzleSlotRepository extends SlotRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async findById(id: string): Promise<Slot | null> {
    const [row] = await this.db.select().from(slots).where(eq(slots.id, id)).limit(1);
    return row ? toDomain(row) : null;
  }

  async insert(slot: Slot): Promise<void> {
    await this.db.insert(slots).values(toRow(slot));
  }

  /**
   * On n'écrit pas le compte reçu : on l'incrémente en base, seulement s'il reste une place. La
   * ligne du créneau est verrouillée le temps de la transaction, donc deux inscriptions sur la
   * dernière place passent l'une après l'autre, et la seconde ne trouve plus de place.
   */
  async addRegistration(slot: Slot, registration: Registration): Promise<void> {
    await this.db.transaction(async (tx) => {
      const taken = await tx
        .update(slots)
        .set({ registeredCount: sql`${slots.registeredCount} + 1` })
        .where(and(eq(slots.id, slot.id), lt(slots.registeredCount, slots.capacity)))
        .returning({ id: slots.id });
      if (taken.length === 0) throw slotFull(slot.id, slot.capacity);
      await tx.insert(registrations).values(toRegistrationRow(registration));
    });
  }
}
