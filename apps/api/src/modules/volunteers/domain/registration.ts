import { VolunteerError } from './volunteers.errors';

export interface RegistrationProps {
  id: string;
  slotId: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface NewRegistration {
  id: string;
  slotId: string;
  /** Revérifiés ici : le domaine ne fait pas confiance à la validation HTTP. */
  name: string;
  email: string;
  now: Date;
}

/** Forme minimale d'un email : une partie locale, un @, un domaine avec un point, sans espace. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** L'inscription d'un bénévole, identifié par son nom et son email, sur un créneau. */
export class Registration {
  private constructor(private readonly props: RegistrationProps) {}

  static create({ id, slotId, name, email, now }: NewRegistration): Registration {
    return new Registration({
      id,
      slotId,
      name: validName(name),
      email: validEmail(email),
      createdAt: now,
    });
  }

  /** Reconstruit une inscription depuis la persistance, sans rejouer les règles de création. */
  static restore(props: RegistrationProps): Registration {
    return new Registration({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get slotId(): string {
    return this.props.slotId;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

function validName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new VolunteerError('REGISTRATION_NAME_REQUIRED', 'A volunteer needs a name');
  }
  return trimmed;
}

function validEmail(email: string): string {
  const trimmed = email.trim();
  if (!EMAIL_SHAPE.test(trimmed)) {
    throw new VolunteerError('REGISTRATION_EMAIL_INVALID', 'A volunteer needs a valid email', {
      email: trimmed,
    });
  }
  return trimmed;
}
