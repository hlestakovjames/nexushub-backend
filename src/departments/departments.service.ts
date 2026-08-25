import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    organization_id: string;
    name: string;
    code?: string;
    description?: string;
    parent_department_id?: string;
  }) {
    const organization = await this.prisma.organizations.findUnique({
      where: {
        id: data.organization_id,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    if (data.parent_department_id) {
      const parent = await this.prisma.departments.findUnique({
        where: {
          id: data.parent_department_id,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent department not found.');
      }

      if (parent.organization_id !== data.organization_id) {
        throw new ConflictException(
          'Parent department must belong to the same organization.',
        );
      }
    }

    return this.prisma.departments.create({
      data: {
        organization_id: data.organization_id,
        name: data.name,
        code: data.code,
        description: data.description,
        parent_department_id: data.parent_department_id,
      },
    });
  }

  async findAll(organizationId?: string) {
    return this.prisma.departments.findMany({
      where: organizationId
        ? {
            organization_id: organizationId,
          }
        : undefined,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const department = await this.prisma.departments.findUnique({
      where: {
        id,
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found.');
    }

    return department;
  }

  async update(
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string;
      parent_department_id?: string | null;
    },
  ) {
    const department = await this.findOne(id);

    if (data.parent_department_id === id) {
      throw new ConflictException(
        'A department cannot be its own parent.',
      );
    }

    if (data.parent_department_id) {
      const parent = await this.prisma.departments.findUnique({
        where: {
          id: data.parent_department_id,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent department not found.');
      }

      if (parent.organization_id !== department.organization_id) {
        throw new ConflictException(
          'Parent department must belong to the same organization.',
        );
      }
    }

    return this.prisma.departments.update({
      where: {
        id,
      },
      data,
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.findOne(id);

    return this.prisma.departments.update({
      where: {
        id,
      },
      data: {
        is_active: isActive,
      },
    });
  }
}