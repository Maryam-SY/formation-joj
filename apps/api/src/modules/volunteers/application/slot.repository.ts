import type { Registration } from '../domain/registration';
import type { Slot } from '../domain/slot';

/**
 * Port de persistance : ce dont les cas d'usage ont besoin, rien de plus.
 * Implémenté par DrizzleSlotRepository (infra) et InMemorySlotRepository (tests).
 */
export abstract class SlotRepository {
  abstract findById(id: string): Promise<Slot | null>;
  abstract insert(slot: Slot): Promise<void>;
  /**
   * Enregistre l'inscription et le nouveau nombre d'inscrits du créneau, en une seule opération
   * atomique. Lève SLOT_FULL si la dernière place a été prise entre-temps.
   */
  abstract addRegistration(slot: Slot, registration: Registration): Promise<void>;
}
