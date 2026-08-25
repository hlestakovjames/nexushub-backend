import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateOrganizationStatusDto } from './dto/update-organization-status.dto';

import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
)
@Roles('Global Admin')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  // --------------------------------------------------
  // CREATE ORGANIZATION
  // --------------------------------------------------

  @Post()
  @Permissions('organizations.create')
  create(@Body() body: CreateOrganizationDto) {
    return this.organizationsService.create(body);
  }

  // --------------------------------------------------
  // LIST ORGANIZATIONS
  // --------------------------------------------------

  @Get()
  @Permissions('organizations.read')
  findAll() {
    return this.organizationsService.findAll();
  }

  // --------------------------------------------------
  // GET ONE ORGANIZATION
  // --------------------------------------------------

  @Get(':id')
  @Permissions('organizations.read')
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: string,
  ) {
    return this.organizationsService.findOne(id);
  }

  // --------------------------------------------------
  // UPDATE ORGANIZATION
  // --------------------------------------------------

  @Patch(':id')
  @Permissions('organizations.update')
  update(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: string,
    @Body() body: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(
      id,
      body,
    );
  }

  // --------------------------------------------------
  // UPDATE ORGANIZATION STATUS
  // --------------------------------------------------

  @Patch(':id/status')
  @Permissions('organizations.update')
  updateStatus(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: string,
    @Body() body: UpdateOrganizationStatusDto,
  ) {
    return this.organizationsService.updateStatus(
      id,
      body.is_active,
    );
  }
}