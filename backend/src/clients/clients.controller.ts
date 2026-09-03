import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface.js';
import { toPublicClient } from './client.mapper.js';
import { ClientsService } from './clients.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll() {
    const clients = await this.clientsService.findAll();
    return clients.map(toPublicClient);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const client = await this.clientsService.findById(id);
    return toPublicClient(client);
  }

  @Post()
  async create(
    @Body() dto: CreateClientDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const client = await this.clientsService.create(dto, currentUser.userId);
    return toPublicClient(client);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    const client = await this.clientsService.update(id, dto);
    return toPublicClient(client);
  }
}
