import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors({ origin: '*' });
    app.setGlobalPrefix('api');
    const port = process.env.PORT ?? 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`Backend running on port ${port}`);
  } catch (err) {
    console.error('STARTUP ERROR:', err);
    process.exit(1);
  }
}
bootstrap();