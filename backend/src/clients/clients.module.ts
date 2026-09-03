import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsController } from './clients.controller.js';
import { ClientsService } from './clients.service.js';
import { Client } from './entities/client.entity.js';

@Module({
  // PassportModule.register(...) (not the bare module) so JwtAuthGuard's
  // AuthGuard('jwt') dependencies resolve locally — see UsersModule for
  // the same gotcha with a longer explanation.
  imports: [
    TypeOrmModule.forFeature([Client]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
