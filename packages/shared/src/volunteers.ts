import { z } from 'zod';

/** Taille de la colonne : au-delà, le nom d'un bénévole est refusé. */
export const VOLUNTEER_NAME_MAX_LENGTH = 100;
/** Longueur maximale d'une adresse email (RFC 5321). */
export const VOLUNTEER_EMAIL_MAX_LENGTH = 254;

/** Corps de `POST /api/slots` : un créneau d'accueil d'une discipline, avec sa capacité. */
export const openSlotSchema = z
  .object({
    disciplineId: z.uuid(),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    capacity: z.int().positive(),
  })
  .refine((input) => Date.parse(input.endsAt) > Date.parse(input.startsAt), {
    message: 'A slot must end after it starts',
    path: ['endsAt'],
  });
export type OpenSlotInput = z.infer<typeof openSlotSchema>;

/** Corps de `POST /api/slots/:id/registrations` : le bénévole qui s'inscrit. */
export const registerVolunteerSchema = z.object({
  name: z.string().trim().min(1).max(VOLUNTEER_NAME_MAX_LENGTH),
  email: z.email().max(VOLUNTEER_EMAIL_MAX_LENGTH),
});
export type RegisterVolunteerInput = z.infer<typeof registerVolunteerSchema>;

/** Paramètre `:id` des routes d'un créneau. */
export const slotIdParamsSchema = z.object({ id: z.uuid() });

/** Un créneau tel que l'API le renvoie, avec son nombre d'inscrits. */
export const slotSchema = z.object({
  id: z.uuid(),
  disciplineId: z.uuid(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  capacity: z.int().positive(),
  registeredCount: z.int().nonnegative(),
  createdAt: z.iso.datetime(),
});
export type SlotResponse = z.infer<typeof slotSchema>;
