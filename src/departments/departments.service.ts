import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // --------------------------------------------------
  // CREATE DEPARTMENT
  // --------------------------------------------------

  async create(data: {
    organization_id: string;
    name: string;
    code?: string;
    description?: string;
    parent_department_id?: string;
  }) {
    const organization =
      await this.prisma.organizations.findUnique({
        where: {
          id: data.organization_id,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found.',
      );
    }

    const existingDepartment =
      await this.prisma.departments.findFirst({
        where: {
          organization_id: data.organization_id,
          name: data.name,
        },
      });

    if (existingDepartment) {
      throw new ConflictException(
        'A department with this name already exists in this organization.',
      );
    }

    if (data.parent_department_id) {
      const parent =
        await this.prisma.departments.findUnique({
          where: {
            id: data.parent_department_id,
          },
        });

      if (!parent) {
        throw new NotFoundException(
          'Parent department not found.',
        );
      }

      if (
        parent.organization_id !==
        data.organization_id
      ) {
        throw new ConflictException(
          'Parent department must belong to the same organization.',
        );
      }
    }

    try {
      return await this.prisma.departments.create({
        data: {
          organization_id: data.organization_id,
          name: data.name,
          code: data.code,
          description: data.description,
          parent_department_id:
            data.parent_department_id,
        },
      });
    } catch (error) {
      if (
        this.isPrismaUniqueConstraintError(error)
      ) {
        throw new ConflictException(
          'A department with this name already exists in this organization.',
        );
      }

      throw error;
    }
  }

  // --------------------------------------------------
  // LIST DEPARTMENTS
  // --------------------------------------------------

  async findAll(organizationId?: string) {
    if (organizationId) {
      const organization =
        await this.prisma.organizations.findUnique({
          where: {
            id: organizationId,
          },
        });

      if (!organization) {
        throw new NotFoundException(
          'Organization not found.',
        );
      }
    }

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

  // --------------------------------------------------
  // GET ONE DEPARTMENT
  // --------------------------------------------------

  async findOne(id: string) {
    const department =
      await this.prisma.departments.findUnique({
        where: {
          id,
        },
      });

    if (!department) {
      throw new NotFoundException(
        'Department not found.',
      );
    }

    return department;
  }

  // --------------------------------------------------
  // UPDATE DEPARTMENT
  // --------------------------------------------------

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

    if (Object.keys(data).length === 0) {
      throw new ConflictException(
        'At least one department field must be provided.',
      );
    }

    if (
      data.parent_department_id === id
    ) {
      throw new ConflictException(
        'A department cannot be its own parent.',
      );
    }

    if (
      data.name &&
      data.name !== department.name
    ) {
      const existingDepartment =
        await this.prisma.departments.findFirst({
          where: {
            organization_id:
              department.organization_id,
            name: data.name,
          },
        });

      if (
        existingDepartment &&
        existingDepartment.id !== id
      ) {
        throw new ConflictException(
          'A department with this name already exists in this organization.',
        );
      }
    }

    if (data.parent_department_id) {
      const parent =
        await this.prisma.departments.findUnique({
          where: {
            id: data.parent_department_id,
          },
        });

      if (!parent) {
        throw new NotFoundException(
          'Parent department not found.',
        );
      }

      if (
        parent.organization_id !==
        department.organization_id
      ) {
        throw new ConflictException(
          'Parent department must belong to the same organization.',
        );
      }
    }

    try {
      return await this.prisma.departments.update({
        where: {
          id,
        },
        data,
      });
    } catch (error) {
      if (
        this.isPrismaUniqueConstraintError(error)
      ) {
        throw new ConflictException(
          'A department with this name already exists in this organization.',
        );
      }

      throw error;
    }
  }

  // --------------------------------------------------
  // UPDATE DEPARTMENT STATUS
  // --------------------------------------------------

  async updateStatus(
    id: string,
    isActive: boolean,
  ) {
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

  // --------------------------------------------------
  // PRISMA UNIQUE CONSTRAINT HANDLER
  // --------------------------------------------------

  private isPrismaUniqueConstraintError(
    error: unknown,
  ): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}