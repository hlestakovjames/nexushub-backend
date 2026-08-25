import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // --------------------------------------------------
  // CREATE MEMBERSHIP
  // --------------------------------------------------

  async create(data: {
    user_id: string;
    organization_id: string;
    department_id?: string;
    role_id?: string;
  }) {
    const user =
      await this.prisma.users.findUnique({
        where: {
          id: data.user_id,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found.',
      );
    }

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

    const existingMembership =
      await this.prisma.memberships.findUnique({
        where: {
          organization_id_user_id: {
            organization_id:
              data.organization_id,
            user_id: data.user_id,
          },
        },
      });

    if (existingMembership) {
      throw new ConflictException(
        'User is already a member of this organization.',
      );
    }

    // --------------------------------------------------
    // VALIDATE DEPARTMENT
    // --------------------------------------------------

    if (data.department_id) {
      const department =
        await this.prisma.departments.findUnique({
          where: {
            id: data.department_id,
          },
        });

      if (!department) {
        throw new NotFoundException(
          'Department not found.',
        );
      }

      if (
        department.organization_id !==
        data.organization_id
      ) {
        throw new ConflictException(
          'Department does not belong to this organization.',
        );
      }
    }

    // --------------------------------------------------
    // VALIDATE ROLE
    // --------------------------------------------------

    if (data.role_id) {
      const role =
        await this.prisma.roles.findUnique({
          where: {
            id: data.role_id,
          },
        });

      if (!role) {
        throw new NotFoundException(
          'Role not found.',
        );
      }
    }

    // --------------------------------------------------
    // CREATE MEMBERSHIP
    // --------------------------------------------------

    const membership =
      await this.prisma.memberships.create({
        data: {
          organization_id:
            data.organization_id,

          user_id: data.user_id,

          status: 'active',

          membership_departments:
            data.department_id
              ? {
                  create: {
                    department_id:
                      data.department_id,
                    is_primary: true,
                  },
                }
              : undefined,

          membership_roles:
            data.role_id
              ? {
                  create: {
                    role_id: data.role_id,
                  },
                }
              : undefined,
        },

        include: {
          organizations: true,

          membership_departments: {
            include: {
              departments: true,
            },
          },

          membership_roles: {
            include: {
              roles: true,
            },
          },
        },
      });

    return {
      message:
        'Organization membership created successfully.',
      membership,
    };
  }

  // --------------------------------------------------
  // LIST MEMBERSHIPS
  // --------------------------------------------------

  async findAll(
    organizationId?: string,
  ) {
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

    return this.prisma.memberships.findMany({
      where: organizationId
        ? {
            organization_id:
              organizationId,
          }
        : undefined,

      orderBy: {
        created_at: 'desc',
      },

      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            is_active: true,
          },
        },

        organizations: true,

        membership_departments: {
          include: {
            departments: true,
          },
        },

        membership_roles: {
          include: {
            roles: true,
          },
        },
      },
    });
  }

  // --------------------------------------------------
  // GET ONE MEMBERSHIP
  // --------------------------------------------------

  async findOne(id: string) {
    const membership =
      await this.prisma.memberships.findUnique({
        where: {
          id,
        },

        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              is_active: true,
            },
          },

          organizations: true,

          membership_departments: {
            include: {
              departments: true,
            },
          },

          membership_roles: {
            include: {
              roles: true,
            },
          },
        },
      });

    if (!membership) {
      throw new NotFoundException(
        'Membership not found.',
      );
    }

    return membership;
  }

  // --------------------------------------------------
  // UPDATE MEMBERSHIP STATUS
  // --------------------------------------------------

  async updateStatus(
    id: string,
    status: string,
  ) {
    await this.findOne(id);

    const updateData: {
      status: string;
      left_at?: Date | null;
    } = {
      status,
    };

    if (status === 'left') {
      updateData.left_at = new Date();
    } else {
      updateData.left_at = null;
    }

    return this.prisma.memberships.update({
      where: {
        id,
      },

      data: updateData,

      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },

        organizations: true,
      },
    });
  }
}