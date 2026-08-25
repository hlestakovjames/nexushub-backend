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

import { CreateMembershipDto } from './dto/create-membership.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

import { UsersService } from './users.service';

@Controller('users')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
)
@Roles('Global Admin')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // --------------------------------------------------
  // LIST USERS
  // --------------------------------------------------

  @Get()
  @Permissions('users.read')
  findAll() {
    return this.usersService.findAll();
  }

  // --------------------------------------------------
  // GET ONE USER
  // --------------------------------------------------

  @Get(':id')
  @Permissions('users.read')
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: string,
  ) {
    return this.usersService.findOne(id);
  }

  // --------------------------------------------------
  // CREATE USER
  // --------------------------------------------------

  @Post()
  @Permissions('users.create')
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  // --------------------------------------------------
  // UPDATE USER STATUS
  // --------------------------------------------------

  @Patch(':id/status')
  @Permissions('users.update')
  updateStatus(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: string,
    @Body() body: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(
      id,
      body.is_active,
    );
  }

  // --------------------------------------------------
  // UPDATE USER GLOBAL ROLE
  // --------------------------------------------------

  @Patch(':id/role')
  @Permissions('users.update')
  updateRole(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(
      id,
      body.role_id,
    );
  }

  // --------------------------------------------------
  // CREATE ORGANIZATION MEMBERSHIP
  // --------------------------------------------------

  @Post(':id/memberships')
  @Permissions('users.update')
  createMembership(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    user_id: string,
    @Body() body: CreateMembershipDto,
  ) {
    return this.usersService.createMembership({
      user_id,
      organization_id: body.organization_id,
      department_id: body.department_id,
      role_id: body.role_id,
    });
  }
}