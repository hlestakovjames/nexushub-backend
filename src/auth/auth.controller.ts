import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // --------------------------------------------------
  // PUBLIC ACCOUNT REGISTRATION
  // --------------------------------------------------

  @Post('register')
  createAccount(
    @Body() dto: CreateAccountDto,
  ) {
    return this.authService.createAccount(dto);
  }

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(
      body.email,
      body.password,
    );
  }

  // --------------------------------------------------
  // CURRENT AUTHENTICATED USER
  // --------------------------------------------------

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() request: any) {
    return request.user;
  }

  // --------------------------------------------------
  // GLOBAL ADMIN TEST
  // --------------------------------------------------

  @Get('admin-test')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Global Admin')
  adminTest(@Req() request: any) {
    return {
      message:
        'Global Admin access granted.',
      user: request.user,
    };
  }
}