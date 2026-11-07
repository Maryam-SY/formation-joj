import { describe, expect, it } from 'vitest';
import { InMemoryDisciplineRepository } from '../../disciplines/application/testing/in-memory-discipline.repository';
import { Discipline } from '../../disciplines/domain/discipline';
import { InMemorySlotRepository } from './testing/in-memory-slot.repository';
import { OpenSlot } from './use-cases/open-slot';
import { RegisterVolunteer } from './use-cases/register-volunteer';

const UNKNOWN_ID = '0199f5c2-0000-7000-8000-00000000ffff';
const MORNING = { startsAt: '2026-11-02T09:00:00.000Z', endsAt: '2026-11-02T12:00:00.000Z' };
const AWA = { name: 'Awa Diop', email: 'awa@example.sn' };
const MODOU = { name: 'Modou Fall', email: 'modou@example.sn' };

async function setup() {
  const disciplines = new InMemoryDisciplineRepository();
  const lutte = Discipline.create({
    id: '0199f5c2-0000-7000-8000-000000000001',
    name: 'Lutte',
    category: 'sports-de-combat',
    now: new Date(),
  });
  await disciplines.insert(lutte);
  const slots = new InMemorySlotRepository();
  return {
    lutte,
    slots,
    openSlot: new OpenSlot(disciplines, slots),
    registerVolunteer: new RegisterVolunteer(slots),
  };
}

describe('volunteers (application layer)', () => {
  it('001-AS1: opens a slot with no registration', async () => {
    const { lutte, slots, openSlot } = await setup();

    const slot = await openSlot.execute({ disciplineId: lutte.id, ...MORNING, capacity: 2 });

    expect(slot).toMatchObject({
      disciplineId: lutte.id,
      startsAt: new Date(MORNING.startsAt),
      endsAt: new Date(MORNING.endsAt),
      capacity: 2,
      registeredCount: 0,
    });
    expect(slot.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await slots.findById(slot.id)).toEqual(slot);
  });

  it('001-AS3: refuses a slot for an unknown discipline, and stores nothing', async () => {
    const { slots, openSlot } = await setup();

    await expect(
      openSlot.execute({ disciplineId: UNKNOWN_ID, ...MORNING, capacity: 2 }),
    ).rejects.toMatchObject({ code: 'DISCIPLINE_NOT_FOUND', kind: 'NOT_FOUND' });
    expect(slots.size).toBe(0);
  });

  it('001-AS4: registers a volunteer on a slot that has a place left', async () => {
    const { lutte, slots, openSlot, registerVolunteer } = await setup();
    const { id } = await openSlot.execute({ disciplineId: lutte.id, ...MORNING, capacity: 2 });
    await registerVolunteer.execute(id, AWA);

    const slot = await registerVolunteer.execute(id, MODOU);

    expect(slot.registeredCount).toBe(2);
    expect((await slots.findById(id))?.registeredCount).toBe(2);
    expect(slots.registrationsOf(id).map(({ email }) => email)).toEqual([AWA.email, MODOU.email]);
  });

  it('001-AS7: refuses a registration on an unknown slot', async () => {
    const { registerVolunteer } = await setup();

    await expect(registerVolunteer.execute(UNKNOWN_ID, AWA)).rejects.toMatchObject({
      code: 'SLOT_NOT_FOUND',
      kind: 'NOT_FOUND',
    });
  });
});
