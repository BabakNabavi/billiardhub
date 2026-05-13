import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubService } from './club.service';
import { ClubController } from './club.controller';
import { Club } from './club.entity';
import { Table } from './table.entity';
import { TableService } from './table/table.service';
import { TableController } from './table/table.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Club, Table])],
  providers: [ClubService, TableService],
  controllers: [ClubController, TableController],
  exports: [ClubService],
})
export class ClubModule {}