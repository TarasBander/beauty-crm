import { toPublicDeal } from '../deals/deal.mapper.js';
import { toPublicUser } from '../users/user.mapper.js';
import type { Payment } from './entities/payment.entity.js';

/**
 * `Payment.deal` is an eager Deal relation that itself nests an eager
 * Client and eager Users — reuse toPublicDeal() rather than duplicating
 * the passwordHash-stripping logic here.
 */
export function toPublicPayment(payment: Payment) {
  return {
    ...payment,
    deal: toPublicDeal(payment.deal),
    createdBy: payment.createdBy ? toPublicUser(payment.createdBy) : null,
  };
}
