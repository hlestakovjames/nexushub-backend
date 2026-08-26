import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(
    private readonly prisma: PrismaService,
  ) {
    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is not defined.',
      );
    }

    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
  }) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException(
        'Invalid authentication token.',
      );
    }

    const user =
      await this.prisma.users.findUnique({
        where: {
          id: payload.sub,
        },
      });

    if (!user || !user.is_active) {
      throw new UnauthorizedException(
        'User account is not active.',
      );
    }

    const userRole =
      await this.prisma.user_roles.findFirst({
        where: {
          user_id: user.id,
        },
        include: {
          roles: true,
        },
      });

    if (!userRole) {
      throw new UnauthorizedException(
        'No role assigned to this account.',
      );
    }

    return {
      userId: user.id,
      email: user.email,
      role: userRole.roles.name,
    };
  }
}