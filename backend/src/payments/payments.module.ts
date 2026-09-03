import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealsModule } from '../deals/deals.module.js';
import { Payment } from './entities/payment.entity.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

@Module({
  // PassportModule.register(...) (not the bare module) so JwtAuthGuard's
  // AuthGuard('jwt') dependencies resolve locally — see UsersModule for
  // the same gotcha with a longer explanation. DealsModule is imported
  // for DealsService, to validate dealId on create/update.
  imports: [
    TypeOrmModule.forFeature([Payment]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    DealsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
