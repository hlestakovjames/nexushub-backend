import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
)
@Roles('Global Admin')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  // --------------------------------------------------
  // ACTIVITY LOGS
  // --------------------------------------------------

  @Get('activity')
  @Permissions('audit.read')
  findActivityLogs(
    @Query('organization_id')
    organizationId?: string,

    @Query('user_id')
    userId?: string,

    @Query('module')
    module?: string,

    @Query('action')
    action?: string,

    @Query('limit')
    limit?: string,
  ) {
    return this.auditService.findActivityLogs({
      organization_id:
        organizationId,

      user_id:
        userId,

      module,

      action,

      limit: limit
        ? Number(limit)
        : undefined,
    });
  }

  // --------------------------------------------------
  // SECURITY LOGS
  // --------------------------------------------------

  @Get('security')
  @Permissions('audit.read')
  findSecurityLogs(
    @Query('organization_id')
    organizationId?: string,

    @Query('user_id')
    userId?: string,

    @Query('event_type')
    eventType?: string,

    @Query('success')
    success?: string,

    @Query('limit')
    limit?: string,
  ) {
    return this.auditService.findSecurityLogs({
      organization_id:
        organizationId,

      user_id:
        userId,

      event_type:
        eventType,

      success:
        success === undefined
          ? undefined
          : success === 'true',

      limit: limit
        ? Number(limit)
        : undefined,
    });
  }
}
