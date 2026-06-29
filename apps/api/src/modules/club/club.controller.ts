import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ClubService } from './club.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';

class CreateClubDto {
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  timezone?: string;
}

@Controller('clubs')
export class ClubController {
  constructor(private clubService: ClubService) {}

  @Get()
  findAll() {
    return this.clubService.findAll();
  }

  @Get('nearby')
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string,
  ) {
    return this.clubService.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : 10,
    );
  }

  @Get('city/:city')
  findByCity(@Param('city') city: string) {
    return this.clubService.findByCity(city);
  }

  @Get('my-clubs')
  @UseGuards(JwtGuard)
  findMyClubs(@Request() req: any) {
    return this.clubService.findByOwner(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clubService.findById(id);
  }

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() body: CreateClubDto, @Request() req: any) {
    return this.clubService.create({
      ...body,
      ownerId: req.user.id,
    });
  }

  @Put(':id')
  @UseGuards(JwtGuard)
  update(@Param('id') id: string, @Body() body: Partial<CreateClubDto>, @Request() req: any) {
    return this.clubService.update(id, req.user.id, body);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user.primaryRole === 'admin';
    return this.clubService.remove(id, req.user.id, isAdmin);
  }
}