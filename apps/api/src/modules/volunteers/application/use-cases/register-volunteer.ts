import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { RegisterVolunteerInput } from '@joj/shared';
import { Registration } from '../../domain/registration';
import type { Slot } from '../../domain/slot';
import { slotNotFound } from '../../domain/volunteers.errors';
import { SlotRepository } from '../slot.repository';

@Injectable()
export class RegisterVolunteer {
  constructor(private readonly slots: SlotRepository) {}

  /** Renvoie le créneau mis à jour, pour que l'appelant voie son nouveau nombre d'inscrits. */
  async execute(slotId: string, input: RegisterVolunteerInput): Promise<Slot> {
    const slot = await this.slots.findById(slotId);
    if (!slot) throw slotNotFound(slotId);
    const registration = Registration.create({
      id: randomUUID(),
      slotId,
      name: input.name,
      email: input.email,
      now: new Date(),
    });
    // Message clair si le créneau est déjà complet ; le repository couvre la course à la dernière place.
    slot.register();
    await this.slots.addRegistration(slot, registration);
    return slot;
  }
}
