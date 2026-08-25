import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    email?: string;
    phone?: string;
    website?: string;
  }) {
    return this.prisma.organizations.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.organizations.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const organization =
      await this.prisma.organizations.findUnique({
        where: {
          id,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found.',
      );
    }

    return organization;
  }

  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      email?: string;
      phone?: string;
      website?: string;
      logo_url?: string;
    },
  ) {
    await this.findOne(id);

    return this.prisma.organizations.update({
      where: {
        id,
      },
      data,
    });
  }

  async updateStatus(
    id: string,
    is_active: boolean,
  ) {
    await this.findOne(id);

    return this.prisma.organizations.update({
      where: {
        id,
      },
      data: {
        is_active,
      },
    });
  }
}