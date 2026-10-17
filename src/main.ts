import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RateLimitMiddleware } from './shared/rate-limit/rate-limit.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  app.enableCors({
    origin: process.env.ALLOWED_ORIGIN?.split(',').map((value) => value.trim()) ?? true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const rateLimit = app.get(RateLimitMiddleware);
  app.use(rateLimit.use.bind(rateLimit));
  await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0');
}

void bootstrap();
