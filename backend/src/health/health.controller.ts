import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch {
      // No error.message here — this endpoint is public, and driver
      // errors can leak hostnames, ports and usernames.
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'unreachable',
      });
    }
  }
}
