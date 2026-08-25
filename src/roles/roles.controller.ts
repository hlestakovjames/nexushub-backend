import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
)
@Roles('Global Admin')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
  ) {}

  // --------------------------------------------------
  // LIST ROLES
  // --------------------------------------------------

  @Get()
  @Permissions('roles.read')
  findAll() {
    return this.rolesService.findAll();
  }

  // --------------------------------------------------
  // GET ONE ROLE
  // --------------------------------------------------

  @Get(':id')
  @Permissions('roles.read')
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: string,
  ) {
    return this.rolesService.findOne(id);
  }
}