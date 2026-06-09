import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — Netlify + local
  app.enableCors({
  origin: [
    'https://astounding-bunny-08f3b8.netlify.app',
    'https://billiard-plus.vercel.app',
    'https://billiard-plus-5g5n5b2zu-babaknabavis-projects.vercel.app',
    'http://localhost:3000',
  ],
  credentials: true,
});

  // Global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🚀 Backend running on port ${port}`);
}
bootstrap();
