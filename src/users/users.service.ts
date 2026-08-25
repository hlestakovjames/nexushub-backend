import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------
  // LIST USERS
  // --------------------------------------------------

  async findAll() {
    const users = await this.prisma.users.findMany({
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        is_active: true,
        email_verified: true,
        created_at: true,
        updated_at: true,
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      is_active: user.is_active,
      email_verified: user.email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
      roles: user.user_roles.map(
        (userRole) => userRole.roles.name,
      ),
    }));
  }

  // --------------------------------------------------
  // GET ONE USER
  // --------------------------------------------------

  async findOne(id: string) {
    const user = await this.prisma.users.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        is_active: true,
        email_verified: true,
        created_at: true,
        updated_at: true,

        user_roles: {
          include: {
            roles: true,
          },
        },

        memberships: {
          include: {
            organizations: true,

            membership_roles: {
              include: {
                roles: true,
              },
            },

            membership_departments: {
              include: {
                departments: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      is_active: user.is_active,
      email_verified: user.email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,

      roles: user.user_roles.map(
        (userRole) => userRole.roles.name,
      ),

      memberships: user.memberships,
    };
  }

  // --------------------------------------------------
  // CREATE USER
  // --------------------------------------------------

  async create(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
    role_id: string;
  }) {
    const firstName = data.first_name?.trim();
    const lastName = data.last_name?.trim();
    const email = data.email?.toLowerCase().trim();
    const phone = data.phone?.trim();
    const password = data.password;
    const roleId = data.role_id?.trim();

    // --------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------

    if (!firstName || !lastName) {
      throw new BadRequestException(
        'First name and last name are required.',
      );
    }

    if (!email) {
      throw new BadRequestException(
        'Email address is required.',
      );
    }

    if (!password) {
      throw new BadRequestException(
        'Password is required.',
      );
    }

    if (!roleId) {
      throw new BadRequestException(
        'Role is required.',
      );
    }

    // --------------------------------------------------
    // EMAIL VALIDATION
    // --------------------------------------------------

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      throw new BadRequestException(
        'Please provide a valid email address.',
      );
    }

    // --------------------------------------------------
    // PASSWORD VALIDATION
    // --------------------------------------------------

    if (password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long.',
      );
    }

    // --------------------------------------------------
    // CHECK EXISTING USER
    // --------------------------------------------------

    const existingUser =
      await this.prisma.users.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      throw new BadRequestException(
        'An account with this email already exists.',
      );
    }

    // --------------------------------------------------
    // CHECK ROLE
    // --------------------------------------------------

    const role = await this.prisma.roles.findUnique({
      where: {
        id: roleId,
      },
    });

    if (!role) {
      throw new BadRequestException(
        'Invalid role.',
      );
    }

    // --------------------------------------------------
    // HASH PASSWORD
    // --------------------------------------------------

    const passwordHash = await bcrypt.hash(
      password,
      12,
    );

    // --------------------------------------------------
    // CREATE USER + ROLE
    // --------------------------------------------------

    const user = await this.prisma.users.create({
      data: {
        id: randomUUID(),
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        password_hash: passwordHash,
        is_active: true,
        email_verified: false,

        user_roles: {
          create: {
            role_id: role.id,
          },
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        is_active: true,
        email_verified: true,
        created_at: true,
        updated_at: true,
      },
    });

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return {
      message: 'User created successfully.',
      user: {
        ...user,
        role: role.name,
      },
    };
  }

  // --------------------------------------------------
  // UPDATE USER STATUS
  // --------------------------------------------------

  async updateStatus(
    id: string,
    isActive: boolean,
  ) {
    const existingUser =
      await this.prisma.users.findUnique({
        where: {
          id,
        },
      });

    if (!existingUser) {
      throw new NotFoundException(
        'User not found.',
      );
    }

    return this.prisma.users.update({
      where: {
        id,
      },
      data: {
        is_active: isActive,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        is_active: true,
        email_verified: true,
        created_at: true,
        updated_at: true,
      },
    });
  }
    // --------------------------------------------------
  // UPDATE USER GLOBAL ROLE
  // --------------------------------------------------

  async updateRole(
    id: string,
    roleId: string,
  ) {
    const user = await this.prisma.users.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found.',
      );
    }

    const role = await this.prisma.roles.findUnique({
      where: {
        id: roleId,
      },
    });

    if (!role) {
      throw new BadRequestException(
        'Role not found.',
      );
    }

    await this.prisma.user_roles.deleteMany({
      where: {
        user_id: id,
      },
    });

    await this.prisma.user_roles.create({
      data: {
        user_id: id,
        role_id: role.id,
      },
    });

    const updatedUser =
      await this.prisma.users.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          is_active: true,
          email_verified: true,
          created_at: true,
          updated_at: true,

          user_roles: {
            include: {
              roles: true,
            },
          },
        },
      });

    return {
      message: 'User role updated successfully.',
      user: {
        id: updatedUser!.id,
        first_name: updatedUser!.first_name,
        last_name: updatedUser!.last_name,
        email: updatedUser!.email,
        phone: updatedUser!.phone,
        is_active: updatedUser!.is_active,
        email_verified: updatedUser!.email_verified,
        created_at: updatedUser!.created_at,
        updated_at: updatedUser!.updated_at,
        role: updatedUser!.user_roles[0]?.roles.name,
      },
    };
  }
  // --------------------------------------------------
  // CREATE ORGANIZATION MEMBERSHIP
  // --------------------------------------------------

  async createMembership(data: {
    user_id: string;
    organization_id: string;
    department_id?: string;
    role_id?: string;
  }) {
    const user = await this.prisma.users.findUnique({
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
      throw new BadRequestException(
        'Organization not found.',
      );
    }

    const existingMembership =
      await this.prisma.memberships.findUnique({
        where: {
          organization_id_user_id: {
            organization_id: data.organization_id,
            user_id: data.user_id,
          },
        },
      });

    if (existingMembership) {
      throw new BadRequestException(
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
        throw new BadRequestException(
          'Department not found.',
        );
      }

      if (
        department.organization_id !==
        data.organization_id
      ) {
        throw new BadRequestException(
          'Department does not belong to this organization.',
        );
      }
    }

    // --------------------------------------------------
    // VALIDATE ROLE
    // --------------------------------------------------

    if (data.role_id) {
      const role = await this.prisma.roles.findUnique({
        where: {
          id: data.role_id,
        },
      });

      if (!role) {
        throw new BadRequestException(
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
          id: randomUUID(),
          organization_id: data.organization_id,
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

          membership_roles: data.role_id
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
}