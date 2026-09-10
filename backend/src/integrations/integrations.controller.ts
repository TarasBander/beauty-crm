import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { toPublicClient } from '../clients/client.mapper.js';
import { ClientsService } from '../clients/clients.service.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { toPublicDeal } from '../deals/deal.mapper.js';
import { DealsService } from '../deals/deals.service.js';
import { ApiKeyGuard } from './api-key.guard.js';

/**
 * A small, deliberately read-only public API for external systems (a
 * website form, a reporting tool, an in-house script) to pull CRM data
 * without a user login — authenticated via ApiKeyGuard's X-API-Key
 * header instead of the JWT the rest of the app uses. Paginated the same
 * way as the internal endpoints so an external caller with a large CRM
 * can't accidentally pull the whole table in one request.
 */
@Controller('integrations/v1')
@UseGuards(ApiKeyGuard)
export class IntegrationsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly dealsService: DealsService,
  ) {}

  @Get('clients')
  async clients(@Query() query: PaginationQueryDto) {
    const { data, meta } = await this.clientsService.findAllPaginated(query);
    return { data: data.map(toPublicClient), meta };
  }

  @Get('deals')
  async deals(@Query() query: PaginationQueryDto) {
    const { data, meta } = await this.dealsService.findAllPaginated(query);
    return { data: data.map(toPublicDeal), meta };
  }
}
