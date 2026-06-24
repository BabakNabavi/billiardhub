// apps/api/src/modules/auth/verify.service.ts
import {
  Injectable,
  BadRequestException,
  UnprocessableEntityException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import * as crypto from 'crypto';

const APIIR_KEY       = process.env.APIIR_KEY ?? 'YOUR_APIIR_KEY';
const KAVENEGAR_KEY   = process.env.KAVENEGAR_API_KEY ?? 'YOUR_KAVENEGAR_KEY';
const OTP_EXPIRE_MIN  = 2;    // کد OTP ۲ دقیقه اعتبار دارد
const OTP_MAX_ATTEMPT = 5;    // حداکثر ۵ بار تلاش اشتباه

@Injectable()
export class VerifyService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ─── مرحله ۱: استعلام کد ملی از api.ir ──────────────────
  async verifyNationalId(
    userId: string,
    nationalId: string,
    firstName: string,
    lastName: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.phone')
      .where('u.id = :id', { id: userId })
      .getOne();

    if (!user) throw new BadRequestException('کاربر یافت نشد');
    if (user.nationalIdVerified) throw new BadRequestException('کد ملی قبلاً تأیید شده است');

    // اگه API key نداریم (محیط dev)، mock می‌کنیم
    if (APIIR_KEY === 'YOUR_APIIR_KEY') {
      // Mock برای محیط development
      const mockMatch =
        firstName.trim() === user.firstName.trim() &&
        lastName.trim() === user.lastName.trim();

      if (!mockMatch) {
        throw new UnprocessableEntityException(
          'نام و نام خانوادگی با کد ملی مطابقت ندارد (حالت تست)',
        );
      }

      await this.userRepo.update(userId, { nationalId });
      return { success: true, message: 'کد ملی در حالت تست تأیید شد' };
    }

    // ─── استعلام واقعی از api.ir ─────────────────────────
    try {
      const res = await fetch('https://api.api.ir/v1/national-id/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': APIIR_KEY,
        },
        body: JSON.stringify({
          nationalCode: nationalId,
          firstName,
          lastName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.matched) {
        throw new UnprocessableEntityException(
          'نام و نام خانوادگی با کد ملی مطابقت ندارد',
        );
      }

      await this.userRepo.update(userId, { nationalId });
      return { success: true, message: 'کد ملی با موفقیت تأیید شد' };
    } catch (err: any) {
      if (err instanceof UnprocessableEntityException) throw err;
      throw new InternalServerErrorException('خطا در استعلام کد ملی');
    }
  }

  // ─── مرحله ۲: ارسال OTP با Kavenegar ────────────────────
  async sendOtp(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.phone')
      .addSelect('u.otpCode')
      .where('u.id = :id', { id: userId })
      .getOne();

    if (!user) throw new BadRequestException('کاربر یافت نشد');
    if (!user.phone) throw new BadRequestException('شماره موبایل ثبت نشده');
    if (user.phoneVerified) throw new BadRequestException('موبایل قبلاً تأیید شده است');

    // جلوگیری از ارسال مکرر (cooldown 1 دقیقه)
    if (user.otpExpiresAt) {
      const remaining = new Date(user.otpExpiresAt).getTime() - Date.now()
      const cooldown  = (OTP_EXPIRE_MIN * 60 - 60) * 1000  // ۱ دقیقه قبل از انقضا
      if (remaining > cooldown) {
        throw new BadRequestException('لطفاً یک دقیقه صبر کنید');
      }
    }

    // تولید کد ۶ رقمی
    const code    = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + OTP_EXPIRE_MIN * 60 * 1000);

    await this.userRepo.update(userId, {
      otpCode:      code,
      otpExpiresAt: expires,
      otpAttempts:  0,
    });

    // ارسال پیامک
    if (KAVENEGAR_KEY === 'YOUR_KAVENEGAR_KEY') {
      // Mock: در محیط dev کد رو برمی‌گردونیم
      console.log(`[DEV] OTP for ${user.phone}: ${code}`);
      return { success: true, message: `کد تأیید (تست): ${code}` };
    }

    try {
      const url = `https://api.kavenegar.com/v1/${KAVENEGAR_KEY}/verify/lookup.json`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          receptor: user.phone,
          token:    code,
          template: 'verify',  // نام template در پنل Kavenegar
        }),
      });

      if (!res.ok) throw new Error('Kavenegar error');
      return { success: true, message: 'کد تأیید ارسال شد' };
    } catch {
      throw new InternalServerErrorException('خطا در ارسال پیامک');
    }
  }

  // ─── مرحله ۳: تأیید کد OTP ───────────────────────────────
  async confirmOtp(
    userId: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.otpCode')
      .addSelect('u.otpAttempts')
      .addSelect('u.otpExpiresAt')
      .where('u.id = :id', { id: userId })
      .getOne();

    if (!user) throw new BadRequestException('کاربر یافت نشد');

    // بررسی تعداد تلاش
    if (user.otpAttempts >= OTP_MAX_ATTEMPT) {
      throw new BadRequestException('تعداد تلاش‌های مجاز تمام شد. لطفاً مجدداً درخواست کد کنید');
    }

    // بررسی انقضا
    if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
      throw new BadRequestException('کد تأیید منقضی شده است');
    }

    // بررسی کد
    if (user.otpCode !== code) {
      await this.userRepo.update(userId, { otpAttempts: (user.otpAttempts ?? 0) + 1 });
      throw new BadRequestException('کد تأیید اشتباه است');
    }

    // ✅ تأیید موفق
    await this.userRepo.update(userId, {
      phoneVerified:      true,
      verificationStatus: 'verified',
      otpCode:            null,
      otpExpiresAt:       null,
      otpAttempts:        0,
    });

    return { success: true, message: 'شماره موبایل با موفقیت تأیید شد' };
  }
}
