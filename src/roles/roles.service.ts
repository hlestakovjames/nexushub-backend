import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // --------------------------------------------------
  // LIST ROLES
  // --------------------------------------------------

  async findAll() {
    return this.prisma.roles.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  // --------------------------------------------------
  // GET ONE ROLE
  // --------------------------------------------------

  async findOne(id: string) {
    const role = await this.prisma.roles.findUnique({
      where: {
        id,
      },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(
        'Role not found.',
      );
    }

    return role;
  }
}