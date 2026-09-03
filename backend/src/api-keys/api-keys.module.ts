import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeysController } from './api-keys.controller.js';
import { ApiKeysService } from './api-keys.service.js';
import { ApiKey } from './entities/api-key.entity.js';

@Module({
  // PassportModule.register(...) (not the bare module) so JwtAuthGuard's
  // AuthGuard('jwt') dependencies resolve locally — see UsersModule for
  // the same gotcha with a longer explanation. ApiKeysService is
  // exported so IntegrationsModule's ApiKeyGuard can validate incoming
  // X-API-Key headers against it.
  imports: [
    TypeOrmModule.forFeature([ApiKey]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
