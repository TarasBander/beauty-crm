import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { ClientsModule } from '../clients/clients.module.js';
import { DealsModule } from '../deals/deals.module.js';
import { ApiKeyGuard } from './api-key.guard.js';
import { IntegrationsController } from './integrations.controller.js';

@Module({
  imports: [ApiKeysModule, ClientsModule, DealsModule],
  controllers: [IntegrationsController],
  providers: [ApiKeyGuard],
})
export class IntegrationsModule {}
