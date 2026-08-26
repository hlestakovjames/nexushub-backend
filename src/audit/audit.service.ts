import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // --------------------------------------------------
  // ACTIVITY LOG
  // --------------------------------------------------

  async logActivity(data: {
    organization_id?: string;
    user_id?: string;
    action: string;
    module: string;
    entity_type?: string;
    entity_id?: string;
    description?: string;
    metadata?: Prisma.InputJsonValue;
    ip_address?: string;
    user_agent?: string;
  }) {
    return this.prisma.activity_logs.create({
      data: {
        organization_id:
          data.organization_id ?? null,

        user_id:
          data.user_id ?? null,

        action: data.action,

        module: data.module,

        entity_type:
          data.entity_type ?? null,

        entity_id:
          data.entity_id ?? null,

        description:
          data.description ?? null,

        metadata:
          data.metadata ?? undefined,

        ip_address:
          data.ip_address ?? null,

        user_agent:
          data.user_agent ?? null,
      },
    });
  }

  // --------------------------------------------------
  // SECURITY LOG
  // --------------------------------------------------

  async logSecurityEvent(data: {
    user_id?: string;
    organization_id?: string;
    event_type: string;
    success?: boolean;
    ip_address?: string;
    user_agent?: string;
    details?: Prisma.InputJsonValue;
  }) {
    return this.prisma.security_logs.create({
      data: {
        user_id:
          data.user_id ?? null,

        organization_id:
          data.organization_id ?? null,

        event_type:
          data.event_type,

        success:
          data.success ?? true,

        ip_address:
          data.ip_address ?? null,

        user_agent:
          data.user_agent ?? null,

        details:
          data.details ?? undefined,
      },
    });
  }

  // --------------------------------------------------
  // LIST ACTIVITY LOGS
  // --------------------------------------------------

  async findActivityLogs(options?: {
    organization_id?: string;
    user_id?: string;
    module?: string;
    action?: string;
    limit?: number;
  }) {
    const limit = Math.min(
      Math.max(options?.limit ?? 50, 1),
      100,
    );

    return this.prisma.activity_logs.findMany({
      where: {
        organization_id:
          options?.organization_id,

        user_id:
          options?.user_id,

        module:
          options?.module,

        action:
          options?.action,
      },

      orderBy: {
        created_at: 'desc',
      },

      take: limit,

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
  // LIST SECURITY LOGS
  // --------------------------------------------------

  async findSecurityLogs(options?: {
    organization_id?: string;
    user_id?: string;
    event_type?: string;
    success?: boolean;
    limit?: number;
  }) {
    const limit = Math.min(
      Math.max(options?.limit ?? 50, 1),
      100,
    );

    return this.prisma.security_logs.findMany({
      where: {
        organization_id:
          options?.organization_id,

        user_id:
          options?.user_id,

        event_type:
          options?.event_type,

        success:
          options?.success,
      },

      orderBy: {
        created_at: 'desc',
      },

      take: limit,

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
