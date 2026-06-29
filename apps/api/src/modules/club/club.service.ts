import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from './club.entity';

@Injectable()
export class ClubService {
  constructor(
    @InjectRepository(Club)
    private clubRepository: Repository<Club>,
  ) {}

  async create(data: {
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
    ownerId: string;
  }): Promise<Club> {
    const club = this.clubRepository.create(data);
    return this.clubRepository.save(club);
  }

  async findAll(): Promise<Club[]> {
    return this.clubRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Club> {
    const club = await this.clubRepository.findOne({ where: { id } });
    if (!club) {
      throw new NotFoundException('باشگاه پیدا نشد');
    }
    return club;
  }

  async findByCity(city: string): Promise<Club[]> {
    return this.clubRepository.find({
      where: { city, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findNearby(lat: number, lng: number, radiusKm: number = 10): Promise<Club[]> {
    return this.clubRepository
      .createQueryBuilder('club')
      .where('club.isActive = true')
      .andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(club.latitude)) * cos(radians(club.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(club.latitude)))) < :radius`,
        { lat, lng, radius: radiusKm },
      )
      .orderBy(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(club.latitude)) * cos(radians(club.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(club.latitude))))`,
        'ASC',
      )
      .setParameter('lat', lat)
      .setParameter('lng', lng)
      .getMany();
  }

  async update(id: string, ownerId: string, data: Partial<Club>): Promise<Club> {
    const club = await this.findById(id);
    if (club.ownerId !== ownerId) {
      throw new ForbiddenException('شما مجاز به ویرایش این باشگاه نیستید');
    }
    Object.assign(club, data);
    return this.clubRepository.save(club);
  }

  async findByOwner(ownerId: string): Promise<Club[]> {
    return this.clubRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string, requesterId: string, isAdmin: boolean): Promise<void> {
    const club = await this.findById(id);
    if (!isAdmin && club.ownerId !== requesterId) {
      throw new ForbiddenException('شما مجاز به حذف این باشگاه نیستید');
    }
    await this.clubRepository.remove(club);
  }
}