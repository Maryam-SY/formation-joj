import { Module } from '@nestjs/common';
import { DisciplinesModule } from '../disciplines/disciplines.module';
import { SlotRepository } from './application/slot.repository';
import { OpenSlot } from './application/use-cases/open-slot';
import { RegisterVolunteer } from './application/use-cases/register-volunteer';
import { VolunteersController } from './http/volunteers.controller';
import { DrizzleSlotRepository } from './infra/drizzle-slot.repository';

@Module({
  // DisciplinesModule fournit DisciplineRepository : un créneau s'ouvre pour une discipline existante.
  imports: [DisciplinesModule],
  controllers: [VolunteersController],
  providers: [
    // Le port (classe abstraite) est relié ici à son implémentation Drizzle.
    { provide: SlotRepository, useClass: DrizzleSlotRepository },
    OpenSlot,
    RegisterVolunteer,
  ],
})
export class VolunteersModule {}
