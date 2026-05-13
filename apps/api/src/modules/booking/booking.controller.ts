import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingStatus, TableType } from './booking.entity';
import { JwtGuard } from '../auth/jwt/jwt.guard';

class CreateBookingDto {
  clubId: string;
  tableType: TableType;
  tableNumber: number;
  startTime: string;
  endTime: string;
  totalPrice?: number;
  currency?: string;
  notes?: string;
}

@Controller('bookings')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() body: CreateBookingDto, @Request() req: any) {
    return this.bookingService.create({
      ...body,
      userId: req.user.id,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    });
  }

  @Get('my-bookings')
  @UseGuards(JwtGuard)
  findMyBookings(@Request() req: any) {
    return this.bookingService.findByUser(req.user.id);
  }

  @Get('club/:clubId')
  @UseGuards(JwtGuard)
  findByClub(@Param('clubId') clubId: string) {
    return this.bookingService.findByClub(clubId);
  }

  @Get('slots')
  getSlots(
    @Query('clubId') clubId: string,
    @Query('tableNumber') tableNumber: string,
    @Query('date') date: string,
  ) {
    return this.bookingService.getTableSlots(clubId, parseInt(tableNumber), date);
  }

  @Get('availability')
  checkAvailability(
    @Query('clubId') clubId: string,
    @Query('tableNumber') tableNumber: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.bookingService.checkAvailability(
      clubId,
      parseInt(tableNumber),
      new Date(startTime),
      new Date(endTime),
    );
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string) {
    return this.bookingService.findById(id);
  }

  @Put(':id/status')
  @UseGuards(JwtGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookingService.updateStatus(id, status);
  }
}