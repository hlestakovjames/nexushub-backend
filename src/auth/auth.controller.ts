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
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createAccount(@Body() dto: CreateAccountDto) {
    return this.authService.createAccount(dto);
  }

  @Post('login')
  login(
    @Body() body: { email: string; password: string },
  ) {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() request: any) {
    return request.user;
  }

  @Get('admin-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Global Admin')
  adminTest(@Req() request: any) {
    return {
      message: 'Global Admin access granted.',
      user: request.user,
    };
  }
}