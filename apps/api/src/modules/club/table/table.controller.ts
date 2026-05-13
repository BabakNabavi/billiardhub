import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TableService } from './table.service';
import { TableType } from '../table.entity';
import { JwtGuard } from '../../auth/jwt/jwt.guard';

class CreateTableDto {
  number: number;
  name: string;
  type: TableType;
  brand?: string;
  model?: string;
  description?: string;
  pricePerHour?: number;
}

@Controller('clubs/:clubId/tables')
export class TableController {
  constructor(private tableService: TableService) {}

  @Get()
  findAll(@Param('clubId') clubId: string) {
    return this.tableService.findByClub(clubId);
  }

  @Post()
  @UseGuards(JwtGuard)
  create(@Param('clubId') clubId: string, @Body() body: CreateTableDto) {
    return this.tableService.create({ ...body, clubId });
  }

  @Put(':tableId')
  @UseGuards(JwtGuard)
  update(@Param('tableId') tableId: string, @Body() body: Partial<CreateTableDto>) {
    return this.tableService.update(tableId, body);
  }
}