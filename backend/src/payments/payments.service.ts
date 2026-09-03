import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentStatus } from '../common/enums/payment-status.enum.js';
import { DealsService } from '../deals/deals.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { UpdatePaymentDto } from './dto/update-payment.dto.js';
import { Payment } from './entities/payment.entity.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly dealsService: DealsService,
  ) {}

  async create(dto: CreatePaymentDto, createdById: string): Promise<Payment> {
    // Confirms the referenced deal actually exists — throws the
    // translated deals.notFound 404 otherwise.
    await this.dealsService.findById(dto.dealId);

    const payment = this.paymentsRepository.create({
      dealId: dto.dealId,
      amount: dto.amount,
      method: dto.method,
      status: dto.status ?? PaymentStatus.PENDING,
      paidAt: dto.paidAt ?? null,
      notes: dto.notes ?? null,
      createdById,
    });

    const saved = await this.paymentsRepository.save(payment);
    return this.findById(saved.id);
  }

  async update(id: string, dto: UpdatePaymentDto): Promise<Payment> {
    await this.findById(id);

    if (dto.dealId !== undefined) {
      await this.dealsService.findById(dto.dealId);
    }

    const patch: Partial<Payment> = {};
    if (dto.dealId !== undefined) patch.dealId = dto.dealId;
    if (dto.amount !== undefined) patch.amount = dto.amount;
    if (dto.method !== undefined) patch.method = dto.method;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.paidAt !== undefined) patch.paidAt = dto.paidAt || null;
    if (dto.notes !== undefined) patch.notes = dto.notes || null;

    await this.paymentsRepository.update(id, patch);
    return this.findById(id);
  }

  findAll(): Promise<Payment[]> {
    return this.paymentsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException({ messageKey: 'payments.notFound' });
    }
    return payment;
  }
}
