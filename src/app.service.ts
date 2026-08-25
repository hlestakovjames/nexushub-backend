import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHello(): Promise<string> {
    await this.prisma.$queryRaw`SELECT 1`;
    return 'Nexus Hub Backend is connected to PostgreSQL!';
  }
}