import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());

  // همهٔ مسیرها زیر /api/v1 قرار می‌گیرند (بند ۹ سند).
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      // فیلدهای تعریف‌نشده حذف می‌شوند تا داده‌های ناخواسته وارد مدل نشوند.
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const corsOrigins = config
    .get<string>('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({ origin: corsOrigins, credentials: true });

  // مستندات API فقط در محیط غیرتولیدی سرو می‌شود.
  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('سامانهٔ صندوق روزانه')
      .setDescription('API مدیریت صندوق روزانهٔ فروشگاه')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
    );
  }

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`سرویس API روی پورت ${port} اجرا شد → http://localhost:${port}/api/v1`);
}

void bootstrap();
