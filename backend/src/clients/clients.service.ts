import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClientDto } from './dto/create-client.dto.js';
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

  findAll(): Promise<Client[]> {
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
