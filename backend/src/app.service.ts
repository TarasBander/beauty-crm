import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'CRM backend',
      status: 'running',
    };
  }
}
