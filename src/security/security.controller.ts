import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

import { SecurityService } from './security.service';

@Controller('security')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
)
@Roles('Global Admin')
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
  ) {}

  // --------------------------------------------------
  // LIST SECURITY LOGS
  // --------------------------------------------------

  @Get('logs')
  @Permissions('security.read')
  findAll(
    @Query(
      'limit',
      new DefaultValuePipe(100),
      ParseIntPipe,
    )
    limit: number,
  ) {
    return this.securityService.findAll(
      limit,
    );
  }

  // --------------------------------------------------
  // GET ONE SECURITY LOG
  // --------------------------------------------------

  @Get('logs/:id')
  @Permissions('security.read')
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: string,
  ) {
    return this.securityService.findOne(id);
  }
}
