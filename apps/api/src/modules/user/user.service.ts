import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
  return this.userRepository
    .createQueryBuilder('user')
    .addSelect('user.password')
    .where('user.phone = :phone', { phone })
    .getOne();
}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async create(data: {
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.userRepository.create({
      ...data,
      password: hashedPassword,
      primaryRole: 'user',
      secondaryRoles: [],
      isProfileComplete: false,
      verificationStatus: 'unverified',
    });
    return this.userRepository.save(user);
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async updateProfile(id: string, data: any): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error('کاربر پیدا نشد');
    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  async verify(id: string, status: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error('کاربر پیدا نشد');
    user.verificationStatus = status;
    return this.userRepository.save(user);
  }

  async findByRole(role: string): Promise<Partial<User>[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.primaryRole = :role OR :role = ANY(user.secondaryRoles)', { role })
      .andWhere('user.isActive = true')
      .andWhere('user.isProfileComplete = true')
      .getMany();

    return users.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      primaryRole: u.primaryRole,
      secondaryRoles: u.secondaryRoles,
      verificationStatus: u.verificationStatus,
      bio: u.bio,
      city: u.city,
      avatar: u.avatar,
      playerProfile: u.playerProfile,
      coachProfile: u.coachProfile,
      refereeProfile: u.refereeProfile,
      manufacturerProfile: u.manufacturerProfile,
      installerProfile: u.installerProfile,
      sellerProfile: u.sellerProfile,
    }));
  }
}