import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

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
  create(
    @Body()
    body: {
      name: string;
      slug: string;
      description?: string;
      email?: string;
      phone?: string;
      website?: string;
    },
  ) {
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
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  // --------------------------------------------------
  // UPDATE ORGANIZATION
  // --------------------------------------------------

  @Patch(':id')
  @Permissions('organizations.update')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      slug?: string;
      description?: string;
      email?: string;
      phone?: string;
      website?: string;
      logo_url?: string;
    },
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
    @Param('id') id: string,
    @Body() body: { is_active: boolean },
  ) {
    return this.organizationsService.updateStatus(
      id,
      body.is_active,
    );
  }
}