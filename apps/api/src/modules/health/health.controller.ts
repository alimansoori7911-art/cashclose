import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { Public } from '../../common/decorators/roles.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  // بدون توکن در دسترس است: ابزارهای پایش و Load Balancer باید بتوانند
  // پیش از هر احراز هویتی وضعیت سرویس را بخوانند.
  @Public()
  @Get()
  @ApiOperation({ summary: 'بررسی سلامت سرویس و اتصال دیتابیس' })
  check() {
    return this.health.check();
  }

  /**
   * زنده‌بودن پروسه — بدون تماس با دیتابیس.
   *
   * ارکستراتور با این تصمیم می‌گیرد که پروسه را **ری‌استارت** کند. اگر
   * اینجا هم دیتابیس چک می‌شد، یک قطعی موقت دیتابیس باعث ری‌استارت
   * بی‌فایدهٔ همهٔ نمونه‌ها می‌شد.
   */
  @Public()
  @Get('live')
  @ApiOperation({ summary: 'زنده‌بودن پروسه' })
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * آمادگی پذیرش ترافیک.
   *
   * برخلاف `live`، قطعی دیتابیس اینجا ۵۰۳ می‌دهد تا Load Balancer
   * ترافیک را به این نمونه نفرستد — بدون آنکه پروسه کشته شود.
   */
  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'آمادگی پذیرش ترافیک' })
  @HttpCode(HttpStatus.OK)
  async ready(@Res({ passthrough: true }) response: Response) {
    const report = await this.health.check();

    if (report.database !== 'up') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return report;
  }

  /**
   * تأیید نام میزبان برای صدور گواهی HTTPS.
   *
   * Caddy پیش از گرفتن گواهیِ درخواستی، این مسیر را می‌پرسد. بدون آن،
   * هر کسی می‌توانست دامنهٔ خودش را به آی‌پی این سرور اشاره دهد و ما را
   * وادار به صدور گواهی کند — راهی برای رسیدن به سقف نرخ Let's Encrypt
   * و از کار انداختن صدور گواهی مشتریان واقعی.
   *
   * فقط زیردامنه‌ای پذیرفته می‌شود که مجموعه‌ای فعال با همان `slug`
   * وجود داشته باشد.
   */
  @Public()
  @Get('tls-check')
  @ApiOperation({ summary: 'تأیید دامنه پیش از صدور گواهی' })
  async tlsCheck(
    @Query('domain') domain: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const allowed = await this.health.isKnownHost(domain);

    if (!allowed) {
      response.status(HttpStatus.NOT_FOUND);
      return { allowed: false };
    }

    return { allowed: true };
  }
}
