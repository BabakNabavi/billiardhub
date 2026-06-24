// apps/api/src/modules/user/profile.controller.ts
import {
  Controller, Get, Put, Post, Body,
  Request, UseGuards, Query,
  BadRequestException, UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { ProfileService } from './profile.service';

@Controller('user/profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  // GET /user/profile/me — اطلاعات کامل پروفایل
  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@Request() req: any) {
    return this.profileService.getProfile(req.user.id);
  }

  // PUT /user/profile — ذخیره پروفایل
  @Put()
  @UseGuards(JwtGuard)
  async updateProfile(@Request() req: any, @Body() body: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id, body);
  }

  // POST /user/profile/avatar — آپلود عکس پروفایل
  @Post('avatar')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'avatars'),
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('فقط تصویر مجاز است'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
    }),
  )
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('فایلی ارسال نشده');
    const baseUrl = process.env.API_URL ?? 'http://localhost:3001';
    const url = `${baseUrl}/uploads/avatars/${file.filename}`;
    await this.profileService.updateAvatar(req.user.id, url);
    return { url };
  }

  // GET /user/profile/clubs?q=... — جستجو باشگاه
  @Get('clubs')
  async searchClubs(@Query('q') q: string) {
    return this.profileService.searchClubs(q ?? '');
  }

  // PUT /user/profile/club — انتخاب باشگاه
  @Put('club')
  @UseGuards(JwtGuard)
  async setClub(
    @Request() req: any,
    @Body() body: { clubId?: string; clubNameManual?: string },
  ) {
    return this.profileService.setClub(
      req.user.id,
      body.clubId,
      body.clubNameManual,
    );
  }

  // PUT /user/profile/bank-card — ثبت کارت بانکی
  @Put('bank-card')
  @UseGuards(JwtGuard)
  async setBankCard(
    @Request() req: any,
    @Body() body: { bankCard: string; bankCardOwner: string },
  ) {
    if (!body.bankCard || body.bankCard.replace(/\s/g, '').length !== 16) {
      throw new BadRequestException('شماره کارت باید ۱۶ رقم باشد');
    }
    return this.profileService.setBankCard(
      req.user.id,
      body.bankCard.replace(/\s/g, ''),
      body.bankCardOwner,
    );
  }
}

// ─── DTO ──────────────────────────────────────────────────────
class UpdateProfileDto {
  bio?: string;
  province?: string;
  city?: string;
  birthDate?: string;
  gender?: string;
  instagram?: string;
  telegram?: string;
}
