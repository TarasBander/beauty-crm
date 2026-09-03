import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from '../clients/clients.service.js';
import { DealStage } from '../common/enums/deal-stage.enum.js';
import { CreateDealDto } from './dto/create-deal.dto.js';
import { UpdateDealDto } from './dto/update-deal.dto.js';
import { Deal } from './entities/deal.entity.js';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
    private readonly clientsService: ClientsService,
  ) {}

  async create(dto: CreateDealDto, createdById: string): Promise<Deal> {
    // Confirms the referenced client actually exists — throws the
    // translated clients.notFound 404 otherwise, instead of letting a
    // bogus clientId hit the DB as a foreign-key violation.
    await this.clientsService.findById(dto.clientId);

    const deal = this.dealsRepository.create({
      title: dto.title,
      amount: dto.amount,
      stage: dto.stage ?? DealStage.NEW,
      clientId: dto.clientId,
      assignedToId: dto.assignedToId ?? createdById,
      createdById,
      notes: dto.notes ?? null,
    });

    const saved = await this.dealsRepository.save(deal);
    return this.findById(saved.id);
  }

  async update(id: string, dto: UpdateDealDto): Promise<Deal> {
    await this.findById(id);

    if (dto.clientId !== undefined) {
      await this.clientsService.findById(dto.clientId);
    }

    const patch: Partial<Deal> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.amount !== undefined) patch.amount = dto.amount;
    if (dto.stage !== undefined) patch.stage = dto.stage;
    if (dto.clientId !== undefined) patch.clientId = dto.clientId;
    if (dto.assignedToId !== undefined) patch.assignedToId = dto.assignedToId || null;
    if (dto.notes !== undefined) patch.notes = dto.notes || null;

    await this.dealsRepository.update(id, patch);
    return this.findById(id);
  }

  findAll(): Promise<Deal[]> {
    return this.dealsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Deal> {
    const deal = await this.dealsRepository.findOne({ where: { id } });
    if (!deal) {
      throw new NotFoundException({ messageKey: 'deals.notFound' });
    }
    return deal;
  }
}
