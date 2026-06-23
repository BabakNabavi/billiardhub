// apps/api/src/modules/role/role.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { join } from 'path';
import { RoleRequest } from './role-request.entity';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleRequest, User]),
    MulterModule.register({
      dest: join(process.cwd(), 'uploads', 'role-docs'),
    }),
  ],
  providers: [RoleService],
  controllers: [RoleController],
  exports: [RoleService],
})
export class RoleModule {}
