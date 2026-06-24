import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClubModule } from './modules/club/club.module';
import { ProductModule } from './modules/product/product.module';
import { BookingsModule } from './bookings/bookings.module';
import { RoleModule } from './modules/role/role.module';
import { VerifyModule } from './modules/auth/verify.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
      retryAttempts: 10,
      retryDelay: 3000,
      ssl: { rejectUnauthorized: false },
    }),
    UserModule,
    AuthModule,
    ClubModule,
    ProductModule,
    BookingsModule,
    RoleModule,
    VerifyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}