import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AnalyticsService } from './analytics.service.js';
import { SalesQueryDto } from './dto/sales-query.dto.js';

// Дашборд і аналітику бачать усі залогінені (і адмін, і менеджер), тому
// тут лише JwtAuthGuard, без @Roles.
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('sales')
  getSales(@Query() query: SalesQueryDto) {
    return this.analyticsService.getSales(query);
  }
}
