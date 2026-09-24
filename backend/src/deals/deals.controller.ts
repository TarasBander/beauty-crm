import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface.js';
import { toPublicDeal } from './deal.mapper.js';
import { DealsService } from './deals.service.js';
import { CreateDealDto } from './dto/create-deal.dto.js';
import { ListDealsQueryDto } from './dto/list-deals-query.dto.js';
import { UpdateDealDto } from './dto/update-deal.dto.js';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  async findAll(@Query() query: ListDealsQueryDto) {
    const { data, meta } = await this.dealsService.findAllPaginated(query);
    return { data: data.map(toPublicDeal), meta };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const deal = await this.dealsService.findById(id);
    return toPublicDeal(deal);
  }

  @Post()
  async create(
    @Body() dto: CreateDealDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const deal = await this.dealsService.create(dto, currentUser.userId);
    return toPublicDeal(deal);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDealDto) {
    const deal = await this.dealsService.update(id, dto);
    return toPublicDeal(deal);
  }
}
