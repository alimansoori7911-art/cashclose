import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

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
}
