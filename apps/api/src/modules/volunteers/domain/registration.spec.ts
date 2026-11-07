import { describe, expect, it } from 'vitest';
import { Registration } from './registration';

const NOW = new Date('2026-10-31T09:00:00.000Z');
const ID = '0199f5c2-0000-7000-8000-000000000201';
const SLOT_ID = '0199f5c2-0000-7000-8000-000000000101';

const newRegistration = (name: string, email: string) =>
  Registration.create({ id: ID, slotId: SLOT_ID, name, email, now: NOW });

describe('Registration', () => {
  it('001-AS5: keeps a trimmed name and email when both are valid', () => {
    expect(newRegistration('  Awa Diop  ', ' awa@example.sn ')).toMatchObject({
      id: ID,
      slotId: SLOT_ID,
      name: 'Awa Diop',
      email: 'awa@example.sn',
      createdAt: NOW,
    });
  });

  it.each(['', '   '])('001-AS5: rejects an empty name (%j)', (name) => {
    expect(() => newRegistration(name, 'awa@example.sn')).toThrow(
      expect.objectContaining({ code: 'REGISTRATION_NAME_REQUIRED', kind: 'VALIDATION' }),
    );
  });

  it.each(['', 'awa', 'awa@', '@example.sn', 'awa@example', 'awa diop@example.sn'])(
    '001-AS5: rejects a malformed email (%j)',
    (email) => {
      expect(() => newRegistration('Awa Diop', email)).toThrow(
        expect.objectContaining({ code: 'REGISTRATION_EMAIL_INVALID', kind: 'VALIDATION' }),
      );
    },
  );
});
