import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findOne(id: string) {
    return this.prisma.roles.findUnique({
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
  }
}