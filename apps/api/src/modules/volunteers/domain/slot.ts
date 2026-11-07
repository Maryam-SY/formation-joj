import { slotFull, VolunteerError } from './volunteers.errors';

export interface SlotProps {
  id: string;
  disciplineId: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  registeredCount: number;
  createdAt: Date;
}

export interface NewSlot {
  id: string;
  disciplineId: string;
  startsAt: Date;
  endsAt: Date;
  /** Revérifiée ici : le domaine ne fait pas confiance à la validation HTTP. */
  capacity: number;
  now: Date;
}

/**
 * Un créneau d'accueil d'une discipline : une plage horaire et une capacité, le nombre maximal de
 * bénévoles inscrits. Il tient lui-même son nombre d'inscrits pour ne jamais déborder.
 */
export class Slot {
  private constructor(private props: SlotProps) {}

  static create({ id, disciplineId, startsAt, endsAt, capacity, now }: NewSlot): Slot {
    return new Slot({
      id,
      disciplineId,
      ...validTimeRange(startsAt, endsAt),
      capacity: validCapacity(capacity),
      registeredCount: 0,
      createdAt: now,
    });
  }

  /** Reconstruit un créneau depuis la persistance, sans rejouer les règles de création. */
  static restore(props: SlotProps): Slot {
    return new Slot({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get disciplineId(): string {
    return this.props.disciplineId;
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get endsAt(): Date {
    return this.props.endsAt;
  }

  get capacity(): number {
    return this.props.capacity;
  }

  get registeredCount(): number {
    return this.props.registeredCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Occupe une place. Vérifié ici pour un message clair ; le repository le garantit aussi quand
   * deux bénévoles visent la dernière place au même moment.
   */
  register(): void {
    if (this.props.registeredCount >= this.props.capacity) {
      throw slotFull(this.props.id, this.props.capacity);
    }
    this.props = { ...this.props, registeredCount: this.props.registeredCount + 1 };
  }
}

function validCapacity(capacity: number): number {
  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new VolunteerError(
      'SLOT_CAPACITY_INVALID',
      'A slot capacity is a positive whole number',
      { capacity },
    );
  }
  return capacity;
}

function validTimeRange(startsAt: Date, endsAt: Date): { startsAt: Date; endsAt: Date } {
  if (!(endsAt.getTime() > startsAt.getTime())) {
    throw new VolunteerError('SLOT_TIME_RANGE_INVALID', 'A slot must end after it starts', {
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
  }
  return { startsAt, endsAt };
}
