import { AppError, type ErrorKind } from '../../../core/errors/app-error';

/** Codes stables exposés aux clients ; la catégorie décide du statut HTTP. */
const VOLUNTEER_ERROR_KINDS = {
  /** Capacité nulle, négative ou non entière. */
  SLOT_CAPACITY_INVALID: 'VALIDATION',
  /** La fin du créneau n'est pas strictement après son début. */
  SLOT_TIME_RANGE_INVALID: 'VALIDATION',
  /** Nom du bénévole vide, ou fait seulement d'espaces. */
  REGISTRATION_NAME_REQUIRED: 'VALIDATION',
  /** Email du bénévole mal formé. */
  REGISTRATION_EMAIL_INVALID: 'VALIDATION',
  /** Le créneau compte déjà autant d'inscrits que de places. */
  SLOT_FULL: 'CONFLICT',
  /** Aucun créneau n'a cet identifiant. */
  SLOT_NOT_FOUND: 'NOT_FOUND',
} as const satisfies Record<string, ErrorKind>;

export type VolunteerErrorCode = keyof typeof VOLUNTEER_ERROR_KINDS;

export class VolunteerError extends AppError<VolunteerErrorCode> {
  constructor(code: VolunteerErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, VOLUNTEER_ERROR_KINDS[code], message, details);
  }
}

export function slotFull(slotId: string, capacity: number): VolunteerError {
  return new VolunteerError('SLOT_FULL', `Slot ${slotId} is full`, { slotId, capacity });
}

export function slotNotFound(id: string): VolunteerError {
  return new VolunteerError('SLOT_NOT_FOUND', `No slot with id ${id}`, { id });
}
