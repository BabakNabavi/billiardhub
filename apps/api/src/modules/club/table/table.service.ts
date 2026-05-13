import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table, TableType } from '../table.entity';

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
  ) {}

  async create(data: {
    clubId: string;
    number: number;
    name: string;
    type: TableType;
    brand?: string;
    model?: string;
    description?: string;
    pricePerHour?: number;
  }): Promise<Table> {
    const table = this.tableRepository.create(data);
    return this.tableRepository.save(table);
  }

  async findByClub(clubId: string): Promise<Table[]> {
    return this.tableRepository.find({
      where: { clubId, isActive: true },
      order: { number: 'ASC' },
    });
  }

  async findById(id: string): Promise<Table> {
    const table = await this.tableRepository.findOne({ where: { id } });
    if (!table) throw new NotFoundException('میز پیدا نشد');
    return table;
  }

  async update(id: string, data: Partial<Table>): Promise<Table> {
    const table = await this.findById(id);
    Object.assign(table, data);
    return this.tableRepository.save(table);
  }
}