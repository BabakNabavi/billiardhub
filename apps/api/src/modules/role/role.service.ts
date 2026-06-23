// apps/api/src/modules/role/role.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleRequest } from './role-request.entity';
import { User } from '../user/user.entity';

const ADMIN_UUID = 'eba4e069-81c5-42ac-90c0-dbe188d56b98';

const ROLE_PROFILE_FIELD: Record<string, string> = {
  player:       'playerProfile',
  coach:        'coachProfile',
  referee:      'refereeProfile',
  manufacturer: 'manufacturerProfile',
  installer:    'installerProfile',
  seller:       'sellerProfile',
};

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleRequest)
    private roleRequestRepo: Repository<RoleRequest>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getMyRequests(userId: string): Promise<RoleRequest[]> {
    return this.roleRequestRepo.find({
      where: { userId },
      order: { requestedAt: 'ASC' },
    });
  }

  async requestRole(
    userId: string,
    role: string,
    docUrl?: string,
  ): Promise<RoleRequest> {
    // ادمین نمی‌تونه درخواست نقش بده
    const requester = await this.userRepo.findOne({ where: { id: userId } });
    if (
      requester?.primaryRole === 'admin' ||
      userId === ADMIN_UUID
    ) {
      throw new BadRequestException('ادمین نمی‌تواند درخواست نقش ثبت کند');
    }

    const validRoles = [
      'user', 'player', 'coach', 'referee',
      'technician', 'seller', 'manufacturer', 'club_owner',
    ];
    if (!validRoles.includes(role)) {
      throw new BadRequestException('نقش نامعتبر است');
    }

    const existing = await this.roleRequestRepo.findOne({
      where: { userId, role },
    });

    if (existing) {
      if (existing.status === 'approved') {
        throw new BadRequestException('این نقش قبلاً تأیید شده است');
      }
      existing.status = 'pending';
      existing.docUrl = docUrl ?? existing.docUrl;
      existing.rejectionNote = null;
      existing.reviewedAt = null;
      existing.reviewedBy = null;
      existing.requestedAt = new Date();
      return this.roleRequestRepo.save(existing);
    }

    const req = this.roleRequestRepo.create({
      userId,
      role,
      status: 'pending',
      docUrl: docUrl ?? null,
    });
    return this.roleRequestRepo.save(req);
  }

  async saveRoleProfile(
    userId: string,
    role: string,
    profileData: Record<string, unknown>,
  ): Promise<User> {
    const req = await this.roleRequestRepo.findOne({
      where: { userId, role },
    });
    if (!req || req.status !== 'approved') {
      throw new ForbiddenException('این نقش هنوز تأیید نشده است');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const field = ROLE_PROFILE_FIELD[role];
    if (field) {
      (user as any)[field] = profileData;
    }

    if (!user.secondaryRoles) user.secondaryRoles = [];
    if (
      user.primaryRole !== role &&
      !user.secondaryRoles.includes(role)
    ) {
      user.secondaryRoles = [...user.secondaryRoles, role];
    }

    user.isProfileComplete = true;
    return this.userRepo.save(user);
  }

  async getRoleProfile(
    userId: string,
    role: string,
  ): Promise<Record<string, unknown> | null> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const field = ROLE_PROFILE_FIELD[role];
    if (!field) return null;
    return (user as any)[field] ?? null;
  }

  async getRequests(status?: string): Promise<any[]> {
    const qb = this.roleRequestRepo
      .createQueryBuilder('rr')
      .leftJoinAndSelect('rr.user', 'u')
      .orderBy('rr.requestedAt', 'ASC');

    if (status) {
      qb.where('rr.status = :status', { status });
    }

    const rows = await qb.getMany();

    return rows.map(r => ({
      id: r.id,
      role: r.role,
      status: r.status,
      docUrl: r.docUrl,
      rejectionNote: r.rejectionNote,
      requestedAt: r.requestedAt,
      reviewedAt: r.reviewedAt,
      user: {
        id: r.user?.id,
        firstName: r.user?.firstName,
        lastName: r.user?.lastName,
        phone: r.user?.phone,
      },
    }));
  }

  async reviewRequest(
    adminId: string,
    requestId: string,
    action: 'approve' | 'reject',
    note?: string,
  ): Promise<RoleRequest> {
    const req = await this.roleRequestRepo.findOne({
      where: { id: requestId },
    });
    if (!req) throw new NotFoundException('درخواست یافت نشد');

    req.status = action === 'approve' ? 'approved' : 'rejected';
    req.reviewedAt = new Date();
    req.reviewedBy = adminId;
    if (action === 'reject' && note) req.rejectionNote = note;

    const saved = await this.roleRequestRepo.save(req);

    if (action === 'approve') {
      await this.grantRole(req.userId, req.role);
    }

    return saved;
  }

  private async grantRole(userId: string, role: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    if (!user.secondaryRoles) user.secondaryRoles = [];

    // ادمین رو دست نزن
    if (
      user.primaryRole === 'admin' ||
      userId === ADMIN_UUID
    ) {
      if (!user.secondaryRoles.includes(role)) {
        user.secondaryRoles = [...user.secondaryRoles, role];
      }
      await this.userRepo.save(user);
      return;
    }

    if (user.primaryRole === 'user' && role !== 'user') {
      user.primaryRole = role;
    } else if (
      user.primaryRole !== role &&
      !user.secondaryRoles.includes(role)
    ) {
      user.secondaryRoles = [...user.secondaryRoles, role];
    }

    user.verificationStatus = 'verified';
    await this.userRepo.save(user);
  }
}
