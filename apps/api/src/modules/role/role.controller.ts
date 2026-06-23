// apps/api/src/modules/role/role.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { RoleService } from './role.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { AdminGuard } from '../auth/jwt/admin.guard';

// ─── آپلود مدرک با multer ─────────────────────────────────────
const docStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'role-docs'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

const docFilter = (_req: any, file: any, cb: any) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
  if (!allowed.includes(extname(file.originalname).toLowerCase())) {
    return cb(new BadRequestException('فقط JPG، PNG یا PDF مجاز است'), false);
  }
  cb(null, true);
};

// ─── Controller ───────────────────────────────────────────────
@Controller('roles')
export class RoleController {
  constructor(private roleService: RoleService) {}

  // GET /roles/my — درخواست‌های کاربر فعلی
  @Get('my')
  @UseGuards(JwtGuard)
  async getMyRoles(@Request() req: any) {
    return this.roleService.getMyRequests(req.user.id);
  }

  // POST /roles/request — درخواست نقش جدید
  @Post('request')
  @UseGuards(JwtGuard)
  async requestRole(
    @Request() req: any,
    @Body() body: { role: string; docUrl?: string },
  ) {
    return this.roleService.requestRole(req.user.id, body.role, body.docUrl);
  }

  // POST /roles/upload-doc — آپلود مدرک
  @Post('upload-doc')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: docStorage,
      fileFilter: docFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadDoc(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('فایلی ارسال نشده');
    // URL برگشتی — base URL رو از env بخون
    const baseUrl = process.env.API_URL ?? 'http://localhost:3001';
    return { url: `${baseUrl}/uploads/role-docs/${file.filename}` };
  }

  // GET /roles/:role/profile — پروفایل تخصصی یک نقش
  @Get(':role/profile')
  @UseGuards(JwtGuard)
  async getProfile(@Request() req: any, @Param('role') role: string) {
    const profile = await this.roleService.getRoleProfile(req.user.id, role);
    return { profile };
  }

  // PUT /roles/:role/profile — ذخیره پروفایل تخصصی
  @Put(':role/profile')
  @UseGuards(JwtGuard)
  async saveProfile(
    @Request() req: any,
    @Param('role') role: string,
    @Body() body: Record<string, unknown>,
  ) {
    const user = await this.roleService.saveRoleProfile(req.user.id, role, body);
    return { success: true, userId: user.id };
  }

  // ─── Admin endpoints ─────────────────────────────────────────

  // GET /roles/admin/requests?status=pending
  @Get('admin/requests')
  @UseGuards(JwtGuard, AdminGuard)
  async getRequests(@Query('status') status?: string) {
    return this.roleService.getRequests(status);
  }

  // PATCH /roles/admin/review — تأیید یا رد
  @Patch('admin/review')
  @UseGuards(JwtGuard, AdminGuard)
  async reviewRequest(
    @Request() req: any,
    @Body() body: { id: string; action: 'approve' | 'reject'; note?: string },
  ) {
    return this.roleService.reviewRequest(
      req.user.id,
      body.id,
      body.action,
      body.note,
    );
  }
}
