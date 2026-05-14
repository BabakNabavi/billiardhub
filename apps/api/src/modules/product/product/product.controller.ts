import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtGuard } from '../../auth/jwt/jwt.guard';

@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('condition') condition?: string,
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('isVerified') isVerified?: string,
    @Query('isDailyDeal') isDailyDeal?: string,
    @Query('isSpecialSale') isSpecialSale?: string,
    @Query('search') search?: string,
  ) {
    return this.productService.findAll({
      category,
      condition,
      city,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      isVerified: isVerified === 'true',
      isDailyDeal: isDailyDeal === 'true',
      isSpecialSale: isSpecialSale === 'true',
      search,
    });
  }

  @Get('my-products')
  @UseGuards(JwtGuard)
  findMyProducts(@Request() req: any) {
    return this.productService.findBySeller(req.user.id);
  }

  @Get('daily-deals')
  findDailyDeals() {
    return this.productService.findAll({ isDailyDeal: true });
  }

  @Get('special-sale')
  findSpecialSale() {
    return this.productService.findAll({ isSpecialSale: true });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() body: any, @Request() req: any) {
    return this.productService.create({
      ...body,
      sellerId: req.user.id,
    });
  }

  @Put(':id')
  @UseGuards(JwtGuard)
  update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.productService.update(id, req.user.id, body);
  }

  @Post(':id/request-verification')
  @UseGuards(JwtGuard)
  requestVerification(@Param('id') id: string, @Request() req: any) {
    return this.productService.requestVerification(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  delete(@Param('id') id: string, @Request() req: any) {
    return this.productService.delete(id, req.user.id);
  }
}