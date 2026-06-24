// apps/api/src/modules/auth/verify.controller.ts
import {
  Controller, Post, Body, Request,
  UseGuards, BadRequestException, HttpCode,
} from '@nestjs/common';
import { JwtGuard } from './jwt/jwt.guard';
import { VerifyService } from './verify.service';

@Controller('auth/verify')
export class VerifyController {
  constructor(private verifyService: VerifyService) {}

  // ─── مرحله ۱: استعلام کد ملی ─────────────────────────────
  // POST /auth/verify/national-id
  // body: { nationalId, firstName, lastName }
  @Post('national-id')
  @UseGuards(JwtGuard)
  @HttpCode(200)
  async verifyNationalId(
    @Request() req: any,
    @Body() body: { nationalId: string; firstName: string; lastName: string },
  ) {
    const { nationalId, firstName, lastName } = body;

    if (!nationalId || nationalId.length !== 10) {
      throw new BadRequestException('کد ملی باید ۱۰ رقم باشد');
    }
    if (!firstName || !lastName) {
      throw new BadRequestException('نام و نام خانوادگی الزامی است');
    }

    return this.verifyService.verifyNationalId(
      req.user.id,
      nationalId,
      firstName,
      lastName,
    );
  }

  // ─── مرحله ۲: ارسال OTP به موبایل ───────────────────────
  // POST /auth/verify/otp/send
  @Post('otp/send')
  @UseGuards(JwtGuard)
  @HttpCode(200)
  async sendOtp(@Request() req: any) {
    return this.verifyService.sendOtp(req.user.id);
  }

  // ─── مرحله ۳: تأیید کد OTP ───────────────────────────────
  // POST /auth/verify/otp/confirm
  // body: { code }
  @Post('otp/confirm')
  @UseGuards(JwtGuard)
  @HttpCode(200)
  async confirmOtp(@Request() req: any, @Body() body: { code: string }) {
    if (!body.code || body.code.length !== 6) {
      throw new BadRequestException('کد تأیید باید ۶ رقم باشد');
    }
    return this.verifyService.confirmOtp(req.user.id, body.code);
  }
}
