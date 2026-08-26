import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { SecurityService } from '../security/security.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly securityService: SecurityService,
  ) {}

  // --------------------------------------------------
  // CREATE ACCOUNT
  // --------------------------------------------------

  async createAccount(dto: CreateAccountDto) {
    const firstName = dto.first_name?.trim();
    const lastName = dto.last_name?.trim();
    const email = dto.email?.toLowerCase().trim();
    const phone = dto.phone?.trim();
    const password = dto.password;

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
    // PUBLIC REGISTRATION ROLE
    // --------------------------------------------------
    //
    // Public registration MUST NOT allow the caller
    // to choose an arbitrary privileged role.
    //
    // Every publicly registered account starts as Member.
    // Administrative roles are assigned through the
    // protected user-management system.
    // --------------------------------------------------

    const memberRole =
      await this.prisma.roles.findUnique({
        where: {
          name: 'Member',
        },
      });

    if (!memberRole) {
      throw new BadRequestException(
        'Default Member role is not configured.',
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
    // CREATE USER + MEMBER ROLE
    // --------------------------------------------------

    const user =
      await this.prisma.$transaction(
        async (tx) => {
          const createdUser =
            await tx.users.create({
              data: {
                first_name: firstName,
                last_name: lastName,
                email,
                phone: phone || null,
                password_hash: passwordHash,
                is_active: true,
                email_verified: false,
              },
            });

          await tx.user_roles.create({
            data: {
              user_id: createdUser.id,
              role_id: memberRole.id,
            },
          });

          return createdUser;
        },
      );

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return {
      message: 'Account created successfully.',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: memberRole.name,
      },
    };
  }

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  async login(
    email: string,
    password: string,
    request?: any,
  ) {
    const normalizedEmail =
      email?.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    // --------------------------------------------------
    // FIND USER
    // --------------------------------------------------

    const user =
      await this.prisma.users.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (!user) {
      await this.securityService.log({
        event_type: 'LOGIN_FAILED',
        success: false,
        ip_address: request?.ip,
        user_agent: request?.['user-agent'],
        details: {
          email: normalizedEmail,
          reason: 'INVALID_CREDENTIALS',
        },
      });

      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    // --------------------------------------------------
    // ACCOUNT STATUS
    // --------------------------------------------------

    if (!user.is_active) {
      await this.securityService.log({
        user_id: user.id,
        event_type: 'ACCOUNT_INACTIVE',
        success: false,
        ip_address: request?.ip,
        user_agent: request?.headers?.['user-agent'],
        details: {
          email: normalizedEmail,
        },
      });

      throw new UnauthorizedException(
        'This account is inactive.',
      );
    }

    // --------------------------------------------------
    // PASSWORD VERIFICATION
    // --------------------------------------------------

    const passwordValid =
      await bcrypt.compare(
        password,
        user.password_hash,
      );

    if (!passwordValid) {
      await this.securityService.log({
        user_id: user.id,
        event_type: 'LOGIN_FAILED',
        success: false,
        ip_address: request?.ip,
        user_agent: request?.headers?.['user-agent'],
        details: {
          reason: 'INVALID_CREDENTIALS',
        },
      });

      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    // --------------------------------------------------
    // GET USER ROLE
    // --------------------------------------------------

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
      await this.securityService.log({
        user_id: user.id,
        event_type: 'NO_ROLE_ASSIGNED',
        success: false,
        ip_address: request?.ip,
        user_agent: request?.headers?.['user-agent'],
        details: {
          email: normalizedEmail,
        },
      });

      throw new UnauthorizedException(
        'No role assigned to this account.',
      );
    }

    // --------------------------------------------------
    // JWT PAYLOAD
    // --------------------------------------------------

  const payload = {
    sub: user.id,
    email: user.email,
  };

    // --------------------------------------------------
    // GENERATE ACCESS TOKEN
    // --------------------------------------------------

    const accessToken =
      await this.jwtService.signAsync(
        payload,
      );

    await this.securityService.log({
      user_id: user.id,
      event_type: 'LOGIN_SUCCESS',
      success: true,
      ip_address: request?.ip,
      user_agent: request?.headers?.['user-agent'],
      details: {
        role: userRole.roles.name,
      },
    });

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return {
      message: 'Login successful.',
      access_token: accessToken,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: userRole.roles.name,
      },
    };
  }
}