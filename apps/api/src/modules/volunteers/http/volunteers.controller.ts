import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  openSlotSchema,
  registerVolunteerSchema,
  slotIdParamsSchema,
  type SlotResponse,
  slotSchema,
} from '@joj/shared';
import { createZodDto, ZodSerializerDto } from 'nestjs-zod';
import { OpenSlot } from '../application/use-cases/open-slot';
import { RegisterVolunteer } from '../application/use-cases/register-volunteer';
import type { Slot } from '../domain/slot';

class OpenSlotDto extends createZodDto(openSlotSchema) {}
class RegisterVolunteerDto extends createZodDto(registerVolunteerSchema) {}
class SlotIdParamsDto extends createZodDto(slotIdParamsSchema) {}
class SlotDto extends createZodDto(slotSchema) {}

/** Couche fine : valider (DTO zod), appeler un cas d'usage, sérialiser. Aucune règle métier ici. */
@ApiTags('slots')
@Controller('slots')
export class VolunteersController {
  constructor(
    private readonly openSlot: OpenSlot,
    private readonly registerVolunteer: RegisterVolunteer,
  ) {}

  @Post()
  @ZodSerializerDto(SlotDto)
  async open(@Body() body: OpenSlotDto): Promise<SlotResponse> {
    return toResponse(await this.openSlot.execute(body));
  }

  /** Renvoie le créneau mis à jour : son nombre d'inscrits montre que l'inscription a compté. */
  @Post(':id/registrations')
  @ZodSerializerDto(SlotDto)
  async register(
    @Param() { id }: SlotIdParamsDto,
    @Body() body: RegisterVolunteerDto,
  ): Promise<SlotResponse> {
    return toResponse(await this.registerVolunteer.execute(id, body));
  }
}

function toResponse(slot: Slot): SlotResponse {
  return {
    id: slot.id,
    disciplineId: slot.disciplineId,
    startsAt: slot.startsAt.toISOString(),
    endsAt: slot.endsAt.toISOString(),
    capacity: slot.capacity,
    registeredCount: slot.registeredCount,
    createdAt: slot.createdAt.toISOString(),
  };
}
