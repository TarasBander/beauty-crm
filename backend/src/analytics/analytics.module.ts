import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../clients/entities/client.entity.js';
import { Deal } from '../deals/entities/deal.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { Task } from '../tasks/entities/task.entity.js';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';

@Module({
  // PassportModule.register(...) (not the bare module) so JwtAuthGuard's
  // AuthGuard('jwt') dependencies resolve locally — see UsersModule for
  // the same gotcha with a longer explanation. The repositories are used
  // read-only, for aggregate queries — this module owns no entity.
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Client, Deal, Task, Payment]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
