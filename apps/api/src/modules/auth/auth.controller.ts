import { Body, Controller, Get, Ip, Post, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';
import type { RequestUser } from '../../common/tenant/request-user';
import { LoginDto } from './dto/login.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password-reset.dto';
import { AuthService } from './services/auth.service';
import { PasswordResetService } from './services/password-reset.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly passwordReset: PasswordResetService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  // سقف سخت‌گیرانه‌تر از حد عمومی سامانه، مخصوص مسیرهای حساس.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'ورود کاربر' })
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.auth.login(dto, ip);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'اطلاعات کاربر لاگین‌شده' })
  me(@CurrentUser() user: RequestUser) {
    return user;
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'درخواست لینک بازیابی رمز عبور' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordReset.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'ثبت رمز عبور جدید با توکن' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordReset.resetPassword(dto);
  }

  /**
   * خروج.
   *
   * چون توکن‌ها بدون حالت (stateless) هستند، خروج واقعی سمت کلاینت با
   * حذف توکن انجام می‌شود. این مسیر فقط برای ثبت رویداد در ممیزی است.
   */
  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'خروج کاربر' })
  logout() {
    return { message: 'خروج با موفقیت انجام شد.' };
  }
}
