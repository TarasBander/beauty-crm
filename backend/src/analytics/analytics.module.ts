import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule } from '../clients/clients.module.js';
import { DealsModule } from '../deals/deals.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';

@Module({
  // PassportModule.register(...) (not the bare module) so JwtAuthGuard's
  // AuthGuard('jwt') dependencies resolve locally — see UsersModule for
  // the same gotcha with a longer explanation. The other four modules
  // are imported purely for their exported services — this module reads
  // data through them rather than owning any entity of its own.
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientsModule,
    DealsModule,
    TasksModule,
    PaymentsModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
