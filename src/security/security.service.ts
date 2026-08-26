import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecurityService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // --------------------------------------------------
  // CREATE SECURITY LOG
  // --------------------------------------------------

  async log(data: {
    event_type: string;
    success?: boolean;
    user_id?: string;
    organization_id?: string;
    ip_address?: string;
    user_agent?: string;
    details?: Prisma.InputJsonValue;
  }) {
    return this.prisma.security_logs.create({
      data: {
        event_type: data.event_type,
        success: data.success ?? true,
        user_id: data.user_id,
        organization_id: data.organization_id,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        details: data.details,
      },
    });
  }

  // --------------------------------------------------
  // LIST SECURITY LOGS
  // --------------------------------------------------

  async findAll(limit = 100) {
    const safeLimit = Math.min(
      Math.max(limit, 1),
      500,
    );

    return this.prisma.security_logs.findMany({
      orderBy: {
        created_at: 'desc',
      },

      take: safeLimit,

      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },

        organizations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  // --------------------------------------------------
  // GET ONE SECURITY LOG
  // --------------------------------------------------

  async findOne(id: string) {
    return this.prisma.security_logs.findUnique({
      where: {
        id,
      },

      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },

        organizations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }
}
