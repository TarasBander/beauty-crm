import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { toPublicApiKey } from './api-key.mapper.js';
import { ApiKeysService } from './api-keys.service.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, meta } = await this.apiKeysService.findAllPaginated(query);
    return { data: data.map(toPublicApiKey), meta };
  }

  @Post()
  async create(
    @Body() dto: CreateApiKeyDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const { apiKey, rawKey } = await this.apiKeysService.create(dto, currentUser.userId);
    // rawKey is included only in this one response — it can never be
    // recovered again after this, by design.
    return { ...toPublicApiKey(apiKey), rawKey };
  }

  @Patch(':id/revoke')
  async revoke(@Param('id') id: string) {
    const apiKey = await this.apiKeysService.revoke(id);
    return toPublicApiKey(apiKey);
  }
}
