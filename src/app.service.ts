import { Injectable } from '@nestjs/common';

import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getApiInfo() {
    const database = await this.checkDatabase();

    return {
      name: 'Nexus Hub API',
      status: database ? 'online' : 'degraded',
      version: '1.0.0',
      environment:
        process.env.NODE_ENV || 'development',
      database: database ? 'connected' : 'unavailable',
      timestamp: new Date().toISOString(),
    };
  }

  async getHealth() {
    const database = await this.checkDatabase();

    return {
      status: database ? 'ok' : 'degraded',
      database: database ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}