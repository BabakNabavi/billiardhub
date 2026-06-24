// apps/api/src/modules/user/profile.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ─── دریافت پروفایل کامل ─────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.bankCard')
      .where('u.id = :id', { id: userId })
      .getOne();

    if (!user) throw new NotFoundException('کاربر یافت نشد');

    return {
      id:                 user.id,
      firstName:          user.firstName,
      lastName:           user.lastName,
      phone:              user.phone,
      email:              user.email,
      avatar:             user.avatar,
      bio:                user.bio,
      province:           user.province,
      city:               user.city,
      birthDate:          user.birthDate,
      gender:             user.gender,
      instagram:          user.instagram,
      telegram:           user.telegram,
      nationalId:         user.nationalId ? `***${user.nationalId.slice(-4)}` : null,
      nationalIdVerified: user.nationalIdVerified,
      phoneVerified:      user.phoneVerified,
      emailVerified:      user.emailVerified,
      verificationStatus: user.verificationStatus,
      isProfileComplete:  user.isProfileComplete,
      primaryRole:        user.primaryRole,
      secondaryRoles:     user.secondaryRoles,
      clubId:             user.clubId,
      clubNameManual:     user.clubNameManual,
      bankCard:           user.bankCard ? `****-****-****-${user.bankCard.slice(-4)}` : null,
      bankCardOwner:      user.bankCardOwner,
      createdAt:          user.createdAt,
    };
  }

  // ─── ذخیره پروفایل ───────────────────────────────────────
  async updateProfile(userId: string, data: Partial<User>): Promise<{ success: boolean }> {
    const allowed = ['bio', 'province', 'city', 'birthDate', 'gender', 'instagram', 'telegram'];
    const update: Partial<User> = {};
    for (const key of allowed) {
      if ((data as any)[key] !== undefined) (update as any)[key] = (data as any)[key];
    }

    await this.userRepo.update(userId, update);

    // چک تکمیل پروفایل
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user && user.firstName && user.city && user.nationalIdVerified) {
      await this.userRepo.update(userId, { isProfileComplete: true });
    }

    return { success: true };
  }

  // ─── آپدیت آواتار ────────────────────────────────────────
  async updateAvatar(userId: string, url: string): Promise<{ success: boolean }> {
    await this.userRepo.update(userId, { avatar: url });
    return { success: true };
  }

  // ─── جستجو باشگاه ────────────────────────────────────────
  async searchClubs(q: string): Promise<{ id: string; name: string; city: string; memberCount?: number }[]> {
    if (!q || q.length < 1) {
      // برگردوندن ۲۰ باشگاه اول
      const result = await this.userRepo.manager.query(`
        SELECT id, name, city,
               (SELECT COUNT(*) FROM users WHERE club_id = clubs.id) as "memberCount"
        FROM clubs
        WHERE is_active = true
        ORDER BY name
        LIMIT 20
      `);
      return result;
    }

    const result = await this.userRepo.manager.query(`
      SELECT id, name, city,
             (SELECT COUNT(*) FROM users WHERE club_id = clubs.id) as "memberCount"
      FROM clubs
      WHERE is_active = true
        AND (name ILIKE $1 OR city ILIKE $1)
      ORDER BY name
      LIMIT 10
    `, [`%${q}%`]);

    return result;
  }

  // ─── انتخاب باشگاه + آپدیت عضویت ────────────────────────
  async setClub(
    userId: string,
    clubId?: string,
    clubNameManual?: string,
  ): Promise<{ success: boolean }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const oldClubId = user.clubId;

    // اگه باشگاه از لیست انتخاب شده
    if (clubId) {
      // کم کردن از باشگاه قدیمی
      if (oldClubId && oldClubId !== clubId) {
        // (اگه جدول clubs شمارنده داشت اینجا update می‌کردیم)
      }
      await this.userRepo.update(userId, { clubId, clubNameManual: null });
    } else if (clubNameManual) {
      await this.userRepo.update(userId, { clubId: null, clubNameManual });
    }

    return { success: true };
  }

  // ─── ثبت کارت بانکی ──────────────────────────────────────
  async setBankCard(
    userId: string,
    bankCard: string,
    bankCardOwner: string,
  ): Promise<{ success: boolean }> {
    await this.userRepo.update(userId, { bankCard, bankCardOwner });
    return { success: true };
  }
}
