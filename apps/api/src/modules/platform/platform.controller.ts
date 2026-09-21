import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TenantStatus } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/roles.decorator';
import {
  CreateTenantDto,
  PlatformLoginDto,
  ResetOwnerPasswordDto,
} from './dto/create-tenant.dto';
import {
  CurrentAdmin,
  PlatformAuthGuard,
} from './platform-auth.guard';
import type { RequestAdmin } from './platform-jwt.strategy';
import { PlatformAuthService } from './services/platform-auth.service';
import { OwnerRecoveryService } from './services/owner-recovery.service';
import { ProvisioningService } from './services/provisioning.service';
import { TenantAdminService } from './services/tenant-admin.service';

/**
 * مسیرهای مدیر سامانه — سازندهٔ محصول، نه مشتری.
 *
 * `@Public()` اینجا یعنی «محافظ کاربران را رد کن»، نه «باز برای همه»:
 * محافظ سراسری `JwtAuthGuard` توکن مدیر سامانه را نمی‌شناسد چون در
 * جدول `users` نیست. جایش `PlatformAuthGuard` صریح گذاشته شده که فقط
 * توکن با نشانگر `platform-admin` را می‌پذیرد.
 *
 * هیچ مسیری اینجا به دادهٔ داخل مجموعه‌ها دسترسی ندارد — فقط ساخت،
 * فهرست و تغییر وضعیت.
 */
@ApiTags('platform')
@Controller('platform')
export class PlatformController {
  constructor(
    private readonly auth: PlatformAuthService,
    private readonly provisioning: ProvisioningService,
    private readonly tenants: TenantAdminService,
    private readonly recovery: OwnerRecoveryService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  // سقف سخت‌گیرانه‌تر از ورود عادی: این حساب به همهٔ مجموعه‌ها دسترسی
  // ساخت دارد.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'ورود مدیر سامانه' })
  login(@Body() dto: PlatformLoginDto) {
    return this.auth.login(dto.username, dto.password);
  }

  @Public()
  @UseGuards(PlatformAuthGuard)
  @ApiBearerAuth()
  @Get('tenants')
  @ApiOperation({ summary: 'فهرست کسب‌وکارها' })
  list() {
    return this.tenants.list();
  }

  @Public()
  @UseGuards(PlatformAuthGuard)
  @ApiBearerAuth()
  @Post('tenants')
  @ApiOperation({ summary: 'ساخت کسب‌وکار تازه به‌همراه حساب مالک' })
  create(@CurrentAdmin() admin: RequestAdmin, @Body() dto: CreateTenantDto) {
    return this.provisioning.create(admin.id, dto);
  }

  @Public()
  @UseGuards(PlatformAuthGuard)
  @ApiBearerAuth()
  @Get('tenants/:id/owners')
  @ApiOperation({ summary: 'مالکان یک مجموعه — برای بازنشانی رمز' })
  owners(@Param('id', ParseUUIDPipe) id: string) {
    return this.recovery.listOwners(id);
  }

  /**
   * بازنشانی رمز مالک.
   *
   * تنها راه نجات وقتی خودِ مالک رمزش را فراموش کند؛ بالادستی‌ای در آن
   * مجموعه نیست. فقط نقش مالک پذیرفته می‌شود.
   */
  @Public()
  @UseGuards(PlatformAuthGuard)
  @ApiBearerAuth()
  @Patch('tenants/:id/owner-password')
  @ApiOperation({ summary: 'بازنشانی رمز مالک مجموعه' })
  resetOwner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetOwnerPasswordDto,
  ) {
    return this.recovery.resetOwnerPassword(id, dto.userId, dto.newPassword);
  }

  @Public()
  @UseGuards(PlatformAuthGuard)
  @ApiBearerAuth()
  @Patch('tenants/:id/suspend')
  @ApiOperation({ summary: 'تعلیق کسب‌وکار — ورود کاربرانش بسته می‌شود' })
  suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenants.setStatus(id, TenantStatus.suspended);
  }

  @Public()
  @UseGuards(PlatformAuthGuard)
  @ApiBearerAuth()
  @Patch('tenants/:id/activate')
  @ApiOperation({ summary: 'فعال‌سازی دوبارهٔ کسب‌وکار' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenants.setStatus(id, TenantStatus.active);
  }
}
