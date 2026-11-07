import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type DatabaseConnection, openDatabase } from '../../../core/database/database';
import { Discipline } from '../../disciplines/domain/discipline';
import { DrizzleDisciplineRepository } from '../../disciplines/infra/drizzle-discipline.repository';
import { Registration } from '../domain/registration';
import { Slot } from '../domain/slot';
import { DrizzleSlotRepository } from './drizzle-slot.repository';

const NOW = new Date('2026-10-31T09:00:00.123Z');

describe('DrizzleSlotRepository (in-memory PGlite, migrations applied)', () => {
  let connection: DatabaseConnection;
  let repository: DrizzleSlotRepository;
  let disciplineId: string;

  const newSlot = (capacity: number) =>
    Slot.create({
      id: randomUUID(),
      disciplineId,
      startsAt: new Date('2026-11-02T09:00:00.000Z'),
      endsAt: new Date('2026-11-02T12:00:00.000Z'),
      capacity,
      now: NOW,
    });

  const newRegistration = (slot: Slot, email: string) =>
    Registration.create({ id: randomUUID(), slotId: slot.id, name: 'Bénévole', email, now: NOW });

  beforeAll(async () => {
    connection = openDatabase({ pgliteDataDir: 'memory://' });
    await connection.migrate();
    repository = new DrizzleSlotRepository(connection.db);
    const lutte = Discipline.create({
      id: randomUUID(),
      name: 'Lutte',
      category: 'sports-de-combat',
      now: NOW,
    });
    await new DrizzleDisciplineRepository(connection.db).insert(lutte);
    disciplineId = lutte.id;
  });

  afterAll(() => connection?.close());

  it('001-AS1: reads back exactly the slot it wrote', async () => {
    const slot = newSlot(2);
    await repository.insert(slot);

    expect(await repository.findById(slot.id)).toEqual(slot);
    expect(await repository.findById(randomUUID())).toBeNull();
  });

  it('001-AS4: stores a registration and the new registered count', async () => {
    const slot = newSlot(2);
    await repository.insert(slot);
    slot.register();

    await repository.addRegistration(slot, newRegistration(slot, 'awa@example.sn'));

    expect((await repository.findById(slot.id))?.registeredCount).toBe(1);
  });

  it('001-AS6: lets only one of two concurrent registrations take the last place', async () => {
    const slot = newSlot(1);
    await repository.insert(slot);
    // Deux bénévoles ont lu le créneau avant que l'un d'eux ne s'inscrive : chacun voit une place.
    const [seenByAwa, seenByModou] = await Promise.all([
      repository.findById(slot.id),
      repository.findById(slot.id),
    ]);
    if (!seenByAwa || !seenByModou) throw new Error('slot not stored');
    seenByAwa.register();
    seenByModou.register();

    const results = await Promise.allSettled([
      repository.addRegistration(seenByAwa, newRegistration(slot, 'awa@example.sn')),
      repository.addRegistration(seenByModou, newRegistration(slot, 'modou@example.sn')),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({
      reason: expect.objectContaining({ code: 'SLOT_FULL', kind: 'CONFLICT' }),
    });
    expect((await repository.findById(slot.id))?.registeredCount).toBe(1);
  });
});
