import type { INestApplication } from '@nestjs/common';
import { disciplineSchema, slotSchema } from '@joj/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-test-app';

const UNKNOWN_ID = '0199f5c2-0000-7000-8000-00000000ffff';
const MORNING = { startsAt: '2026-11-02T09:00:00.000Z', endsAt: '2026-11-02T12:00:00.000Z' };
const volunteer = (n: number) => ({ name: `Bénévole ${n}`, email: `benevole${n}@example.sn` });

describe('/api/slots (e2e)', () => {
  let app: INestApplication;
  let disciplineId: string;
  const api = () => request(app.getHttpServer());

  /** Ouvre un créneau de la discipline de test, et renvoie son identifiant. */
  const openSlot = async (capacity: number): Promise<string> => {
    const response = await api()
      .post('/api/slots')
      .send({ disciplineId, ...MORNING, capacity })
      .expect(201);
    return slotSchema.parse(response.body).id;
  };

  beforeAll(async () => {
    app = await createTestApp();
    const response = await api()
      .post('/api/disciplines')
      .send({ name: 'Lutte', category: 'sports-de-combat' })
      .expect(201);
    disciplineId = disciplineSchema.parse(response.body).id;
  });

  afterAll(() => app?.close());

  it('001-AS1: opens a slot (201) with its discipline, times, capacity and no registration', async () => {
    const response = await api()
      .post('/api/slots')
      .send({ disciplineId, ...MORNING, capacity: 2 })
      .expect(201);

    expect(slotSchema.parse(response.body)).toMatchObject({
      disciplineId,
      ...MORNING,
      capacity: 2,
      registeredCount: 0,
    });
  });

  it.each([
    ['a zero capacity', { capacity: 0 }, 'capacity'],
    ['a negative capacity', { capacity: -1 }, 'capacity'],
    ['a fractional capacity', { capacity: 1.5 }, 'capacity'],
    ['an end before the start', { endsAt: '2026-11-02T08:00:00.000Z' }, 'endsAt'],
  ])('001-AS2: rejects a slot with %s (400)', async (_label, change, path) => {
    const response = await api()
      .post('/api/slots')
      .send({ disciplineId, ...MORNING, capacity: 2, ...change })
      .expect(400);

    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path })]);
  });

  it('001-AS3: rejects a slot for an unknown discipline (404)', async () => {
    const response = await api()
      .post('/api/slots')
      .send({ disciplineId: UNKNOWN_ID, ...MORNING, capacity: 2 })
      .expect(404);

    expect(response.body).toMatchObject({ status: 404, code: 'DISCIPLINE_NOT_FOUND' });
  });

  it('001-AS4: registers a volunteer (201) and returns the slot with its new count', async () => {
    const slotId = await openSlot(2);
    await api().post(`/api/slots/${slotId}/registrations`).send(volunteer(1)).expect(201);

    const response = await api()
      .post(`/api/slots/${slotId}/registrations`)
      .send(volunteer(2))
      .expect(201);

    expect(slotSchema.parse(response.body)).toMatchObject({
      id: slotId,
      capacity: 2,
      registeredCount: 2,
    });
  });

  it.each([
    ['an empty name', { name: '  ', email: 'awa@example.sn' }, 'name'],
    ['a malformed email', { name: 'Awa Diop', email: 'awa@' }, 'email'],
  ])('001-AS5: rejects a registration with %s (400), count unchanged', async (_l, body, path) => {
    const slotId = await openSlot(2);

    const response = await api().post(`/api/slots/${slotId}/registrations`).send(body).expect(400);

    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path })]);
    const next = await api()
      .post(`/api/slots/${slotId}/registrations`)
      .send(volunteer(1))
      .expect(201);
    expect(slotSchema.parse(next.body).registeredCount).toBe(1);
  });

  it('001-AS6: accepts two volunteers on a slot of capacity 2 and refuses the third (409)', async () => {
    const slotId = await openSlot(2);
    await api().post(`/api/slots/${slotId}/registrations`).send(volunteer(1)).expect(201);
    await api().post(`/api/slots/${slotId}/registrations`).send(volunteer(2)).expect(201);

    const response = await api()
      .post(`/api/slots/${slotId}/registrations`)
      .send(volunteer(3))
      .expect(409);

    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({
      status: 409,
      code: 'SLOT_FULL',
      details: { slotId, capacity: 2 },
    });
  });

  it('001-AS7: rejects a registration on an unknown slot (404)', async () => {
    const response = await api()
      .post(`/api/slots/${UNKNOWN_ID}/registrations`)
      .send(volunteer(1))
      .expect(404);

    expect(response.body).toMatchObject({ status: 404, code: 'SLOT_NOT_FOUND' });
  });
});
