import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '../clients/clients.module.js';
import { DealsController } from './deals.controller.js';
import { DealsService } from './deals.service.js';
import { Deal } from './entities/deal.entity.js';

@Module({
  // PassportModule.register(...) (not the bare module) so JwtAuthGuard's
  // AuthGuard('jwt') dependencies resolve locally — see UsersModule for
  // the same gotcha with a longer explanation. ClientsModule is imported
  // (not just its entity) to get ClientsService for validating clientId
  // on create/update.
  imports: [
    TypeOrmModule.forFeature([Deal]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientsModule,
  ],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
