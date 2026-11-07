import { Registration } from '../../domain/registration';
import { Slot } from '../../domain/slot';
import { SlotRepository } from '../slot.repository';

/** Fake fidèle au contrat du port (jamais plus d'inscrits que de places), pour tester sans base. */
export class InMemorySlotRepository extends SlotRepository {
  private readonly slots = new Map<string, Slot>();
  private readonly registrations: Registration[] = [];

  /** Nombre de créneaux stockés : pour vérifier qu'un refus n'a rien enregistré. */
  get size(): number {
    return this.slots.size;
  }

  /** Inscriptions d'un créneau, dans l'ordre d'arrivée. */
  registrationsOf(slotId: string): Registration[] {
    return this.registrations.filter((registration) => registration.slotId === slotId);
  }

  async findById(id: string): Promise<Slot | null> {
    const found = this.slots.get(id);
    return found ? cloneSlot(found) : null;
  }

  async insert(slot: Slot): Promise<void> {
    this.slots.set(slot.id, cloneSlot(slot));
  }

  async addRegistration(slot: Slot, registration: Registration): Promise<void> {
    const stored = this.slots.get(slot.id);
    if (!stored) return;
    // Comme la mise à jour conditionnelle en base : on part du compte stocké, pas de celui reçu,
    // et on lève SLOT_FULL s'il n'y a plus de place.
    stored.register();
    this.registrations.push(cloneRegistration(registration));
  }
}

/** Copie : un test ne voit pas une modification qui n'a pas été persistée. */
function cloneSlot(slot: Slot): Slot {
  return Slot.restore({
    id: slot.id,
    disciplineId: slot.disciplineId,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    capacity: slot.capacity,
    registeredCount: slot.registeredCount,
    createdAt: slot.createdAt,
  });
}

function cloneRegistration(registration: Registration): Registration {
  return Registration.restore({
    id: registration.id,
    slotId: registration.slotId,
    name: registration.name,
    email: registration.email,
    createdAt: registration.createdAt,
  });
}
