import { describe, expect, it } from 'vitest';
import { Slot } from './slot';

const NOW = new Date('2026-10-31T09:00:00.000Z');
const ID = '0199f5c2-0000-7000-8000-000000000101';
const DISCIPLINE_ID = '0199f5c2-0000-7000-8000-000000000001';
const STARTS_AT = new Date('2026-11-02T09:00:00.000Z');
const ENDS_AT = new Date('2026-11-02T12:00:00.000Z');

const newSlot = (overrides: Partial<Parameters<typeof Slot.create>[0]> = {}) =>
  Slot.create({
    id: ID,
    disciplineId: DISCIPLINE_ID,
    startsAt: STARTS_AT,
    endsAt: ENDS_AT,
    capacity: 2,
    now: NOW,
    ...overrides,
  });

describe('Slot', () => {
  it.each([0, -1, 1.5, Number.NaN])('001-AS2: rejects an invalid capacity (%s)', (capacity) => {
    expect(() => newSlot({ capacity })).toThrow(
      expect.objectContaining({ code: 'SLOT_CAPACITY_INVALID', kind: 'VALIDATION' }),
    );
  });

  it.each([
    ['ends before it starts', new Date('2026-11-02T08:00:00.000Z')],
    ['ends when it starts', STARTS_AT],
  ])('001-AS2: rejects a slot that %s', (_label, endsAt) => {
    expect(() => newSlot({ endsAt })).toThrow(
      expect.objectContaining({ code: 'SLOT_TIME_RANGE_INVALID', kind: 'VALIDATION' }),
    );
  });

  it('001-AS2: accepts the smallest valid capacity, with no registration yet', () => {
    expect(newSlot({ capacity: 1 })).toMatchObject({
      id: ID,
      disciplineId: DISCIPLINE_ID,
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      capacity: 1,
      registeredCount: 0,
      createdAt: NOW,
    });
  });

  it('001-AS2: restores a slot from storage without replaying the rules', () => {
    const slot = Slot.restore({
      id: ID,
      disciplineId: DISCIPLINE_ID,
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      capacity: 2,
      registeredCount: 2,
      createdAt: NOW,
    });
    expect(slot.registeredCount).toBe(2);
  });

  it('001-AS6: refuses a registration on a full slot', () => {
    const slot = newSlot({ capacity: 2 });
    slot.register();
    slot.register();
    expect(slot.registeredCount).toBe(2);

    expect(() => slot.register()).toThrow(
      expect.objectContaining({ code: 'SLOT_FULL', kind: 'CONFLICT' }),
    );
    expect(slot.registeredCount).toBe(2);
  });
});
