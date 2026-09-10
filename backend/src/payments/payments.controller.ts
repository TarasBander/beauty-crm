import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { toPublicPayment } from './payment.mapper.js';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { UpdatePaymentDto } from './dto/update-payment.dto.js';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, meta } = await this.paymentsService.findAllPaginated(query);
    return { data: data.map(toPublicPayment), meta };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const payment = await this.paymentsService.findById(id);
    return toPublicPayment(payment);
  }

  @Post()
  async create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const payment = await this.paymentsService.create(dto, currentUser.userId);
    return toPublicPayment(payment);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    const payment = await this.paymentsService.update(id, dto);
    return toPublicPayment(payment);
  }
}
