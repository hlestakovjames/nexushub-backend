import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
  // PERMISSION TEST
  // --------------------------------------------------

  @Get('permission-test')
  @Permissions('users.test')
  permissionTest() {
    return {
      message: 'Permission test passed.',
    };
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
  create(
    @Body()
    body: {
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
      password: string;
      role_id: string;
    },
  ) {
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
    @Body() body: { is_active: boolean },
  ) {
    if (typeof body.is_active !== 'boolean') {
      throw new BadRequestException(
        'is_active must be a boolean.',
      );
    }

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
    @Body() body: { role_id: string },
  ) {
    if (!body.role_id) {
      throw new BadRequestException(
        'role_id is required.',
      );
    }

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
    @Body()
    body: {
      organization_id: string;
      department_id?: string;
      role_id?: string;
    },
  ) {
    return this.usersService.createMembership({
      user_id,
      organization_id: body.organization_id,
      department_id: body.department_id,
      role_id: body.role_id,
    });
  }
}