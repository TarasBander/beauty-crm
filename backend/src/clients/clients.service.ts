import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PaginatedResult } from '../common/dto/paginated-result.interface.js';
import type { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { paginate } from '../common/pagination.util.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { Client } from './entities/client.entity.js';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {}

  async create(dto: CreateClientDto, createdById: string): Promise<Client> {
    const client = this.clientsRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email ?? null,
      salonName: dto.salonName ?? null,
      position: dto.position ?? null,
      address: dto.address ?? null,
      notes: dto.notes ?? null,
      assignedToId: dto.assignedToId ?? createdById,
      createdById,
    });

    const saved = await this.clientsRepository.save(client);
    // save() returns what it was given, not the eager `assignedTo`/
    // `createdBy` relations — reload so the response the client sees
    // right after creating matches what a subsequent GET would return.
    return this.findById(saved.id);
  }

  async update(id: string, dto: UpdateClientDto): Promise<Client> {
    // Make sure the client exists before touching anything (findById
    // already throws the translated 404 if not).
    await this.findById(id);

    const patch: Partial<Client> = {};
    if (dto.firstName !== undefined) patch.firstName = dto.firstName;
    if (dto.lastName !== undefined) patch.lastName = dto.lastName;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    // Optional free-text fields have no @IsNotEmpty(), so an empty string
    // here is a deliberate "clear this field", not a validation failure —
    // store it as null like the rest of the entity does.
    if (dto.email !== undefined) patch.email = dto.email || null;
    if (dto.salonName !== undefined) patch.salonName = dto.salonName || null;
    if (dto.position !== undefined) patch.position = dto.position || null;
    if (dto.address !== undefined) patch.address = dto.address || null;
    if (dto.notes !== undefined) patch.notes = dto.notes || null;
    if (dto.assignedToId !== undefined) patch.assignedToId = dto.assignedToId || null;

    await this.clientsRepository.update(id, patch);
    // Same reasoning as create(): reload so eager assignedTo/createdBy
    // relations are populated in the response.
    return this.findById(id);
  }

  /** Paginated list — what the /clients controller and the public
   * integrations API return. */
  findAllPaginated(query: PaginationQueryDto): Promise<PaginatedResult<Client>> {
    return paginate(this.clientsRepository, query, { order: { createdAt: 'DESC' } });
  }

  /** Unpaginated — for internal callers that need every row, like
   * AnalyticsService's aggregates. Never expose this straight to a
   * controller: it doesn't scale past however many clients fit in memory. */
  findAllRaw(): Promise<Client[]> {
    return this.clientsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Client> {
    const client = await this.clientsRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException({ messageKey: 'clients.notFound' });
    }
    return client;
  }
}
