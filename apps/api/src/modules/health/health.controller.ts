import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
}
