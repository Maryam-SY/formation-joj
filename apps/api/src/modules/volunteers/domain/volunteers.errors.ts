import { AppError, type ErrorKind } from '../../../core/errors/app-error';

/** Codes stables exposés aux clients ; la catégorie décide du statut HTTP. */
const VOLUNTEER_ERROR_KINDS = {
  /** Capacité nulle, négative ou non entière. */
  SLOT_CAPACITY_INVALID: 'VALIDATION',
  /** La fin du créneau n'est pas strictement après son début. */
  SLOT_TIME_RANGE_INVALID: 'VALIDATION',
} as const satisfies Record<string, ErrorKind>;

export type VolunteerErrorCode = keyof typeof VOLUNTEER_ERROR_KINDS;

export class VolunteerError extends AppError<VolunteerErrorCode> {
  constructor(code: VolunteerErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, VOLUNTEER_ERROR_KINDS[code], message, details);
  }
}
