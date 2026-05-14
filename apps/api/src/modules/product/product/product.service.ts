import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(data: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(data);
    return this.productRepository.save(product);
  }

  async findAll(filters?: {
    category?: string;
    condition?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    isVerified?: boolean;
    isDailyDeal?: boolean;
    isSpecialSale?: boolean;
    search?: string;
  }): Promise<Product[]> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.seller', 'seller')
      .where('product.status = :status', { status: 'active' });

    if (filters?.category) {
      query.andWhere('product.category = :category', { category: filters.category });
    }
    if (filters?.condition) {
      query.andWhere('product.condition = :condition', { condition: filters.condition });
    }
    if (filters?.city) {
      query.andWhere('product.city = :city', { city: filters.city });
    }
    if (filters?.minPrice) {
      query.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters?.maxPrice) {
      query.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }
    if (filters?.isVerified) {
      query.andWhere('product.isVerified = true');
    }
    if (filters?.isDailyDeal) {
      query.andWhere('product.isDailyDeal = true');
    }
    if (filters?.isSpecialSale) {
      query.andWhere('product.isSpecialSale = true');
    }
    if (filters?.search) {
      query.andWhere('product.title ILIKE :search', { search: `%${filters.search}%` });
    }

    return query.orderBy('product.createdAt', 'DESC').getMany();
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['seller'],
    });
    if (!product) throw new NotFoundException('محصول پیدا نشد');
    await this.productRepository.increment({ id }, 'views', 1);
    return product;
  }

  async findBySeller(sellerId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { sellerId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, sellerId: string, data: Partial<Product>): Promise<Product> {
    const product = await this.findById(id);
    if (product.sellerId !== sellerId) {
      throw new NotFoundException('دسترسی ندارید');
    }
    Object.assign(product, data);
    return this.productRepository.save(product);
  }

  async requestVerification(id: string, sellerId: string): Promise<Product> {
    const product = await this.findById(id);
    if (product.sellerId !== sellerId) {
      throw new NotFoundException('دسترسی ندارید');
    }
    product.requestedVerification = true;
    return this.productRepository.save(product);
  }

  async delete(id: string, sellerId: string): Promise<void> {
    const product = await this.findById(id);
    if (product.sellerId !== sellerId) {
      throw new NotFoundException('دسترسی ندارید');
    }
    product.status = 'inactive';
    await this.productRepository.save(product);
  }

  async getSpecialSaleInfo(): Promise<{ date: Date | null; isActive: boolean }> {
    // این رو بعداً از database می‌خونیم
    return { date: null, isActive: false };
  }
}