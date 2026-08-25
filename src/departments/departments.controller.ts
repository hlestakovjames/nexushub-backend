import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Global Admin')
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
  ) {}

  @Post()
  create(
    @Body()
    body: {
      organization_id: string;
      name: string;
      code?: string;
      description?: string;
      parent_department_id?: string;
    },
  ) {
    return this.departmentsService.create(body);
  }

  @Get()
  findAll(
    @Query('organization_id') organizationId?: string,
  ) {
    return this.departmentsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      code?: string;
      description?: string;
      parent_department_id?: string | null;
    },
  ) {
    return this.departmentsService.update(id, body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { is_active: boolean },
  ) {
    return this.departmentsService.updateStatus(
      id,
      body.is_active,
    );
  }
}