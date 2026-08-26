import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';

import { MembershipsService } from './memberships.service';

@Controller('memberships')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
)
@Roles('Global Admin')
export class MembershipsController {
  constructor(
    private readonly membershipsService: MembershipsService,
  ) {}

  // --------------------------------------------------
  // CREATE MEMBERSHIP
  // --------------------------------------------------

  @Post()
  @Permissions('memberships.create')
  create(
    @Body() body: CreateMembershipDto,
    @Req() request: any,
  ) {
    return this.membershipsService.create(
      body,
      request.user.userId,
    );
  }

  // --------------------------------------------------
  // LIST MEMBERSHIPS
  // --------------------------------------------------

  @Get()
  @Permissions('memberships.read')
  findAll(
    @Query('organization_id')
    organizationId?: string,
  ) {
    return this.membershipsService.findAll(
      organizationId,
    );
  }

  // --------------------------------------------------
  // GET ONE MEMBERSHIP
  // --------------------------------------------------

  @Get(':id')
  @Permissions('memberships.read')
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: string,
  ) {
    return this.membershipsService.findOne(id);
  }

  // --------------------------------------------------
  // UPDATE MEMBERSHIP STATUS
  // --------------------------------------------------

  @Patch(':id/status')
  @Permissions('memberships.update')
  updateStatus(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: string,
    @Body()
    body: UpdateMembershipStatusDto,
    @Req() request: any,
  ) {
    return this.membershipsService.updateStatus(
      id,
      body.status,
      request.user.userId,
    );
  }
}