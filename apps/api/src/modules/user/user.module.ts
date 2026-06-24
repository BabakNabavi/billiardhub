import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { join } from 'path';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MulterModule.register({
      dest: join(process.cwd(), 'uploads', 'avatars'),
    }),
  ],
  providers: [UserService, ProfileService],
  controllers: [UserController, ProfileController],
  exports: [UserService],
})
export class UserModule {}