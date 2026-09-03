import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { DealsModule } from './deals/deals.module.js';
import { HealthModule } from './health/health.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'crm'),
        password: config.get<string>('DB_PASSWORD', 'crm_dev_password'),
        database: config.get<string>('DB_DATABASE', 'crm'),
        autoLoadEntities: true,
        // synchronize is convenient for a pet project in development,
        // but should be replaced with migrations before anything real.
        synchronize: true,
      }),
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    ClientsModule,
    DealsModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
