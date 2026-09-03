import { Controller, Get, UseGuards } from '@nestjs/common';
import { toPublicClient } from '../clients/client.mapper.js';
import { ClientsService } from '../clients/clients.service.js';
import { toPublicDeal } from '../deals/deal.mapper.js';
import { DealsService } from '../deals/deals.service.js';
import { ApiKeyGuard } from './api-key.guard.js';

/**
 * A small, deliberately read-only public API for external systems (a
 * website form, a reporting tool, an in-house script) to pull CRM data
 * without a user login — authenticated via ApiKeyGuard's X-API-Key
 * header instead of the JWT the rest of the app uses.
 */
@Controller('integrations/v1')
@UseGuards(ApiKeyGuard)
export class IntegrationsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly dealsService: DealsService,
  ) {}

  @Get('clients')
  async clients() {
    const clients = await this.clientsService.findAll();
    return clients.map(toPublicClient);
  }

  @Get('deals')
  async deals() {
    const deals = await this.dealsService.findAll();
    return deals.map(toPublicDeal);
  }
}
