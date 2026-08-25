import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateDepartmentStatusDto } from './dto/update-department-status.dto';

import { DepartmentsService } from './departments.service';

@Controller('departments')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
)
@Roles('Global Admin')
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
  ) {}

  // --------------------------------------------------
  // CREATE DEPARTMENT
  // --------------------------------------------------

  @Post()
  @Permissions('departments.create')
  create(@Body() body: CreateDepartmentDto) {
    return this.departmentsService.create(body);
  }

  // --------------------------------------------------
  // LIST DEPARTMENTS
  // --------------------------------------------------

  @Get()
  @Permissions('departments.read')
  findAll(
    @Query('organization_id')
    organizationId?: string,
  ) {
    return this.departmentsService.findAll(
      organizationId,
    );
  }

  // --------------------------------------------------
  // GET ONE DEPARTMENT
  // --------------------------------------------------

  @Get(':id')
  @Permissions('departments.read')
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: string,
  ) {
    return this.departmentsService.findOne(id);
  }

  // --------------------------------------------------
  // UPDATE DEPARTMENT
  // --------------------------------------------------

  @Patch(':id')
  @Permissions('departments.update')
  update(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: string,
    @Body() body: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(
      id,
      body,
    );
  }

  // --------------------------------------------------
  // UPDATE DEPARTMENT STATUS
  // --------------------------------------------------

  @Patch(':id/status')
  @Permissions('departments.update')
  updateStatus(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: string,
    @Body() body: UpdateDepartmentStatusDto,
  ) {
    return this.departmentsService.updateStatus(
      id,
      body.is_active,
    );
  }
}