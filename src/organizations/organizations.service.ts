import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------
  // CREATE ORGANIZATION
  // --------------------------------------------------

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    email?: string;
    phone?: string;
    website?: string;
    logo_url?: string;
  }) {
    const existingOrganization =
      await this.prisma.organizations.findUnique({
        where: {
          slug: data.slug,
        },
      });

    if (existingOrganization) {
      throw new ConflictException(
        'An organization with this slug already exists.',
      );
    }

    return this.prisma.organizations.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        email: data.email,
        phone: data.phone,
        website: data.website,
        logo_url: data.logo_url,
      },
    });
  }

  // --------------------------------------------------
  // LIST ORGANIZATIONS
  // --------------------------------------------------

  async findAll() {
    return this.prisma.organizations.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // --------------------------------------------------
  // GET ONE ORGANIZATION
  // --------------------------------------------------

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

  // --------------------------------------------------
  // UPDATE ORGANIZATION
  // --------------------------------------------------

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
    const organization = await this.findOne(id);

    if (Object.keys(data).length === 0) {
      throw new ConflictException(
        'At least one organization field must be provided.',
      );
    }

    if (data.slug && data.slug !== organization.slug) {
      const existingOrganization =
        await this.prisma.organizations.findUnique({
          where: {
            slug: data.slug,
          },
        });

      if (
        existingOrganization &&
        existingOrganization.id !== id
      ) {
        throw new ConflictException(
          'An organization with this slug already exists.',
        );
      }
    }

    return this.prisma.organizations.update({
      where: {
        id,
      },
      data,
    });
  }

  // --------------------------------------------------
  // UPDATE ORGANIZATION STATUS
  // --------------------------------------------------

  async updateStatus(
    id: string,
    isActive: boolean,
  ) {
    await this.findOne(id);

    return this.prisma.organizations.update({
      where: {
        id,
      },
      data: {
        is_active: isActive,
      },
    });
  }
}