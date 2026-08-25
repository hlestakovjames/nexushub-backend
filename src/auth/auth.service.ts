import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async createAccount(dto: CreateAccountDto) {
    const existingUser = await this.prisma.users.findUnique({
      where: {
        email: dto.email.toLowerCase(),
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'An account with this email already exists.',
      );
    }

    const role = await this.prisma.roles.findUnique({
      where: {
        id: dto.role_id,
      },
    });

    if (!role) {
      throw new BadRequestException('Invalid role.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.users.create({
      data: {
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        password_hash: passwordHash,
        is_active: true,
        email_verified: false,
      },
    });

    await this.prisma.user_roles.create({
      data: {
        user_id: user.id,
        role_id: role.id,
      },
    });

    return {
      message: 'Account created successfully.',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: role.name,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('This account is inactive.');
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const userRole = await this.prisma.user_roles.findFirst({
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

    const payload = {
      sub: user.id,
      email: user.email,
      role: userRole.roles.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

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